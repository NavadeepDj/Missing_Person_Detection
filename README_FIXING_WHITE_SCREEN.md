# Post-mortem: Blank white page (Vite + React) — diagnosis & fixes

This document explains, step-by-step and in plain language, how we diagnosed and fixed a blank white page while running this Vite + React project in development. It records the symptoms, root causes, exact code changes, and verification steps so you can reproduce or adapt the fixes.

## TL;DR (short summary)
- Symptom: Dev server served a blank white page and DevTools showed runtime errors — first a React refresh preamble error, then a `ReferenceError: module is not defined` coming from `long.js` and later `require`/`module.exports` in `seedrandom`.
- Root causes:
  1. React Refresh plugin expecting HMR preamble globals to be set before `App.tsx` evaluated, which caused an early failure when modules executed in an unexpected order.
  2. Some dependencies (`long`, `seedrandom`) expose CommonJS sources (top-level `module.exports` or `require()`), and Vite was serving those source files directly to the browser. The browser doesn't define `module`/`require`, so those imports threw at runtime and prevented the app from booting.
- Fixes applied:
  1. Added a dev-only preamble in `src/main.tsx` so the React Refresh globals exist before `App.tsx` is evaluated (dynamic import of `./App.tsx`).
  2. In `vite.config.ts`, aliased packages that shipped CommonJS source to their browser/UMD builds and added them to `optimizeDeps.include` so Vite prebundles the browser-friendly versions:
     - `long` -> `node_modules/long/dist/long.js`
     - `seedrandom` -> `node_modules/seedrandom/seedrandom.min.js`
  3. Restarted Vite so it re-optimized dependencies and served the UMD/ESM-wrapped builds instead of raw CommonJS files.
- Result: The runtime errors disappeared and the app renders correctly in the browser.

---

## Symptoms we saw (in order)
1. Browser: blank white home page (no UI). DevTools Console showed:
   - An error thrown during module evaluation related to the react-refresh preamble check: "@vitejs/plugin-react can't detect preamble. Something is wrong." (this indicated refresh globals weren't present when module code expected them).
2. After adding a dev preamble: Browser showed `long.js:1 Uncaught ReferenceError: module is not defined` (or similar). Inspecting `node_modules/long/src/long.js` showed a top-level `module.exports = Long;` line — valid in Node/CommonJS but invalid in the browser.
3. We found `seedrandom/index.js` (installed package) also uses CommonJS `require()` & `module.exports`. If Vite serves that file directly, the browser will error with `require is not defined` / `module is not defined`.

These runtime ReferenceErrors stop JavaScript execution and therefore produce a blank page.

---

## Root causes (why this happens)
- Vite is a dev server that can serve package files directly. Many npm packages ship multiple builds: a CommonJS `main` (for Node), a UMD/browser build (for direct script usage), and sometimes an ESM build.
- If Vite doesn't prebundle or resolve a package to its browser-safe build, it might serve the CommonJS source file (which uses `module.exports` and `require`). Browsers don't define those Node/CommonJS globals, so code throws immediately.
- React Refresh (used by `@vitejs/plugin-react`) expects small helper globals to be present before some component modules evaluate. If those aren't set early enough because of module evaluation order, the plugin throws during module transform/runtime.

---

## Files changed (what we edited)
1. `src/main.tsx` (dev-only preamble)
   - We added a small dev-only snippet to initialize `window.$RefreshReg$` and `window.$RefreshSig$` if `import.meta.env.DEV`. Then we used a dynamic top-level `await import('./App.tsx')` so those globals exist before `App.tsx` runs. This prevents the preamble detection error.

2. `vite.config.ts`
   - Added `resolve.alias` entries to force Vite to use browser-friendly builds:
     - `"long": path.resolve(__dirname, "./node_modules/long/dist/long.js")`
     - `"seedrandom": path.resolve(__dirname, "./node_modules/seedrandom/seedrandom.min.js")`
   - Added `'long'` and `'seedrandom'` to `optimizeDeps.include` so Vite pre-bundles them into ESM wrappers during dev. That ensures the dev server will serve browser-safe code, not raw CommonJS with `module.exports`.

> Note: aliasing is a pragmatic dev-time fix. In a build (production), bundlers usually pick the correct entry (via package.json fields). But some packages have `main` pointing to CommonJS source — aliasing avoids that in dev.

---

## Why those changes fix the problem (plain explanation)
- React Refresh globals: The plugin injects calls that expect `window.$RefreshReg$`/`$RefreshSig$` to be defined during module evaluation. If they aren't, the plugin's detection throws and stops module evaluation. Setting those little no-op functions before importing `App` ensures those calls succeed during evaluation and HMR won't crash the runtime.

- Aliasing CommonJS packages: The browser can't run CommonJS source files (they rely on Node's `module`/`require`). By aliasing the package name to a prebuilt UMD/minified file (which exposes the API in a way the browser understands), we ensure the dev server serves a file that doesn't reference `module`/`require`. Adding the package to `optimizeDeps.include` tells Vite to prebundle it into an ESM wrapper so the dev server can import it via native module imports without errors.

