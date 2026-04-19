import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  detectPackageManager,
  formatInstallCommand,
  getLatestVersion,
  installArgs,
  resolveSpaceisDepsToLatest,
} from "../index.js";

// ---------------------------------------------------------------------------
// 1. detectPackageManager
// ---------------------------------------------------------------------------

describe("detectPackageManager", () => {
  const originalUserAgent = process.env.npm_config_user_agent;

  afterEach(() => {
    if (originalUserAgent === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = originalUserAgent;
    }
  });

  it('returns "pnpm" when user agent starts with "pnpm"', () => {
    process.env.npm_config_user_agent = "pnpm/8.0.0 npm/? node/v20.0.0 linux x64";
    expect(detectPackageManager()).toBe("pnpm");
  });

  it('returns "yarn" when user agent starts with "yarn"', () => {
    process.env.npm_config_user_agent = "yarn/1.22.0 npm/? node/v20.0.0 linux x64";
    expect(detectPackageManager()).toBe("yarn");
  });

  it('returns "bun" when user agent starts with "bun"', () => {
    process.env.npm_config_user_agent = "bun/1.0.0 node/v20.0.0 linux x64";
    expect(detectPackageManager()).toBe("bun");
  });

  it('returns "npm" when user agent is empty string', () => {
    process.env.npm_config_user_agent = "";
    expect(detectPackageManager()).toBe("npm");
  });

  it('returns "npm" when user agent is undefined', () => {
    delete process.env.npm_config_user_agent;
    expect(detectPackageManager()).toBe("npm");
  });
});

// ---------------------------------------------------------------------------
// 2. installArgs
// ---------------------------------------------------------------------------

describe("installArgs", () => {
  const packages = ["@spaceis/sdk", "@spaceis/react"];

  it('returns pnpm add for "pnpm"', () => {
    expect(installArgs("pnpm", packages)).toEqual({
      file: "pnpm",
      args: ["add", ...packages],
    });
  });

  it('returns yarn add for "yarn"', () => {
    expect(installArgs("yarn", packages)).toEqual({
      file: "yarn",
      args: ["add", ...packages],
    });
  });

  it('returns bun add for "bun"', () => {
    expect(installArgs("bun", packages)).toEqual({
      file: "bun",
      args: ["add", ...packages],
    });
  });

  it('returns npm install for "npm" (default/unknown)', () => {
    expect(installArgs("npm", packages)).toEqual({
      file: "npm",
      args: ["install", ...packages],
    });
  });
});

// ---------------------------------------------------------------------------
// 3. formatInstallCommand (smoke test)
// ---------------------------------------------------------------------------

describe("formatInstallCommand", () => {
  it("formats pnpm add command correctly", () => {
    expect(formatInstallCommand("pnpm", ["@spaceis/sdk"])).toBe("pnpm add @spaceis/sdk");
  });
});

// ---------------------------------------------------------------------------
// 4. getLatestVersion
// ---------------------------------------------------------------------------

describe("getLatestVersion", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ version: "1.2.3" }), { status: 200 })),
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the version string from a successful registry response", async () => {
    const version = await getLatestVersion("@spaceis/sdk");
    expect(version).toBe("1.2.3");
  });

  it("calls fetch with a URL where @ is literal (not %40) and ends with /latest", async () => {
    await getLatestVersion("@spaceis/sdk");
    const fetchMock = vi.mocked(fetch);
    const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
    // encodeURIComponent replaces @ with %40 and / with %2F;
    // the implementation only restores %40 → @ (the / remains %2F, which the registry also accepts)
    expect(calledUrl).toMatch(/^https:\/\/registry\.npmjs\.org\/@/);
    expect(calledUrl).toMatch(/\/latest$/);
    expect(calledUrl).not.toContain("%40");
  });

  it("throws an Error containing the status code on non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ error: "Not found" }), { status: 404 })),
      ),
    );
    await expect(getLatestVersion("@spaceis/sdk")).rejects.toThrow("404");
  });

  it('throws an Error containing "Invalid registry payload" when version field is missing', async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))),
    );
    await expect(getLatestVersion("@spaceis/sdk")).rejects.toThrow("Invalid registry payload");
  });
});

