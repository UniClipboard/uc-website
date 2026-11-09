"""Exercise the installed deployment program against disposable Docker projects."""
import argparse
import hashlib
from contextlib import closing
from concurrent.futures import ThreadPoolExecutor
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument('--app', choices=['website', 'try'], required=True)
for name in ('website', 'scheduler', 'maintenance', 'try-image', 'source', 'try-source', 'database', 'runtime-env'):
    parser.add_argument('--' + name)
a = parser.parse_args()
repo = Path.cwd()
root = Path(tempfile.mkdtemp(prefix='uc-deployment-e2e-'))
config = {}
results = []


def command(args, **kw):
    return subprocess.run(args, check=True, text=True, capture_output=True, **kw).stdout


def data_signatures(db, columns=None):
    tables = ['articles', 'article_translations', 'api_tokens', 'releases', 'founders', 'ios_beta_signups', 'sponsors', 'sponsor_invites']
    columns = columns or {table: [row[1] for row in db.execute(f'PRAGMA table_info("{table}")')] for table in tables}
    signatures = {}
    for table in tables:
        selection = ','.join('"' + column.replace('"', '""') + '"' for column in columns[table])
        rows = db.execute(f'SELECT {selection} FROM "{table}"').fetchall()
        encoded = '\n'.join(sorted(json.dumps(row, ensure_ascii=True, default=lambda value: value.hex()) for row in rows))
        signatures[table] = hashlib.sha256(encoded.encode()).hexdigest()
    return columns, signatures


def deploy(manifest, expected=0):
    p = subprocess.run(['python3', str(repo / 'deploy/automation/deploy.py'), '--config', str(root / 'config.json'), '--app', manifest['app'], '--stdin'], input=json.dumps(manifest), text=True, capture_output=True)
    if expected is not None and p.returncode != expected:
        raise RuntimeError(p.stdout + p.stderr)
    return json.loads(p.stdout)


def manifest(app, number):
    return {'version': 1, 'app': app, 'ref': 'refs/heads/main', 'source': a.source if app == 'website' else a.try_source, 'runNumber': number, 'runAttempt': 1, 'images': {'website': a.website, 'scheduler': a.scheduler, 'maintenance': a.maintenance} if app == 'website' else {'try': a.try_image}}


