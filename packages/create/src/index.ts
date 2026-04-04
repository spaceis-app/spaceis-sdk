import * as p from "@clack/prompts";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { downloadTemplate } from "giget";

const REPO = "spaceis-app/spaceis-sdk";

const EXAMPLES = {
  react: {
    label: "React    — Next.js App Router + SSR + hooks",
    dir: "examples/react",
  },
  vue: {
    label: "Vue      — Nuxt 4 + SSR + composables",
    dir: "examples/vue",
  },
  vanilla: {
    label: "Vanilla  — HTML + vanilla JS + SDK IIFE",
    dir: "examples/vanilla",
  },
  php: {
    label: "PHP      — PHP SSR + client-side SDK",
    dir: "examples/php",
  },
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

function run(cmd: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let stderr = "";
    const child = spawn(cmd, {
      cwd,
      stdio: "pipe",
      shell: true,
      env: { ...process.env, CI: "1" },
    });
    child.stdin?.end();
    child.stdout?.resume();
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    child.on("close", (code) => (code === 0 ? resolve(stderr) : reject(new Error(stderr || `Exit code ${code}`))));
    child.on("error", reject);
  });
}

function cancel(): never {
  p.cancel("Cancelled.");
  process.exit(0);
}

function detectPackageManager(): "pnpm" | "npm" | "yarn" | "bun" {
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("pnpm")) return "pnpm";
  if (ua.startsWith("yarn")) return "yarn";
  if (ua.startsWith("bun")) return "bun";

  // Fallback: check runtime (e.g. `bun script.js` doesn't set npm_config_user_agent)
  if (process.versions.bun) return "bun";

  return "npm";
}

function installCommand(pm: string, packages: string[]): string {
  const pkgs = packages.join(" ");
  switch (pm) {
    case "pnpm":
      return `pnpm add ${pkgs}`;
    case "yarn":
      return `yarn add ${pkgs}`;
    case "bun":
      return `bun add ${pkgs}`;
    default:
      return `npm install ${pkgs}`;
  }
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
    options: [
      { value: "react" as const, label: "React", hint: "Next.js App Router + SSR + hooks" },
      { value: "vue" as const, label: "Vue", hint: "Nuxt 4 + SSR + composables" },
      { value: "vanilla" as const, label: "Vanilla", hint: "HTML + vanilla JS + SDK IIFE" },
      { value: "php" as const, label: "PHP", hint: "PHP SSR + client-side SDK" },
    ],
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
    p.log.error(String(err));
    process.exit(1);
  }

  const pm = detectPackageManager();
  const hasPackageJson = fs.existsSync(path.join(targetDir, "package.json"));
  let depsInstalled = false;

  if (hasPackageJson) {
    const shouldInstall = await p.confirm({
      message: `Install dependencies? (${pm} install)`,
      initialValue: true,
    });

    if (!p.isCancel(shouldInstall) && shouldInstall) {
      // Remove foreign lockfiles so the detected package manager doesn't conflict
      for (const lockfile of ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"]) {
        const lf = path.join(targetDir, lockfile);
        if (fs.existsSync(lf)) fs.unlinkSync(lf);
      }

      const si = p.spinner();
      si.start(`Installing dependencies in ${projectName}/ ...`);
      try {
        await run(`${pm} install`, targetDir);
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
      await run(`${pm} init -y`, targetDir);
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
  const cmd = installCommand(pm, packages);

  const shouldRun = await p.confirm({
    message: `Run: ${cmd} ?`,
    initialValue: true,
  });

  if (p.isCancel(shouldRun) || !shouldRun) {
    p.note(cmd, "Run manually:");
    p.outro("Done!");
    return;
  }

  const s = p.spinner();
  s.start("Installing packages...");

  try {
    await run(cmd);
    s.stop("Packages installed.");
  } catch {
    s.stop("Failed to install packages.");
    p.note(cmd, "Run manually:");
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