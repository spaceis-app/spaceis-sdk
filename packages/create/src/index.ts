import * as p from "@clack/prompts";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { downloadTemplate } from "giget";

const REPO = "spaceis-app/spaceis-sdk";

const EXAMPLES = {
  react:   { label: "React",   hint: "Next.js App Router + SSR + hooks", dir: "examples/react"   },
  vue:     { label: "Vue",     hint: "Nuxt 4 + SSR + composables",       dir: "examples/vue"     },
  vanilla: { label: "Vanilla", hint: "HTML + vanilla JS + SDK IIFE",     dir: "examples/vanilla" },
  php:     { label: "PHP",     hint: "PHP SSR + client-side SDK",        dir: "examples/php"     },
} as const;

type ExampleKey = keyof typeof EXAMPLES;

const PACKAGES = [
  {
    value: "@spaceis/sdk" as const,
    label: "@spaceis/sdk",
    hint: "Core SDK, zero dependencies, everywhere",
  },
  {
    value: "@spaceis/react" as const,
    label: "@spaceis/react",
    hint: "React hooks, Context Provider, Next.js SSR",
  },
  {
    value: "@spaceis/vue" as const,
    label: "@spaceis/vue",
    hint: "Vue 3 composables, Plugin, Nuxt SSR",
  },
];

/** How long to wait for the npm registry before giving up, per request. */
const REGISTRY_TIMEOUT_MS = 10_000;

/**
 * Fetch the `latest` tag version of a package from the npm registry.
 * Uses Node's built-in fetch (Node ≥ 18) with a 10s timeout so a slow
 * or unresponsive registry can't hang the CLI indefinitely.
 */
/** @internal */
export async function getLatestVersion(pkg: string): Promise<string> {
  const url = `https://registry.npmjs.org/${encodeURIComponent(pkg).replace("%40", "@")}/latest`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(REGISTRY_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`npm registry returned ${res.status} for ${pkg}`);
  const data = (await res.json()) as { version?: unknown };
  if (typeof data.version !== "string") throw new Error(`Invalid registry payload for ${pkg}`);
  return data.version;
}

/**
 * Rewrite all `@spaceis/*` dependencies in a package.json to the latest
 * version published on npm. Keeps non-spaceis deps untouched. Writes the
 * file in-place and returns a list of human-readable change descriptions.
 */
/** @internal */
export async function resolveSpaceisDepsToLatest(pkgJsonPath: string): Promise<string[]> {
  const raw = fs.readFileSync(pkgJsonPath, "utf8");
  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    pkg = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Invalid JSON in ${pkgJsonPath}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const changed: string[] = [];
  const cache = new Map<string, string>();

  for (const field of ["dependencies", "devDependencies"] as const) {
    const deps = pkg[field];
    if (!deps) continue;
    for (const name of Object.keys(deps)) {
      if (!name.startsWith("@spaceis/")) continue;
      let latest = cache.get(name);
      if (!latest) {
        latest = await getLatestVersion(name);
        cache.set(name, latest);
      }
      const newRange = `^${latest}`;
      if (deps[name] !== newRange) {
        changed.push(`${name}: ${deps[name]} → ${newRange}`);
        deps[name] = newRange;
      }
    }
  }

  if (changed.length > 0) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  }
  return changed;
}

/**
 * Spawn a subprocess with explicit argv — never via a shell. That way even
 * if a dependency name or CLI path ever contained special characters, we
 * don't risk shell metacharacter interpretation.
 *
 * Captures both stdout and stderr so that on failure the caller has the
 * full context of what the child printed, not just stderr.
 */
