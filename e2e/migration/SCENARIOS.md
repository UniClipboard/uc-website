# Production migration acceptance

Write and approve these scenarios before changing the database implementation.
Run HTTP checks against a production server and a disposable SQLite database.
Do not start a browser or modify production records.

| Failure mode                                                | End-to-end assertion                                                                    |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Missing or wrong database path creates an empty database    | Runtime startup fails without changing storage.                                         |
| Data conversion loses rows, dates, JSON, hashes, or avatars | Compare all eight tables with normalized row digests and integrity checks.              |
| Authenticated API behavior changes                          | Verify missing, active, and revoked tokens through HTTP.                                |
| Article writes or cache invalidation fail                   | Create, update, read public content, and delete a disposable article through HTTP.      |
| Invitation loses atomicity under concurrent requests        | Submit the same invitation concurrently; require one 201 and one 410.                   |
| SQLite loses constraints                                    | Invalid/duplicate requests fail and leave no partial data.                              |
| Cache variants mix                                          | Request HTML and Markdown at the same URL and assert content types.                     |
| Cron accepts absent or wrong credentials                    | Require rejection before a synchronization starts.                                      |
| Container replacement loses data                            | Restart the production container and re-read the committed fixture.                     |
| Backup cannot restore the application                       | Back up the fixture database, restore it, start the production server, and rerun reads. |
| Transfer deployment changes                                 | Compare try project/DNS identities before and after cutover.                            |

Save a sanitized JSON receipt with commands, source/image identities, assertions, and `NOT RUN` checks.
