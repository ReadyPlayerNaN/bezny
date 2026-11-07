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

Tag `v0.3.4` points to `cf82483b03f0435e24cc31ab6473583853632b78`. The existing [release workflow](https://github.com/ReadyPlayerNaN/bezny/actions/runs/42375199659) verified and packed successfully, but its npm publish step failed. Local npm authentication initially returned 401. After operator web login and separate publication approvals, interactive publication of the locally verified tagged-source tarballs succeeded for Base and Admin, in that order. No tag was moved, version overwritten, or CI configuration changed.

Both registry packages were subsequently verified against the release commit, package names/versions, repository metadata, `latest`, exact Admin-to-Base dependency, SHA-512/SHA-1 and byte identity with the local tagged-source artifacts. Admin metadata initially returned 404 during registry processing; those attempts are retained along with the successful final verification.

- Base: 291680 bytes, `sha512-00hr0jhXzG8xc5Luv7DH0dQCWbi6qWF0kD1waxE8Q1yvEaBcn6q+ZUoHR3IRLoP2v16v+vcoPmOuyLh3U44GJg==`.
- Admin: 545904 bytes, `sha512-jue+tsPueLQ5y36sUyeNGI9/kDHN3cMdWC02AlZGuskNQtraDDuYr9LITqhA2rbOdv5M+2SrnoNob8ghDosp6g==`.

This delivery record follows the immutable release tag. Registry delivery does not imply acceptance of any consumer's production resource migrations.
