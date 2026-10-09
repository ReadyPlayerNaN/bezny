# Agent instructions

## Functional slices and commits

- All work must be divided into functional slices. Each slice must deliver a complete, independently usable functional improvement to the source code—not a partial implementation or an arbitrary batch of files.
- Include the implementation, relevant tests, and any necessary configuration or documentation in the same slice. For documentation-only tasks, the slice must deliver a complete, usable documentation improvement.
- Verify each slice with the relevant checks before committing it. Do not commit incomplete or failing slices.
- Commit each completed slice separately using Conventional Commits: `type(scope): description` (scope is optional), for example `feat(core): add input validation` or `docs: define agent workflow`.
- Finish and commit the current slice before starting the next. Do not combine unrelated improvements in one commit or include unrelated pre-existing changes.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
