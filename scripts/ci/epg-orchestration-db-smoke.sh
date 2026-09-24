#!/usr/bin/env bash
set -euo pipefail

export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-5432}"
export PGDATABASE="${PGDATABASE:-postgres}"
export PGUSER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

psql -v ON_ERROR_STOP=1 -f server/epg/refreshOrchestrationMigrationSmoke.sql

for role in anon authenticated; do
  if psql -v ON_ERROR_STOP=1 -c "set role ${role}; select public.teevee_claim_epg_refresh_job(1, '00000000-0000-4000-8000-000000000001'::uuid);" >/tmp/teevee-${role}.out 2>&1; then
    echo "Expected ${role} orchestration RPC rejection, but call succeeded" >&2
    cat /tmp/teevee-${role}.out >&2
    exit 1
  fi
  if ! grep -Eiq 'permission denied|not permitted' /tmp/teevee-${role}.out; then
    echo "Expected privilege rejection for ${role}, got:" >&2
    cat /tmp/teevee-${role}.out >&2
    exit 1
  fi
done

echo "EPG orchestration database lifecycle + role boundary PASS"
