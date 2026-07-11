# General Troubleshooting Methodology

## The 5-step loop
1. **Reproduce** — make the failure consistent and observable.
2. **Isolate** — change one variable; bisect (half-split) the system.
3. **Hypothesize** — form the most likely cause from evidence.
4. **Test** — apply a fix or probe; verify the change.
5. **Document** — record root cause and resolution.

## Divide-and-conquer (bisect)
- For bugs: `git bisect` between known-good and bad commits.
- For networks: test layer by layer — physical → link → IP → port → app.
- For performance: profile, don't guess; measure before/after.

## Evidence gathering
- Logs: `journalctl -u service -p err`, `/var/log/`, app log files
- State: `ps`, `ss`, `df`, `free`, `ip addr`, environment variables
- Compare working vs broken: same input, different output → diff the configs
- Reproduce in minimal case (MCVE) to rule out noise

## Common root-cause classes
- **Configuration** — wrong value, typo, stale cache, missing env var
- **Permissions** — EACCES, SELinux/AppArmor denials, wrong user
- **Resource** — disk full, OOM, file-descriptor exhaustion, CPU saturation
- **Network** — DNS, firewall, MTU, TLS/cert expiry, routing
- **Dependency** — version mismatch, missing package, race condition
- **Data** — corrupt input, encoding, timezone, off-by-one

## Asking the right questions
- When did it start? (correlate with deploys/changes)
- What changed? (recent code, config, traffic, dependency)
- Does it happen always or intermittently? (timing/race vs hard failure)
- Only for some users/inputs? (scoping the trigger)

## Avoiding false fixes
- Confirm the fix addresses the cause, not just the symptom.
- Re-test the original reproduction case.
- Watch for regressions introduced by the change.
- Keep a rollback path (feature flag, previous version).