---

## Exact commands we used
- Start dev server (what you run locally):

```powershell
bun run dev
# or
npm run dev
# or
pnpm dev
```

- If you change `vite.config.ts`, restart the dev server so Vite will re-optimize dependencies.

- To clear Vite prebundle cache (if needed): remove `node_modules/.vite` then restart dev server.

---

## How to verify locally (step-by-step)
1. Start the dev server.
2. Open http://localhost:5173 (or the port shown by Vite) in your browser with DevTools open.
3. Check Console for errors. If you see `module is not defined` or `require is not defined`, that indicates a CommonJS file is being served to the browser.
4. In DevTools → Network or Sources, find the module URL that throws (e.g., `long.js`, `seedrandom/index.js`) and inspect its first lines. If you see `module.exports =` or `require(` near the top, that file is a CommonJS source and won't run in the browser.
5. After the fix (aliases + optimizeDeps + dev preamble), re-check the served file: it should be a UMD wrapper or an ESM wrapper (no bare `module.exports` or top-level `require`). Console errors should be gone and the app should render.

---

## Files & snippets (reference)
- `vite.config.ts` (relevant snippets we added):

```ts
resolve: {
  alias: {
    "long": path.resolve(__dirname, "./node_modules/long/dist/long.js"),
    "seedrandom": path.resolve(__dirname, "./node_modules/seedrandom/seedrandom.min.js"),
    "@": path.resolve(__dirname, "./src"),
  }
},
optimizeDeps: {
  include: [ 'long', 'seedrandom', /* other deps... */ ],
}
```

- `src/main.tsx` (dev preamble pattern):

```ts
if (import.meta.env.DEV) {
  // small no-op refresh registration so plugin-react won't throw
  (window as any).$RefreshReg$ = (type: any, id?: string) => {};
  (window as any).$RefreshSig$ = () => (type: any) => type;
}

// ensure the preamble runs before App evaluated
const { default: App } = await import('./App.tsx');
// ... render App as usual
```

> Note: keep the dev-only code under `import.meta.env.DEV` so production builds aren't affected.

---

## Why alias vs. change package source
- Aliasing is non-invasive and keeps node_modules intact. It ensures Vite resolves imports to a browser-safe build without forking or modifying the package.
- Alternative approaches: add a small ESM wrapper in your project that imports the package's CommonJS file and re-exports a browser-safe API — but that is more work and less robust than pointing to the vendor-supplied UMD/ESM build.

---

## Follow-ups and recommendations
1. Audit other dependencies that might expose CommonJS source as `main` — search `node_modules` for `module.exports` at top-level and add aliases or `optimizeDeps.include` entries as needed.
2. When upgrading dependencies, re-check `vite.config.ts` aliases — later versions of a package might publish an `module`/`exports` field that points to ESM builds; the alias may become unnecessary.
3. If you deploy to a subpath (e.g., GitHub Pages), ensure `base` in `vite.config.ts` and `BrowserRouter basename` match.
4. For production builds, the bundler will usually pick the right entry (via `package.json` fields), but confirm your production build output by running `vite build` and checking `dist`.

---

## Troubleshooting checklist (if the blank page returns)
- Re-open DevTools Console and Network to capture the first runtime error and the path of the module that failed.
- Inspect that module's source in the browser (Sources tab). If it starts with `module.exports` or `require(`, add an alias to the package's `dist`/UMD/minified build in `vite.config.ts` and add it to `optimizeDeps.include`, then restart the dev server.
- Clear Vite cache by deleting `node_modules/.vite` and restart dev server.
- Ensure dev-only hacks (like preamble) are guarded by `import.meta.env.DEV`.

---

## Quick summary of the exact changes we applied in this repo
- `src/main.tsx`: added dev-only preamble and switched to dynamic import of `App` to avoid react-refresh preamble runtime error.
- `vite.config.ts`: added aliases and prebundle instructions for `long` and `seedrandom` so Vite serves browser-safe builds instead of CommonJS source.

These simple, low-risk changes fixed the runtime ReferenceErrors and restored the app rendering.

---

If you'd like, I can:
- Commit the README into the repo (done), commit the `vite.config.ts` changes if not already committed, and open a small PR summary.
- Scan `node_modules` for other CommonJS packages and prepare a short list of candidates and alias suggestions.
- Explain any specific line in the code changes in more depth.

If you'd like a shorter summary or a version of this README formatted for README.md (project root), tell me and I'll produce it.