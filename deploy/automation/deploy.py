#!/usr/bin/env python3
"""Deploy two fixed Compose applications using reviewed immutable image manifests."""
import argparse
from contextlib import closing
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import sys
import time
import urllib.request

REPOSITORIES = {'website': 'uc-website', 'scheduler': 'uc-website-scheduler', 'maintenance': 'uc-website-maintenance', 'try': 'uc-try'}


def atomic(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    temporary = path.with_suffix(path.suffix + '.partial')
    temporary.write_text(value)
    temporary.chmod(0o600)
    os.replace(temporary, path)


def save(path, value):
    atomic(path, json.dumps(value, indent=2) + '\n')


def backup(source, target):
    with closing(sqlite3.connect(f'file:{source}?mode=ro', uri=True)) as a, closing(sqlite3.connect(target)) as b:
        a.backup(b)
        if b.execute('PRAGMA integrity_check').fetchone()[0] != 'ok' or b.execute('PRAGMA foreign_key_check').fetchall():
            raise RuntimeError('SQLite backup validation failed')
    Path(target).chmod(0o600)


def validate(request, app):
    required = {'version', 'app', 'ref', 'source', 'runNumber', 'runAttempt', 'images'}
    if set(request) != required or request['version'] != 1 or request['app'] != app or request['ref'] != 'refs/heads/main':
        raise ValueError('Invalid release protocol, application or production branch')
    if not isinstance(request['source'], str) or not re.fullmatch('[a-f0-9]{40}', request['source']):
        raise ValueError('Invalid source revision')
    if any(type(request[k]) is not int or request[k] < 1 for k in ('runNumber', 'runAttempt')):
        raise ValueError('Invalid workflow run number')
    keys = {'website', 'scheduler', 'maintenance'} if app == 'website' else {'try'}
    if set(request['images']) != keys:
        raise ValueError('Incomplete release image set')
    for key, image in request['images'].items():
        if not isinstance(image, str) or not re.fullmatch(r'ghcr\.io/uniclipboard/' + REPOSITORIES[key] + r'@sha256:[a-f0-9]{64}', image):
            raise ValueError('Only approved immutable image repositories are allowed')


class Deployment:
    def __init__(self, app, config):
        self.app = app
        self.config = config
        self.site = Path(config['directory'])
        self.state = self.site / 'releases'
        self.state.mkdir(mode=0o700, exist_ok=True)
        self.log = None
        self.readonly = self.site / '.deployment-readonly.yml'

    def run(self, args, timeout=900):
        p = subprocess.run(args, cwd=self.site, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout)
        if self.log:
            with self.log.open('a') as f:
                f.write(p.stdout)
        if p.returncode:
            raise RuntimeError(f'{args[0]} operation failed (exit {p.returncode}); inspect server deployment log')
        return p.stdout.strip()

    def compose(self, *args, readonly=False):
        command = ['docker', 'compose', '-f', str(self.site / 'compose.yml')]
        if readonly:
            command += ['-f', str(self.readonly)]
        return self.run(command + ['--profile', 'jobs', *args])

    def running(self, name):
        p = subprocess.run(['docker', 'inspect', '--format', '{{.State.Running}}', name], text=True, capture_output=True)
        return p.returncode == 0 and p.stdout.strip() == 'true'

    def export_assets(self, image, destination):
        container = self.run(['docker', 'create', image])
        destination.mkdir(parents=True, exist_ok=True)
        try:
            self.run(['docker', 'cp', container + ':/app/.next/static', str(destination / 'static')])
            if self.app == 'try':
                self.run(['docker', 'cp', container + ':/app/public/tailcat', str(destination / 'tailcat')])
        finally:
            self.run(['docker', 'rm', container])
        static = Path(self.config['staticRoot'])
        for name, target in [('static', static / 'legacy-assets/_next/static'), ('tailcat', static / 'assets/tailcat')]:
            source = destination / name
            if not source.exists():
                continue
            for file in source.rglob('*'):
                if file.is_symlink():
                    raise RuntimeError('Symlink in published static assets')
                if file.is_file():
                    output = target / file.relative_to(source)
                    output.parent.mkdir(parents=True, exist_ok=True)
                    if output.exists() and file.name != 'manifest.json' and hashlib.sha256(output.read_bytes()).digest() != hashlib.sha256(file.read_bytes()).digest():
                        raise RuntimeError('Published hashed asset collision')
                    shutil.copyfile(file, output)
                    output.chmod(0o644)

    def migrate(self, image, directory):
        self.run(['docker', 'run', '--rm', '--network', 'none', '--user', '0', '--entrypoint', 'node', '-e', 'SQLITE_PATH=/data/website.sqlite', '-v', str(directory) + ':/data', image, '--import', 'tsx', 'scripts/migrate.ts'])

    def probe(self, base):
        paths = ['/api/health/ready', '/', '/download'] if self.app == 'website' else ['/api/health/live', '/', '/send', '/receive']
        for path in paths:
            with urllib.request.urlopen(base.rstrip('/') + path, timeout=30) as response:
                if response.status != 200:
                    raise RuntimeError('HTTP verification failed')
                if '/api/health/' in path and json.load(response) != {'ok': True}:
                    raise RuntimeError('Health response is invalid')
        if self.app == 'try':
            with urllib.request.urlopen(base + '/tailcat/manifest.json', timeout=30) as response:
                manifest = json.load(response)
            for item in manifest['files'].values():
                with urllib.request.urlopen(base + item['path'], timeout=60) as response:
                    if response.headers.get('Content-Encoding'):
                        raise RuntimeError('Pinned assets must retain original gzip bytes')
                    if hashlib.sha256(response.read()).hexdigest() != item['sha256']:
                        raise RuntimeError('Pinned asset digest mismatch')

    def wait(self):
        health = '/api/health/ready' if self.app == 'website' else '/api/health/live'
        url = f'http://127.0.0.1:{self.config["port"]}'
        for _ in range(60):
            try:
                with urllib.request.urlopen(url + health, timeout=2) as r:
                    if r.status == 200:
                        return
            except Exception:
                pass
            time.sleep(1)
        raise RuntimeError('Candidate did not become ready within 60 seconds')

    def perform(self, release):
        validate(release, self.app)
        approved = self.state / 'approved.json'
        if approved.exists():
            previous_approved = json.loads(approved.read_text())
            order = (release['runNumber'], release['runAttempt'])
            previous_order = (previous_approved['runNumber'], previous_approved['runAttempt'])
            if order < previous_order or (order == previous_order and release != previous_approved):
                raise ValueError('Stale or conflicting workflow release')
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        work = self.state / f'{release["runNumber"]}-{timestamp}'
        work.mkdir(mode=0o700)
        self.log = work / 'deployment.log'
        self.log.touch(mode=0o600)
        receipt = {'app': self.app, 'source': release['source'], 'images': release['images'], 'runNumber': release['runNumber'], 'runAttempt': release['runAttempt'], 'startedAt': timestamp, 'log': str(self.log)}
        old_env = (self.site / '.env').read_text()
        old_values = dict(line.split('=', 1) for line in old_env.splitlines() if '=' in line)
        main_key = 'WEBSITE_IMAGE' if self.app == 'website' else 'TRY_IMAGE'
        old_image = old_values[main_key]
        had_container = self.running(self.config['container'])
        scheduler = self.config['container'].replace('-website-1', '-scheduler-1')
        scheduler_running = self.app == 'website' and self.running(scheduler)
        old_readonly = True
        changed = False
        writes_opened = False
        schema_changed = False
        snapshot = work / 'before.sqlite'
        try:
            for image in release['images'].values():
                self.run(['docker', 'pull', image])
                revision = self.run(['docker', 'inspect', '--format', '{{index .Config.Labels "org.opencontainers.image.revision"}}', image])
                if revision != release['source']:
                    raise RuntimeError('Image revision does not match the release source')
            if had_container:
                self.export_assets(old_image, work / 'old-assets')
            image = release['images']['website' if self.app == 'website' else 'try']
            self.export_assets(image, work / 'new-assets')
            if self.app == 'website':
                old_readonly = 'WEBSITE_READ_ONLY=1' in (self.site / 'website.env').read_text().splitlines()
                candidate = work / 'migration-check'
                candidate.mkdir()
                backup(self.site / 'data/website.sqlite', candidate / 'website.sqlite')
                self.migrate(release['images']['maintenance'], candidate)
            save(approved, release)
            atomic(work / 'previous.env', old_env)
            if self.app == 'website':
                self.compose('stop', 'scheduler', 'website')
                changed = True
                backup(self.site / 'data/website.sqlite', snapshot)
                self.compose('run', '--rm', '--no-deps', 'scheduler', 'node', '--env-file=/run/secrets/backup_env', 'deploy/jobs.mjs', 'backup')
                with closing(sqlite3.connect(snapshot)) as db:
                    before = db.execute('SELECT hash FROM __drizzle_migrations ORDER BY id').fetchall()
                self.migrate(release['images']['maintenance'], self.site / 'data')
                with closing(sqlite3.connect(self.site / 'data/website.sqlite')) as db:
                    schema_changed = before != db.execute('SELECT hash FROM __drizzle_migrations ORDER BY id').fetchall()
                atomic(self.readonly, 'services:\n  website:\n    environment:\n      WEBSITE_READ_ONLY: "1"\n')
            replacements = {'WEBSITE_IMAGE': release['images']['website'], 'SCHEDULER_IMAGE': release['images']['scheduler']} if self.app == 'website' else {'TRY_IMAGE': release['images']['try']}
            values = {**old_values, **replacements}
            atomic(self.site / '.env', ''.join(f'{key}={value}\n' for key, value in values.items()))
            changed = True
            service = 'website' if self.app == 'website' else 'try'
            self.compose('up', '-d', '--force-recreate', service, readonly=self.app == 'website')
            self.wait()
            self.probe(f'http://127.0.0.1:{self.config["port"]}')
            self.probe(self.config['publicUrl'])
            if self.app == 'website' and not old_readonly:
                writes_opened = True
                self.compose('up', '-d', '--force-recreate', 'website')
                self.wait()
                self.probe(self.config['publicUrl'])
            if scheduler_running:
                self.compose('up', '-d', 'scheduler')
            receipt.update(status='DEPLOYED', schemaChanged=schema_changed, websiteReadOnly=old_readonly if self.app == 'website' else None, schedulerRunning=scheduler_running)
            save(self.state / 'current.json', release)
        except Exception as error:
            receipt.update(status='FAILED', error=str(error))
            if changed:
                try:
                    if self.app == 'website' and writes_opened and schema_changed:
                        self.compose('up', '-d', '--force-recreate', 'website', readonly=True)
                        receipt['status'] = 'FAILED_REQUIRES_FORWARD_FIX'
                    else:
                        if self.app == 'website':
                            self.compose('stop', 'scheduler', 'website')
                            if not writes_opened and snapshot.exists():
                                data = self.site / 'data'
                                owner = data.stat()
                                data.rename(work / 'failed-data')
                                data.mkdir(mode=0o700)
                                os.chown(data, owner.st_uid, owner.st_gid)
                                shutil.copyfile(snapshot, data / 'website.sqlite')
                                os.chown(data / 'website.sqlite', owner.st_uid, owner.st_gid)
                                (data / 'website.sqlite').chmod(0o600)
                        atomic(self.site / '.env', old_env)
                        self.compose('up', '-d', '--force-recreate', 'website' if self.app == 'website' else 'try')
                        if had_container:
                            self.export_assets(old_image, work / 'rollback-assets')
                        self.wait()
                        self.probe(f'http://127.0.0.1:{self.config["port"]}')
                        if scheduler_running:
                            self.compose('up', '-d', 'scheduler')
                        receipt['status'] = 'ROLLED_BACK'
                        receipt['databaseRestored'] = self.app == 'website' and not writes_opened
                except Exception as rollback_error:
                    receipt.update(status='FAILED_ROLLBACK', rollbackError=str(rollback_error))
        finally:
            receipt['finishedAt'] = datetime.now(timezone.utc).isoformat()
            save(work / 'receipt.json', receipt)
            save(self.state / 'last-result.json', receipt)
        return receipt


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', default='/opt/uc-deploy/config.json')
    parser.add_argument('--app', choices=['website', 'try'], required=True)
    parser.add_argument('--stdin', action='store_true')
    args = parser.parse_args()
    config = json.loads(Path(args.config).read_text())[args.app]
    deployment = Deployment(args.app, config)
    with (deployment.state / 'deployment.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if args.stdin:
            raw = sys.stdin.buffer.read(16385)
            if len(raw) > 16384:
                raise ValueError('Release request is too large')
            release = json.loads(raw)
        else:
            release = json.loads((deployment.state / 'approved.json').read_text())
        result = deployment.perform(release)
    print(json.dumps(result))
    return 0 if result['status'] == 'DEPLOYED' else 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print(json.dumps({'status': 'REJECTED', 'error': str(error)}))
        sys.exit(1)
