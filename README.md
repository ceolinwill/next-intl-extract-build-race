# next-intl Extraction Build Race Reproduction

Minimal reproduction for `next build` now and then shipping message keys instead of text when next-intl's `experimental.extract` is on. Reported in https://github.com/amannn/next-intl/issues/2441.

During `next build`, next-intl starts message extraction without waiting for it and rewrites every catalog with `fs.writeFile`, even when nothing changed. `fs.writeFile` empties the file before it writes the new content. The same build reads those catalogs to compile them (`messages.precompile`), so a build that reads one inside that window compiles an empty catalog: the build passes, and its pages show message keys.

## Reproduction

```sh
pnpm install
pnpm watch-catalog
```

`watch-catalog` runs a plain `next build` and polls `messages/en.po` while it runs. In every run, the build rewrites the catalog although its content doesn't change, and some polls find it empty:

```txt
catalog rewritten during the build: true
catalog content changed: false
polls: 85415, polls that found it empty: 14
```

The empty window is short, so a build reads the empty file only now and then. In a larger app we hit it in about one of 200 CI builds, on busy runners. To see what such a build ships, make the window longer, as a slow disk does:

```sh
pnpm build:slow-catalog-write
grep -o '<h1>[^<]*</h1>' .next/server/app/index.html
```

`scripts/slow-catalog-write.cjs` only waits 1 second between emptying a `.po` file and writing it (`CATALOG_WRITE_DELAY_MS` changes the wait). The build passes, logs `Error: MISSING_MESSAGE: C7xZUr (en)` while prerendering, and the page has the key instead of the text:

```html
<h1>C7xZUr</h1>
```

A plain `pnpm build` prerenders `<h1>Hello from the catalog</h1>`.

## Expected Behavior

A build never compiles an empty or partly written catalog. Any of these would do:

- Write catalogs atomically: write a temporary file next to the catalog, then rename it over the catalog, so a reader sees the old or the new content, never an empty file.
- Skip writing a catalog whose content didn't change (here it never does, and every build still rewrites it).
- Finish extraction before the build compiles the catalogs.

## Actual Behavior

- `initExtractionCompiler` starts `compiler.extractAll()` without awaiting it. Its comment notes the build can't wait for extraction under Turbopack.
- `ExtractionCompiler.extractAll()` calls `CatalogManager.save()`, which writes every locale's catalog on each build.
- `CatalogPersister.write()` writes with `fs.writeFile(filePath, content)`, which truncates the file first.
- The build doesn't wait for the write either: with a longer `CATALOG_WRITE_DELAY_MS`, `next build` can exit before the delayed write lands and leave `messages/en.po` empty on disk (`git checkout messages/en.po` restores it).

## Environment

- next-intl: `4.14.9`
- Next.js: `16.4.3` (Turbopack)
- React: `19.3.1`
- Node.js: `24.22.0`
- pnpm: `12.4.0`
- macOS: `27.0.1`