try:
    for app, port in [(a.app, 3345 if a.app == 'website' else 3346)]:
        site = root / app
        site.mkdir()
        project = 'uc-deployment-e2e-' + app
        compose = repo / ('deploy/compose.yml' if app == 'website' else 'apps/try/deploy/compose.yml')
        shutil.copy(compose, site / 'compose.yml')
        # The test owns the same Compose behavior at isolated project names/ports.
        text = (site / 'compose.yml').read_text().replace('name: uc-website', 'name: ' + project).replace('name: uc-try', 'name: ' + project).replace('127.0.0.1:3321:3000', f'127.0.0.1:{port}:3000')
        (site / 'compose.yml').write_text(text)
        image = a.website if app == 'website' else a.try_image
        (site / '.env').write_text(f'WEBSITE_IMAGE={image}\nSCHEDULER_IMAGE={a.scheduler}\nWEBSITE_PORT={port}\n' if app == 'website' else f'TRY_IMAGE={image}\n')
        if app == 'website':
            (site / 'data').mkdir()
            with closing(sqlite3.connect(a.database)) as source, closing(sqlite3.connect(site / 'data/website.sqlite')) as target:
                source.backup(target)
                before_columns, before_signatures = data_signatures(target)
            os.chown(site / 'data', 1000, 1000)
            os.chown(site / 'data/website.sqlite', 1000, 1000)
            (site / 'website.env').write_text((Path(a.runtime_env).read_text() if a.runtime_env else '') + '\nWEBSITE_READ_ONLY=1\nAPP_URL=https://www.uniclipboard.app\n')
            (site / 'backups').mkdir()
            (site / 'secrets').mkdir()
            (site / 'secrets/cron_secret').write_text('deployment-e2e-only')
            (site / 'secrets/backup_password').write_text('deployment-e2e-only-password')
            (site / 'secrets/backup.env').write_text('AWS_ACCESS_KEY_ID=local-e2e\nAWS_SECRET_ACCESS_KEY=local-e2e\nRESTIC_REPOSITORY=/backups/restic-repository\n')
        config[app] = {'directory': str(site), 'staticRoot': str(root / ('assets-' + app)), 'port': port, 'publicUrl': f'http://127.0.0.1:{port}', 'container': project + ('-website-1' if app == 'website' else '-try-1')}
    (root / 'config.json').write_text(json.dumps(config))
    if a.app == 'website':
        command(['docker', 'compose', '--project-directory', config['website']['directory'], '--profile', 'jobs', 'run', '--rm', '--no-deps', 'scheduler', 'node', '--env-file=/run/secrets/backup_env', 'deploy/jobs.mjs', 'init'])
    for app in config:
        r = deploy(manifest(app, 1))
        assert r['status'] == 'DEPLOYED', r
        results.append({'name': app + ' immutable release and real HTTP verification', 'status': 'PASS'})
        config[app]['publicUrl'] += '/deliberately-missing'
        (root / 'config.json').write_text(json.dumps(config))
        r = deploy(manifest(app, 2), 1)
        assert r['status'] == 'ROLLED_BACK', r
        results.append({'name': app + ' failed public verification rolls back', 'status': 'PASS'})
        config[app]['publicUrl'] = config[app]['publicUrl'].removesuffix('/deliberately-missing')
        (root / 'config.json').write_text(json.dumps(config))
        r = deploy(manifest(app, 1), 1)
        assert r['status'] == 'REJECTED', r
        results.append({'name': app + ' rejects stale release', 'status': 'PASS'})
        invalid = manifest(app, 3)
        key = next(iter(invalid['images']))
        invalid['images'][key] = invalid['images'][key].split('@')[0] + ':latest'
        assert deploy(invalid, 1)['status'] == 'REJECTED'
        invalid = manifest(app, 3)
        invalid['ref'] = 'refs/heads/feature'
        assert deploy(invalid, 1)['status'] == 'REJECTED'
        results.append({'name': app + ' rejects mutable images and non-main requests', 'status': 'PASS'})
        with ThreadPoolExecutor(max_workers=2) as pool:
            concurrent = list(pool.map(lambda number: deploy(manifest(app, number), None), [3, 4]))
        assert all(item['status'] in ('DEPLOYED', 'REJECTED') for item in concurrent), concurrent
        assert json.loads((Path(config[app]['directory']) / 'releases/current.json').read_text())['runNumber'] == 4
        results.append({'name': app + ' concurrent upgrades serialize and preserve newest release', 'status': 'PASS'})
    if a.app == 'website':
        with closing(sqlite3.connect(root / 'website/data/website.sqlite')) as db:
            assert data_signatures(db, before_columns)[1] == before_signatures
            assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        assert 'WEBSITE_READ_ONLY=1' in (root / 'website/website.env').read_text().splitlines()
        assert 'scheduler' not in command(['docker', 'compose', '--project-directory', str(root / 'website'), '--profile', 'jobs', 'ps', '--status', 'running', '--services'])
        results.append({'name': 'all eight SQLite table values, read-only configuration and stopped scheduler preserved', 'status': 'PASS'})
    else:
        assert list((root / 'assets-try/assets/tailcat').glob('main.*.wasm.gz'))
        assert list((root / 'assets-try/legacy-assets/_next/static').rglob('*.js'))
        results.append({'name': 'versioned WASM and hashed assets exported for OpenResty', 'status': 'PASS'})
    output = repo / '.migration/receipts/deployment.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({'results': results, 'browser': 'NOT_RUN_USER_OWNED', 'database': 'DISPOSABLE_FIXTURE'}, indent=2) + '\n')
    print(output.read_text())
finally:
    for app in config:
        subprocess.run(['docker', 'compose', '--project-directory', config[app]['directory'], '--profile', 'jobs', 'down'], capture_output=True)
    # Keep failed receipts/logs locally for diagnosis. The fixture has no production secrets.
    print('Deployment E2E directory: ' + str(root))
