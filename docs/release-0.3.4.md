# Reviewed 0.3.4 release batch

## Scope and authorization

The operator authorized independent review, publication and registry adoption of one patch batch containing edit Cancel destinations, mapped server-error focus, complete view-specific forms and explicit-target managed actions. No additional features, CI steps or source-manifest version changes are included. The existing npm release workflow and tag-derived packaging remain the delivery mechanism.

The source batch starts after `d34c39f` (verified 0.3.3 delivery), includes `8c8ae4b`, `f5bc9c7`, `c49a6b0` and `2025192`, and ends with review correction `ff1ccde`. See [form configuration](view-specific-forms.md), [explicit actions](explicit-action-targets.md) and [default pages](../packages/admin/DEFAULT-PAGES.md) for contracts.

## Independent review and correction

Fresh-context read-only reviewer `a11361df-2dfa-4870-8368-91f8ecd32cfc` reviewed the complete source diff and found one P2: explicit groups could include reserved record IDs supplied by raw envelope adapters. `defineAdminEntity` already rejects these records during ingestion; the initial attempted reproduction confirmed that earlier guard. Two subsequent real runtime tests using the public raw-adapter seam reproduced the command-authority gap for `create` and `CREATE`.

`ff1ccde` rejects the entire explicit group when a canonical member has a reserved ID, without dropping that member, changing selection, or executing an operation. The tests cover reserved-only and mixed groups while retaining an ordinary subset. Follow-up reviewer `9247a62c-163f-4a23-a9d2-2d2f49f5129b` found no remaining issue and returned **OK with notes**, conditional on final parent browser validation. That final matrix subsequently passed. Review was source/evidence inspection, not an independent test execution or consumer production acceptance.

## Validation

On the corrected source, frozen install, `pnpm check`, build, typecheck, tests, packaging and diff checks passed. Admin ran 431 tests fresh; Demo ran 83 tests in each routing configuration fresh. Base's 311 unit and 58 Node tests were cached in the root run and then rerun directly, passing fresh. Root task/cache counts were build 3/1, typecheck 5/3 and test 6/4. The full serialized browser matrix passed 144/144 both before and after the correction; packaging passed 17/17.

Local evidence is retained under `.tmp/release-0.3.4/` in the release worktree, including both initial failing test attempts, the initial formatting failure, review reports, final logs and cache summary. No assertions/timeouts were weakened. The known reference-filter timing failure from earlier feature validation did not recur in either release browser run; this batch does not claim to fix it.

## Delivery state

This document records the validated release candidate, not successful publication. Create the release tag only on the reviewed source plus this documentation, wait for the existing workflow, and verify registry metadata, integrity and package bytes before consumer installation. Preserve any delivery failures; do not replace an existing tag or overwrite a published version. Downstream production migrations remain separate acceptance work even after the packages are adopted.