function run(file: string, args: string[], cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let stderr = "";
    let stdout = "";
    const child = spawn(file, args, {
      cwd,
      stdio: "pipe",
      shell: false,
      env: { ...process.env, CI: "1" },
    });
    child.stdin?.end();
    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) return resolve(stdout + stderr);
      const detail = [stderr.trim(), stdout.trim()].filter(Boolean).join("\n").trim();
      reject(new Error(detail || `${file} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

/**
 * Abort the CLI with a cancel message. Exits with code 130 — the SIGINT
 * convention — so CI/automation can tell "user cancelled" apart from
 * "succeeded" (0) and "errored" (1).
 */
function cancel(): never {
  p.cancel("Cancelled.");
  process.exit(130);
}

/** @internal */
export function detectPackageManager(): "pnpm" | "npm" | "yarn" | "bun" {
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("pnpm")) return "pnpm";
  if (ua.startsWith("yarn")) return "yarn";
  if (ua.startsWith("bun")) return "bun";

  // Fallback: check runtime (e.g. `bun script.js` doesn't set npm_config_user_agent)
  if (process.versions.bun) return "bun";

  return "npm";
}

/**
 * Build the argv for an install command — `{ file, args }`. The verb differs
 * between npm (`install`) and the rest (`add`). Returned as a tuple so it
 * can be fed straight into `run()` without shell interpolation.
 */
/** @internal */
export function installArgs(pm: string, packages: string[]): { file: string; args: string[] } {
  switch (pm) {
    case "pnpm": return { file: "pnpm", args: ["add", ...packages] };
    case "yarn": return { file: "yarn", args: ["add", ...packages] };
    case "bun":  return { file: "bun",  args: ["add", ...packages] };
    default:     return { file: "npm",  args: ["install", ...packages] };
  }
}

/**
 * Human-readable rendering of an install command (for prompts and "run manually" hints).
 * @internal
 */
export function formatInstallCommand(pm: string, packages: string[]): string {
  const { file, args } = installArgs(pm, packages);
  return `${file} ${args.join(" ")}`;
}

async function main() {
  p.intro("create-spaceis");

  p.note(
    [
      "   ____                       ___ ____  ",
      "  / ___| _ __   __ _  ___ ___|_ _/ ___| ",
      "  \\___ \\| '_ \\ / _` |/ __/ _ \\| |\\___ \\ ",
      "   ___) | |_) | (_| | (_|  __/| | ___) |",
      "  |____/| .__/ \\__,_|\\___\\___|___|____/ ",
      "        |_|                              ",
      "",
      "  Create your storefront on the SpaceIS platform!",
    ].join("\n"),
  );

  const mode = await p.select({
    message: "What do you want to do?",
    options: [
      {
        value: "example" as const,
        label: "Example",
        hint: "copy a ready-made project (React / Vue / Vanilla / PHP)",
      },
      {
        value: "blank" as const,
        label: "Blank",
        hint: "install SDK packages into an existing project",
      },
    ],
  });

  if (p.isCancel(mode)) cancel();

  if (mode === "example") {
    await handleExample();
  } else {
    await handleBlank();
  }
}

async function handleExample() {
  const example = await p.select({
    message: "Choose an example:",
    options: (Object.keys(EXAMPLES) as ExampleKey[]).map((key) => ({
      value: key,
      label: EXAMPLES[key].label,
      hint: EXAMPLES[key].hint,
    })),
  });

  if (p.isCancel(example)) cancel();

  const projectName = await p.text({
    message: "Project directory name:",
    placeholder: `my-spaceis-${example}`,
    defaultValue: `my-spaceis-${example}`,
    validate(value) {
      if (!value.trim()) return "Name is required.";
      if (fs.existsSync(path.resolve(value))) return `Directory "${value}" already exists.`;
    },
  });

  if (p.isCancel(projectName)) cancel();

  const targetDir = path.resolve(projectName);
  const { dir: subdir } = EXAMPLES[example as ExampleKey];

  const s = p.spinner();
  s.start(`Downloading ${example} example...`);

  try {
    await downloadTemplate(`github:${REPO}/${subdir}`, {
      dir: targetDir,
      force: false,
    });
    s.stop(`${example} example downloaded.`);
  } catch (err) {
    s.stop("Download failed.");
    const msg = err instanceof Error ? err.message : String(err);
    p.log.error(msg);
    // GitHub's public API caps unauthenticated requests at 60/hour/IP — surface that clearly.
    if (/403|429|rate[ _-]?limit|api rate/i.test(msg)) {
      p.log.info(
        "Hint: GitHub rate-limited this request. Set GITHUB_TOKEN to a personal access token " +
          "(scope: public_repo) and rerun — authenticated requests have a much higher quota.",
      );
    }
    process.exit(1);
  }

  const pm = detectPackageManager();
  const pkgJsonPath = path.join(targetDir, "package.json");
  const hasPackageJson = fs.existsSync(pkgJsonPath);
  let depsInstalled = false;

  // Resolve @spaceis/* versions to latest published on npm, so the example
  // always installs fresh regardless of what's committed in the repo.
  if (hasPackageJson) {
    const sr = p.spinner();
    sr.start("Resolving @spaceis/* versions to latest on npm...");
    try {
      const changed = await resolveSpaceisDepsToLatest(pkgJsonPath);
      if (changed.length > 0) {
        sr.stop(`Updated ${changed.length} @spaceis/* dependency${changed.length === 1 ? "" : "ies"} to latest.`);
        for (const line of changed) p.log.info(`  ${line}`);
      } else {
        sr.stop("No @spaceis/* dependencies to update.");
      }
    } catch (err) {
      sr.stop("Could not reach npm registry — keeping versions from the example.");
      p.log.warning(err instanceof Error ? err.message : String(err));
    }
  }

  if (hasPackageJson) {
    const shouldInstall = await p.confirm({
      message: `Install dependencies? (${pm} install)`,
      initialValue: true,
    });

    if (!p.isCancel(shouldInstall) && shouldInstall) {
      // Remove foreign lockfiles so the detected package manager doesn't conflict,
      // and drop the monorepo lockfile whose workspace-resolved refs no longer apply.
      for (const lockfile of ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"]) {
        const lf = path.join(targetDir, lockfile);
        if (fs.existsSync(lf)) fs.unlinkSync(lf);
      }

      const si = p.spinner();
      si.start(`Installing dependencies in ${projectName}/ ...`);
      try {
        await run(pm, ["install"], targetDir);
        si.stop("Dependencies installed.");
        depsInstalled = true;
      } catch (err) {
        si.stop("Failed to install dependencies.");
        if (err instanceof Error && err.message) p.log.error(err.message);
        p.log.warning(`Run manually: cd ${projectName} && ${pm} install`);
      }
    }
  }

  const steps = [`cd ${projectName}`];

  if (!depsInstalled && hasPackageJson) {
    steps.push(`${pm} install`);
  }

  if (example === "vanilla") {
    steps.push("open index.html");
  } else if (example === "php") {
    steps.push("cp .env.example .env  # configure your shop UUID");
    steps.push("php -S localhost:8080");
  } else {
    steps.push("cp .env.example .env.local  # configure your shop UUID");
    steps.push(`${pm} run dev`);
  }

  p.note(steps.join("\n"), "Next steps:");

  p.log.info("Docs:   https://docs.spaceis.app/api");
  p.log.info("GitHub: https://github.com/spaceis-app/spaceis-sdk");
  p.outro("Done!");
}

