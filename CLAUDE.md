# Admiral Systems Tracking Code

An attribute-driven analytics tracker for Webflow sites. One script tag reads `data-*` attributes and sends pageview, click, form and ecommerce events to PostHog, GA4 and Customer.io. TypeScript, bundled by Rollup into one IIFE. No runtime dependencies, no test framework.

## Read order

1. This file.
2. `readme.md`: features, script attributes, architecture map of `src/`.
3. `HOW-TO-TRACK.md`: what a Webflow builder is told to do. Code and this guide must agree.
4. `docs/`: one guide per provider. Read the one your change touches.

## Session start

1. `git fetch`, then check the open PRs: `gh pr list`.
2. Call `session_brief` in War Room, then `list_issues` with project "AST – Admiral Systems Tracking Code".
3. Start the War Room timer on the issue you work on. Stop it when you finish.

## How to work: orchestrate, delegate to Opus

The main session is an orchestrator. It keeps the plan, the decisions and the final report, and it keeps its own context clean.

- Split the work into independent parts and give each part to a subagent on Opus (Claude Code: the `Agent` tool with `model: "opus"`). Run independent parts in parallel.
- Delegate anything that reads many files, loops, drives the browser or digs through logs: a headful test run, a root-cause hunt, vendor research, a build or a refactor. Do a one-call lookup or a small edit yourself.
- Brief each subagent with the goal, what is already known and ruled out, the files to read, the limits (what it must not edit, push or post), and the shape of the report. Tell it to mark what it inferred and what it did not test.
- A subagent that edits the repo while another part runs gets its own worktree (`isolation: "worktree"`). It commits on a branch and does not push.
- Check a subagent's key claim before you repeat it: rerun the one command that proves it.
- The orchestrator alone writes to War Room, pushes, opens PRs and releases.

## Tracker

War Room (MCP server `war-room`) is the tracker. Project: **AST – Admiral Systems Tracking Code**, slug `ast-admiral-systems-tracking-code`, issue prefix `DLVRY`. Read `how_to` before your first write. Work that installs the tracker on a client site belongs in that client's project, not here.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm run build        # writes dist/webflow-tracker.js and .min.js, about 1 second
npx tsc --noEmit      # typecheck
python -m http.server 4173   # then open http://127.0.0.1:4173/test/index.html
```

## Testing: use a real browser

There are no unit tests. `test/index.html` is the test ground. It mocks `posthog`, `gtag` and `cioanalytics` and prints every call to the Event Log on the page.

- Test in a visible browser with real clicks (in T3 Code: `preview_open`, then `preview_act`). Target elements with `locator='aria-ref=...'` from a `preview_snapshot`; a `selector` click times out. Focus a field with a real click before a key press: a key press after a scripted `focus()` does not reach the page. A headless run on a mock page is not enough: the bugs fixed in v0.2.1 were about real submits and real navigation.
- Consent starts denied. Click "Accept All" on the banner first, or no event is sent.
- The log is kept in `sessionStorage`, so it survives the reload of a native form submit. "PAGE UNLOAD" in the log means the browser really navigated.
- `?src=<url>` loads another bundle for the rest of the tab, for example a released one from jsDelivr, so you can compare old and new. `?src=default` goes back to `../dist/webflow-tracker.js`. `?ga4=G-A,G-B` sets `data-ga4-id`.
- The page loads `dist/`, not `src/`. Run `pnpm run build` before you test a source change.
- A new behaviour gets a new section on the test page in the same PR.
- The mocks prove what the tracker calls. They do not prove what Google, PostHog or Customer.io do with the call. Check a vendor claim against the vendor's live documentation, and say in the PR what was not tested against the real service.

## Rules for changes

- The tracker observes. It never calls `preventDefault()`, never calls `form.submit()`, and never delays or replays a user action. Webflow and the site's own scripts own the form.
- `dist/` is committed and must be built from the `src/` of the same commit. A PR that changes `src/` also commits the rebuilt `dist/`.
- A change in what the tracker sends is a behaviour change for every site that upgrades. Name it in the PR and in the release notes.
- Keep `HOW-TO-TRACK.md` and `docs/` true in the same PR.
- Do not paste vendor snippets into the docs. The docs point to the vendor's dashboard.

## Release

Sites load the bundle from jsDelivr by git tag, so a release is a tag. Sites pin a version, so a release reaches a site only when its script tag is changed.

1. Bump `version` in `package.json` and the `@x.y.z` in the script tags in `readme.md` and `docs/connecting-customerio.md`.
2. `pnpm run build`, commit `dist/`.
3. Merge the PR to `main` with a merge commit.
4. `gh release create vX.Y.Z --target main` with notes that name each behaviour change.
5. Wait a few minutes after the tag before you open any jsDelivr URL for it. Then fetch `https://cdn.jsdelivr.net/gh/BuildWithAdmiralSystems/as-tracking-code@X.Y.Z/dist/webflow-tracker.min.js` and compare its sha256 with `git show vX.Y.Z:dist/webflow-tracker.min.js | sha256sum`. They must match.

jsDelivr stores what it first serves for a version forever, and a purge does not change it. For 0.2.1 the `.min.js` was requested seconds after tagging and jsDelivr stored a file it minified itself ("Minified by jsDelivr" banner). The code in it is identical to ours, but its hash is not, so Subresource Integrity with the repo hash fails for that file. Only jsDelivr can replace it.

A released tag is never moved. A fix is a new version.

## Git and GitHub

- The repo is public. Put no client data, keys or personal details in code, docs, commits or PRs.
- Remote owner is `BuildWithAdmiralSystems`. With several `gh` accounts, make that one active before any network call: `gh auth switch -u BuildWithAdmiralSystems`.
- Branch from `main`. Commit or push only when the user asks.
- `.claude/worktrees/` holds subagent worktrees and is ignored.
- `.gitattributes` forces LF. On Windows, `git status` can still list `dist/` as modified after a build when nothing changed; `git add dist` clears it.
