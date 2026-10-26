// next-intl writes each catalog with `fs.writeFile`, which empties the file before it writes the
// new content. This preload makes that window longer, as a slow disk or a busy CI machine does:
// after emptying a `.po` file it waits before writing, so the build reads the empty catalog every
// time instead of once in a while.
const fs = require("node:fs/promises");
const { setTimeout: sleep } = require("node:timers/promises");

const DELAY_MS = Number(process.env.CATALOG_WRITE_DELAY_MS ?? 1000);
const writeFile = fs.writeFile;

fs.writeFile = async function slowCatalogWrite(file, data, options) {
  if (typeof file === "string" && file.endsWith(".po")) {
    await fs.truncate(file).catch(() => {});
    await sleep(DELAY_MS);
  }

  return writeFile.call(this, file, data, options);
};
