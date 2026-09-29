/**
 * Runs once when the Next.js server process starts (Next.js `instrumentation`
 * hook - stable since Next 15, no config flag needed).
 *
 * Replaces a GitHub Actions `schedule:` cron trigger for the OpenMouse daily
 * sync: the actual work (npm install, code generation, build validation, git
 * push) still runs on a GitHub-hosted runner via `workflow_dispatch`, not
 * inside this container. The production image intentionally has no npm, git,
 * curl or wget (removed after the 2026-08-18 incident - see Dockerfile), so
 * running that pipeline here would reopen exactly the attack surface that was
 * closed. This hook only owns the *schedule*: it wakes up periodically and,
 * once ~24h have passed since the last dispatch, asks GitHub's API to run the
 * existing `openmouse-daily-sync.yml` workflow.
 */
import { scheduleOpenMouseDailySync } from '@/lib/openmouseSyncScheduler'

export function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  scheduleOpenMouseDailySync()
}
