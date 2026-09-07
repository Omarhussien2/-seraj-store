# Conversion Mongo verification record

Date: 2026-09-07 (Africa/Cairo)

## Outcome

The lead reran the persisted Mongo concurrency suite on 2026-09-07 against a
new disposable local database: **6 passed, 0 failed, exit 0** (5.79 seconds).
The earlier incomplete attempt is retained below as history. These six checks
cover the pre-withdrawal implementation; new withdrawal cases require a fresh
run after their implementation.

The successful command used
`CONVERSION_TEST_MONGODB_URI=mongodb://127.0.0.1:27107/seraj_conversion_test_release_20260907`
and `node --import tsx --test tests/analytics-purchase.integration.test.ts`.
The new owned server is PID `31392`, with database files in
`.conversion-test-results/mongo/db-release-20260907`; it is bound only to
`127.0.0.1:27107`. Mongoose emitted deprecation warnings for the existing `new`
option; assertions and process completion succeeded.

The only production boundary replaced by the suite is outbound `fetch`; order
documents and all updates use the real Mongoose model against a real local
MongoDB server. The suite covers:

- two simultaneous first-paid updates retaining one confirmation marker;
- active-lease exclusion between concurrent delivery workers;
- expired-lease recovery;
- sent-marker preservation across later payment-status changes;
- missing-secret behavior without a claim or outbound request; and
- three-distinct-order batch and per-order attempt caps.

## Local Mongo preparation

No installed `mongod`, `mongosh`, or MongoDB Server directory was found. Docker
was not retried. MongoDB Community Server 8.0.29 for Windows x64 was downloaded
from MongoDB's official archive host into the ignored
`.conversion-test-results/mongo` directory:

```text
https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.29.zip
```

The separately downloaded official checksum was:

```text
4b1fc74acbd7fbdc3bb9a70dc7f133cf401488196a9d6e6a3ee8471c58eea44b
```

`Get-FileHash -Algorithm SHA256` returned the identical hash. Archive size was
805,689,023 bytes. PowerShell archive expansion was stopped after the required
`mongod.exe` was complete because it continued expanding large, irrelevant PDB
files. `mongod.exe --version` exited 0 and reported MongoDB 8.0.29.

The server was started from the ignored runtime with these effective options:

```text
--dbpath=db --bind_ip=127.0.0.1 --port=27107 --noauth
--logpath=mongod.log --pidfilepath=mongod.pid
```

The owned server PID was `28956`. A TCP readiness probe returned `READY=True`
for `127.0.0.1:27107`.

## Incomplete test run

The exact test command was:

```powershell
$env:CONVERSION_TEST_MONGODB_URI='mongodb://127.0.0.1:27107/seraj_conversion_test_20260907'
node --import tsx --test tests/analytics-purchase.integration.test.ts
```

The command produced no test output during the bounded wait and was interrupted
with its tool session. It did not return an exit code, test count, or assertion
result, so silence must not be interpreted as success. Other TypeScript and
ESLint commands on this host also exhibited unusually long silent runs during
the same period, but no cause was established.

Mongo PID `28956` was then force-stopped. A subsequent port check showed no
connection on `27107`. Process command-line discovery was denied by Windows,
so no uncertain Node process was terminated; the interrupted unified command
owned the test process. The exact disposable `db` directory and stale PID file
were removed after confirming PID `28956` was no longer running. The verified
archive and portable executable remain only under the ignored test-results
directory for a future bounded rerun.

## Safe rerun prerequisite

Before rerunning, create a new empty ignored `db` directory, start the portable
server bound to `127.0.0.1:27107`, confirm readiness, and run the exact command
above. Do not point `CONVERSION_TEST_MONGODB_URI` anywhere except localhost port
`27107` with a database name beginning `seraj_conversion_test_`; the test file
rejects any other host, port, credentials, or database name. Stop the owned
server and remove only that disposable database directory after the run.

No production database, real order, credential, or live Google endpoint was
used.

## Final withdrawal verification

The lead reran the expanded suite with
`CONVERSION_TEST_MONGODB_URI=mongodb://127.0.0.1:27107/seraj_conversion_test_release_final_20260907`:
**9 passed, 0 failed, exit 0** (2.09 seconds). Additional cases verify multi-order
withdrawal, prevention of revoked-token attribution on later orders and a
revocation record blocking transport after a lease is claimed. The multi-order
case also checks attribution is hidden by default and available only through an
explicit projection for the sender. This supersedes the initial incomplete run.
