# Contributing to Gidana Mobile

Thank you for contributing. Please read these rules before opening a PR or pushing code.

---

## Branch strategy

```
main          ← production-ready, protected
  └── develop ← integration branch (all features merge here first)
        └── feature/<name>   ← new features
        └── fix/<name>       ← bug fixes
        └── chore/<name>     ← tooling, deps, config
        └── docs/<name>      ← documentation only
```

**Never commit directly to `main` or `develop`.** Open a PR from your branch into `develop`.

---

## Commit messages

We use **Conventional Commits**. Every commit message is validated automatically by Husky + commitlint. A bad message will be rejected before it is saved.

### Format

```
<type>(<optional scope>): <subject>

<optional body>

<optional footer>
```

### Rules enforced

| Rule | Requirement |
|---|---|
| `type` | must be one of the allowed types (see below) |
| `subject` | lowercase, min 10 chars, max 100 chars, never empty |
| `scope` | lowercase if used |
| `body` | must be separated from subject by a blank line |

### Allowed types

| Type | When to use |
|---|---|
| `feat` | a new user-visible feature |
| `fix` | a bug fix |
| `chore` | tooling, deps, config — no production code change |
| `docs` | documentation only |
| `style` | formatting, whitespace — no logic change |
| `refactor` | restructuring code without adding features or fixing bugs |
| `perf` | performance improvement |
| `test` | adding or updating tests |
| `build` | build system or external dependency changes |
| `ci` | CI/CD config changes |
| `revert` | revert a prior commit |

### Good examples

```
feat(auth): add google oauth login flow
fix(property-detail): prevent crash when images array is empty
chore(deps): upgrade expo to 54.0.0
refactor(wallet): extract payment method selector into own component
docs: add contributing guide and branch strategy
```

### Bad examples — commitlint will reject these

```
update stuff                        ← no type, too vague
feat: fix                           ← subject too short (min 10 chars)
Fix: correct the login bug          ← type must be lowercase
FEAT: add new screen                ← type must be lowercase
```

---

## Pre-commit checks (automatic)

Before each commit, **lint-staged** runs ESLint on all staged `.ts` and `.tsx` files. Zero warnings are allowed — the commit is blocked if any lint error or warning exists.

To lint manually:

```bash
npm run lint        # check all TypeScript files
npm run lint:fix    # auto-fix what can be fixed
```

---

## Pull requests

- PRs must target `develop`, not `main`
- Title should follow the same Conventional Commits format as commit messages
- Include a short description of **what** changed and **why**
- At least one passing CI check required before merging (once CI is set up)
- Keep PRs focused — one feature or fix per PR

---

## Code style

- TypeScript everywhere — no plain `.js` files inside `src/`
- No inline styles in React Native components — use `StyleSheet.create` in a separate `.styles.ts` file
- All user-visible strings must go through `i18next` (`t('key')`) — both `en.json` and `fr.json` must be updated together
- New screens must be registered in `src/navigation/MainNavigator.tsx`
- New API methods go in the relevant file under `src/api/`
- New shared types go in `src/types/index.ts`

---

## Questions

Open an issue or start a discussion. Don't DM the maintainer for code questions.
