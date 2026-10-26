// Runs `next build` unchanged and polls `messages/en.po` while it runs, to show that the build
// rewrites the catalog (even when its content doesn't change) and catches it empty when the poll
// lands inside the write.
import { spawn } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const CATALOG = "messages/en.po";
const before = readFileSync(CATALOG, "utf8");
const startMtime = statSync(CATALOG).mtimeMs;
let polls = 0;
let emptyReads = 0;
let rewritten = false;
let done = false;

const build = spawn("pnpm", ["next", "build"], { stdio: "inherit" });

build.on("exit", (code) => {
  done = true;
  const after = readFileSync(CATALOG, "utf8");

  console.log(`\nnext build exited with ${code}`);
  console.log(`catalog rewritten during the build: ${rewritten}`);
  console.log(`catalog content changed: ${after !== before}`);
  console.log(`polls: ${polls}, polls that found it empty: ${emptyReads}`);
});

function poll() {
  if (done) {
    return;
  }

  polls += 1;
  const { mtimeMs, size } = statSync(CATALOG);

  if (mtimeMs !== startMtime) {
    rewritten = true;
  }

  if (size === 0) {
    emptyReads += 1;
  }

  setImmediate(poll);
}

poll();