async function handleBlank() {
  if (!fs.existsSync(path.resolve("package.json"))) {
    p.log.warning("No package.json found in the current directory.");

    const projectName = await p.text({
      message: "Project name:",
      placeholder: "my-spaceis-app",
      defaultValue: "my-spaceis-app",
      validate(value) {
        if (!value.trim()) return "Name is required.";
      },
    });

    if (p.isCancel(projectName)) cancel();

    const targetDir = path.resolve(projectName);

    if (fs.existsSync(targetDir)) {
      p.log.error(`Directory "${projectName}" already exists.`);
      process.exit(1);
    }

    fs.mkdirSync(targetDir, { recursive: true });

    const pm = detectPackageManager();
    const s = p.spinner();
    s.start("Initializing project...");
    try {
      await run(pm, ["init", "-y"], targetDir);
      s.stop(`Project initialized in ${projectName}/`);
    } catch {
      s.stop("Failed to initialize project.");
      process.exit(1);
    }

    // Continue installation in the new directory
    process.chdir(targetDir);
  }

  const selected = await p.multiselect({
    message: "Choose packages to install:",
    options: PACKAGES.map((pkg) => ({
      value: pkg.value,
      label: pkg.label,
      hint: pkg.hint,
    })),
    required: true,
  });

  if (p.isCancel(selected)) cancel();

  // @spaceis/react and @spaceis/vue require @spaceis/sdk
  const packages = [...selected];
  const needsSdk =
    !packages.includes("@spaceis/sdk") &&
    (packages.includes("@spaceis/react") || packages.includes("@spaceis/vue"));

  if (needsSdk) {
    packages.unshift("@spaceis/sdk");
    p.log.info("Added @spaceis/sdk — required by " + packages.filter((p) => p !== "@spaceis/sdk").join(", "));
  }

  const pm = detectPackageManager();
  const display = formatInstallCommand(pm, packages);
  const { file, args } = installArgs(pm, packages);

  const shouldRun = await p.confirm({
    message: `Run: ${display} ?`,
    initialValue: true,
  });

  if (p.isCancel(shouldRun) || !shouldRun) {
    p.note(display, "Run manually:");
    p.outro("Done!");
    return;
  }

  const s = p.spinner();
  s.start("Installing packages...");

  try {
    await run(file, args);
    s.stop("Packages installed.");
  } catch (err) {
    s.stop("Failed to install packages.");
    if (err instanceof Error && err.message) p.log.error(err.message);
    p.note(display, "Run manually:");
  }

  p.note(
    [
      "import { createSpaceIS } from '@spaceis/sdk';",
      "",
      "const spaceis = createSpaceIS({",
      '  baseUrl: "https://your-shop.spaceis.app",',
      '  shopUuid: "your-shop-uuid",',
      "});",
    ].join("\n"),
    "Quick start:",
  );

  p.log.info("Docs:   https://docs.spaceis.app/api");
  p.log.info("GitHub: https://github.com/spaceis-app/spaceis-sdk");
  p.outro("Done!");
}

main().catch((err) => {
  p.log.error(String(err));
  process.exit(1);
});