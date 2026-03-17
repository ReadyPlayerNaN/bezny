---
name: commit-discipline
description: Use when about to run git commit, amend, or squash — enforces atomic, conventional, and meaningful commits with no standalone fixup commits
---

# Commit Discipline

## Core Principle

Every commit must be **atomic** (one logical change), **conventional** (proper type prefix), and **meaningful** (explains why, not just what). Fixup commits — lint fixes, formatting, typos, one-line corrections — must be squashed into the originating commit, not committed standalone.

## The Iron Law

**Never commit a fixup as a standalone commit.**

If you just fixed a lint error, a typo, or a config mistake introduced moments ago: `git commit --amend --no-edit` (if not pushed) or squash before pushing. A CI failure caused by your own oversight is not a new commit — it is a correction to an existing one.

## Conventional Commit Types

| Type | When to use |
|------|-------------|
| `feat` | New user-visible feature or behavior |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `test` | Adding or fixing tests |
| `ci` | CI/CD pipeline changes |
| `docs` | Documentation only |
| `chore` | Maintenance, dependency bumps |
| `perf` | Performance improvement |
| `build` | Build system changes |
| `style` | Whitespace/formatting with zero logic change |

Use scope for monorepo packages: `feat(button):`, `fix(styles):`.

Breaking changes: append `!` to the type and add `BREAKING CHANGE:` footer.

## Atomicity Rules

- One logical concern per commit
- If your diff touches two unrelated things, split into two commits
- If your diff fixes a bug AND refactors surrounding code, split them
- Tests for a feature belong in the **same commit** as the feature, not a follow-up

## What "Meaningful" Means

The subject line answers: *what changed and why is that good?*

```
# ❌ What, no why
fix(ci): fix lint step

# ✅ What and why
ci: run build before lint so workspace packages resolve correctly
```

Body is optional but use it when context is non-obvious.

## Squash Checklist — Ask Before Every Commit

1. Does this commit fix something I introduced in a commit not yet on the remote? → **amend or squash**
2. Is the subject line `fix lint`, `fix formatting`, `fix typo`, `oops`, `wip`, `temp`, `cleanup`? → **not ready, squash**
3. Does this diff contain more than one logical concern? → **split**
4. Is there a test for the code in this commit (if applicable)? → **add it here, not later**

## Red Flags — Stop and Squash

| Message | Reality |
|---------|---------|
| `fix lint` / `fix(lint): ...` | Squash into the commit that introduced the lint error |
| `ci: fix ...` one-liner after a ci: commit | Amend the previous CI commit |
| `fix formatting` | Amend |
| `fix typo` | Amend |
| `wip` / `temp` / `todo` | Not ready to commit |
| `oops` / `missed` / `forgot` | Amend |
| second commit touching the same file for unrelated reasons | Split original |

## Squash Commands

```bash
# Fix the most recent commit (not yet pushed)
git commit --amend --no-edit

# Squash last N commits interactively
git rebase -i HEAD~N

# Stage additional changes into last commit
git add <files> && git commit --amend --no-edit
```

## Real Violations from This Project

These commits from this session should have been squashed:

- `fix(lint): resolve all biome lint errors across packages` → should have been part of the preceding refactor commits
- `ci: run build before lint to resolve workspace package imports` → should have been amended into `ci: add GitHub Actions CI and Release Please workflows`
- `ci: trigger release-please on master branch` → should have been amended into the CI commit

The pattern: CI fails → new commit to fix it. Instead: CI fails → amend the commit that caused it, force-push the branch.
