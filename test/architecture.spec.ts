import { readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";

const SRC_DIR = join(__dirname, "..", "src");
const DOMAIN_DIR = `${sep}domain${sep}`;
const APPLICATION_DIR = `${sep}application${sep}`;
const INFRASTRUCTURE_DIR = `${sep}infrastructure${sep}`;

const IMPORT_RE = /import\s+(?:type\s+)?[^'"]*?from\s*['"]([^'"]+)['"]/g;

function collectTsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectTsFiles(fullPath);
    }
    return entry.name.endsWith(".ts") ? [fullPath] : [];
  });
}

function extractImports(content: string): string[] {
  return [...content.matchAll(IMPORT_RE)].map((match) => match[1]);
}

function isBarePackage(specifier: string): boolean {
  return !specifier.startsWith("node:") && !specifier.startsWith(".");
}

describe("hexagonal architecture", () => {
  const files = collectTsFiles(SRC_DIR);

  it("domain does not import third-party modules or other layers", () => {
    const violations: string[] = [];

    for (const file of files.filter((f) => f.includes(DOMAIN_DIR))) {
      for (const specifier of extractImports(readFileSync(file, "utf8"))) {
        if (
          isBarePackage(specifier) ||
          specifier.includes(INFRASTRUCTURE_DIR) ||
          specifier.includes(APPLICATION_DIR)
        ) {
          violations.push(`${file} → "${specifier}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("application does not import infrastructure", () => {
    const violations: string[] = [];

    for (const file of files.filter((f) => f.includes(APPLICATION_DIR))) {
      for (const specifier of extractImports(readFileSync(file, "utf8"))) {
        if (specifier.includes(INFRASTRUCTURE_DIR)) {
          violations.push(`${file} → "${specifier}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