// ---------------------------------------------------------------------------
// 5. resolveSpaceisDepsToLatest
// ---------------------------------------------------------------------------

describe("resolveSpaceisDepsToLatest", () => {
  let tmpFile: string;

  function writePkg(content: unknown): void {
    fs.writeFileSync(tmpFile, JSON.stringify(content, null, 2) + "\n", "utf8");
  }

  function readPkg(): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(tmpFile, "utf8")) as Record<string, unknown>;
  }

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `tmp-${Date.now()}-${Math.random()}.json`);

    const versionMap: Record<string, string> = {
      "@spaceis/sdk": "0.2.0",
      "@spaceis/react": "0.1.5",
      "@spaceis/vue": "0.1.2",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn((url: unknown) => {
        const urlStr = url as string;
        const match = urlStr.match(/registry\.npmjs\.org\/(.+?)\/latest/);
        const rawPkg = match?.[1] ?? "";
        const pkg = decodeURIComponent(rawPkg);
        const version = versionMap[pkg] ?? "0.0.0";
        return Promise.resolve(new Response(JSON.stringify({ version }), { status: 200 }));
      }),
    );
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
    vi.restoreAllMocks();
  });

  it("updates @spaceis/* versions in dependencies and returns change list", async () => {
    writePkg({ dependencies: { "@spaceis/sdk": "^0.1.4" } });

    const changed = await resolveSpaceisDepsToLatest(tmpFile);

    expect(changed.length).toBe(1);
    expect(changed[0]).toContain("@spaceis/sdk");

    const pkg = readPkg();
    expect((pkg.dependencies as Record<string, string>)["@spaceis/sdk"]).toBe("^0.2.0");
  });

  it("updates @spaceis/* versions in devDependencies and returns change list", async () => {
    writePkg({ devDependencies: { "@spaceis/react": "^0.1.0" } });

    const changed = await resolveSpaceisDepsToLatest(tmpFile);

    expect(changed.length).toBe(1);
    expect(changed[0]).toContain("@spaceis/react");

    const pkg = readPkg();
    expect((pkg.devDependencies as Record<string, string>)["@spaceis/react"]).toBe("^0.1.5");
  });

  it("does not modify non-@spaceis dependencies", async () => {
    writePkg({ dependencies: { "@spaceis/sdk": "^0.1.4", next: "^16.0.0" } });

    await resolveSpaceisDepsToLatest(tmpFile);

    const pkg = readPkg();
    expect((pkg.dependencies as Record<string, string>)["next"]).toBe("^16.0.0");
  });

  it("calls fetch only once per package even when it appears in both dep sections", async () => {
    writePkg({
      dependencies: { "@spaceis/sdk": "^0.1.4" },
      devDependencies: { "@spaceis/sdk": "^0.1.4" },
    });

    await resolveSpaceisDepsToLatest(tmpFile);

    const fetchMock = vi.mocked(fetch);
    const sdkCalls = fetchMock.mock.calls.filter((call) =>
      (call[0] as string).includes("@spaceis%2Fsdk") ||
      (call[0] as string).includes("@spaceis/sdk"),
    );
    expect(sdkCalls.length).toBe(1);
  });

  it("returns empty array and does not write file when all versions already match", async () => {
    writePkg({ dependencies: { "@spaceis/sdk": "^0.2.0" } });

    const mtimeBefore = fs.statSync(tmpFile).mtimeMs;
    const changed = await resolveSpaceisDepsToLatest(tmpFile);

    expect(changed).toHaveLength(0);

    // Allow a small timing margin — file must not have been rewritten
    const mtimeAfter = fs.statSync(tmpFile).mtimeMs;
    expect(mtimeAfter).toBe(mtimeBefore);
  });

  it('throws an Error starting with "Invalid JSON in" for malformed JSON', async () => {
    fs.writeFileSync(tmpFile, "not-json", "utf8");

    await expect(resolveSpaceisDepsToLatest(tmpFile)).rejects.toThrow(/^Invalid JSON in/);
  });
});
