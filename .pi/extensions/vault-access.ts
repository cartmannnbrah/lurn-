import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const extensionPath = fileURLToPath(import.meta.url);
const pdfExtractorPath = join(dirname(extensionPath), "extract-pdf-text.swift");
const MAX_TEXT_CHARS = 32_000;
const MAX_SEARCH_RESULTS = 100;
const MAX_WALK_FILES = 5_000;
const TEXT_EXTENSIONS = new Set([".md", ".txt", ".tex", ".csv", ".json", ".canvas", ".yaml", ".yml"]);
const SKIP_DIRECTORIES = new Set([".obsidian", ".trash", ".git", "node_modules"]);

function expandHome(value: string): string {
  if (value === "~") return homedir();
  if (value.startsWith("~/")) return join(homedir(), value.slice(2));
  return value;
}

function isInside(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function isExcludedVaultPath(path: string): boolean {
  return path
    .split(/[\\/]+/)
    .filter((part) => part && part !== "." && part !== "..")
    .some((part) => part.startsWith(".") || SKIP_DIRECTORIES.has(part));
}

function looksLikeVault(directory: string): boolean {
  return existsSync(join(directory, "Lurn", "Current Session.canvas"));
}

function getVaultRoot(): string {
  const configured = process.env.LURN_OBSIDIAN_VAULT?.trim();
  const candidate = configured
    ? expandHome(configured)
    : looksLikeVault(process.cwd())
      ? process.cwd()
      : join(homedir(), "Documents", "Obsidian Vault");

  if (!existsSync(candidate) || !statSync(candidate).isDirectory()) {
    throw new Error(`Configured Obsidian vault is unavailable: ${candidate}`);
  }
  return realpathSync(candidate);
}

function resolveVaultPath(root: string, requestedPath: string): { absolute: string; relative: string } {
  const clean = requestedPath.trim() || ".";
  if (isAbsolute(clean)) throw new Error("Use a path relative to the Obsidian vault.");
  if (isExcludedVaultPath(clean)) {
    throw new Error("Hidden files and folders, Obsidian settings, trash, Git data, and dependency folders are outside the research scope.");
  }
  const lexicalPath = resolve(root, clean);
  if (!isInside(root, lexicalPath)) throw new Error("That path is outside the Obsidian vault.");

  const absolute = realpathSync(lexicalPath);
  if (!isInside(root, absolute)) throw new Error("That path resolves outside the Obsidian vault.");
  const resolvedRelativePath = relative(root, absolute);
  if (resolvedRelativePath && isExcludedVaultPath(resolvedRelativePath)) {
    throw new Error("That path resolves to hidden or excluded vault content.");
  }
  return { absolute, relative: relative(root, absolute).split(sep).join("/") || "." };
}

function relativeVaultPath(root: string, absolute: string): string {
  return relative(root, absolute).split(sep).join("/") || ".";
}

function walkFiles(root: string, start: string, maxFiles: number): string[] {
  const output: string[] = [];
  const visit = (directory: string, depth: number) => {
    if (depth > 16 || output.length >= maxFiles) return;
    let entries;
    try {
      entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return;
    }
    for (const entry of entries) {
      if (output.length >= maxFiles) break;
      if (entry.name.startsWith(".")) continue;
      const absolute = join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) visit(absolute, depth + 1);
      } else if (entry.isFile()) {
        output.push(absolute);
      }
    }
  };
  visit(start, 0);
  return output;
}

function readPdfText(absolutePath: string, startPage: number, pageCount: number): string {
  if (process.platform === "darwin" && existsSync(pdfExtractorPath)) {
    return execFileSync(
      "swift",
      [pdfExtractorPath, absolutePath, String(startPage), String(pageCount)],
      { encoding: "utf8", timeout: 60_000, maxBuffer: 12 * 1024 * 1024 },
    );
  }
  if (process.platform !== "darwin") {
    return execFileSync(
      "pdftotext",
      ["-layout", "-f", String(startPage), "-l", String(startPage + pageCount - 1), absolutePath, "-"],
      { encoding: "utf8", timeout: 30_000, maxBuffer: 12 * 1024 * 1024 },
    );
  }
  throw new Error("PDF reading needs macOS Swift/PDFKit or the pdftotext command.");
}

function makeTextResult(text: string, details: Record<string, unknown> = {}) {
  return { content: [{ type: "text" as const, text }], details };
}

export default function vaultAccess(pi: ExtensionAPI) {
  pi.registerTool({
    name: "vault_list",
    label: "vault_list",
    description:
      "List files and folders inside the configured Obsidian vault. Paths are vault-relative. This tool cannot access files outside the vault and is read-only.",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    promptSnippet: "List relevant files in the configured Obsidian vault.",
    executionMode: "sequential",
    parameters: Type.Object({
      path: Type.Optional(Type.String({ description: "Vault-relative folder path; defaults to the vault root." })),
      recursive: Type.Optional(Type.Boolean({ description: "List nested entries too; defaults to false." })),
      maxEntries: Type.Optional(Type.Number({ description: "Maximum entries to return (capped at 1000)." })),
    }),
    async execute(_toolCallId, params) {
      try {
        const root = getVaultRoot();
        const target = resolveVaultPath(root, params.path ?? ".");
        if (!statSync(target.absolute).isDirectory()) throw new Error("The requested vault path is not a folder.");
        const maxEntries = Math.max(1, Math.min(1000, Math.floor(params.maxEntries ?? 200)));
        const entries = params.recursive
          ? walkFiles(root, target.absolute, maxEntries).map((file) => ({
              path: relativeVaultPath(root, file),
              type: "file",
            }))
          : readdirSync(target.absolute, { withFileTypes: true })
              .filter(
                (entry) =>
                  !entry.name.startsWith(".") &&
                  !SKIP_DIRECTORIES.has(entry.name) &&
                  !entry.isSymbolicLink(),
              )
              .map((entry) => ({
                path: [target.relative, entry.name].filter((part) => part && part !== ".").join("/"),
                type: entry.isDirectory() ? "folder" : "file",
              }))
              .sort((a, b) => a.path.localeCompare(b.path))
              .slice(0, maxEntries);
        const rootNote = `Vault root: ${root}\nFolder: ${target.relative}\n`;
        return makeTextResult(rootNote + entries.map((entry) => `${entry.type}: ${entry.path}`).join("\n"), {
          vaultRoot: root,
          folder: target.relative,
          entries,
        });
      } catch (error) {
        return makeTextResult(`Vault listing unavailable: ${(error as Error).message}`, { status: "unavailable" });
      }
    },
  });

  pi.registerTool({
    name: "vault_search",
    label: "vault_search",
    description:
      "Search text notes inside the configured Obsidian vault. Search is literal and case-insensitive. PDFs are not scanned automatically; find a PDF with vault_list, then use vault_read to extract its text. This tool is read-only and cannot search outside the vault.",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    promptSnippet: "Search relevant Markdown and text notes inside the Obsidian vault.",
    executionMode: "sequential",
    parameters: Type.Object({
      query: Type.String({ description: "Literal text to find." }),
      path: Type.Optional(Type.String({ description: "Vault-relative folder to search; defaults to the vault root." })),
      maxResults: Type.Optional(Type.Number({ description: "Maximum matches to return (capped at 100)." })),
    }),
    async execute(_toolCallId, params) {
      try {
        const root = getVaultRoot();
        const target = resolveVaultPath(root, params.path ?? ".");
        if (!statSync(target.absolute).isDirectory()) throw new Error("The requested vault path is not a folder.");
        const query = params.query.trim().toLocaleLowerCase();
        if (!query) throw new Error("Search query cannot be empty.");
        const maxResults = Math.max(1, Math.min(MAX_SEARCH_RESULTS, Math.floor(params.maxResults ?? 40)));
        const files = walkFiles(root, target.absolute, MAX_WALK_FILES);
        const matches: string[] = [];
        let scanned = 0;

        for (const file of files) {
          if (matches.length >= maxResults) break;
          if (!TEXT_EXTENSIONS.has(extname(file).toLowerCase())) continue;
          try {
            if (statSync(file).size > 1_500_000) continue;
            const lines = readFileSync(file, "utf8").split(/\r?\n/);
            scanned += 1;
            for (let index = 0; index < lines.length; index += 1) {
              if (lines[index].toLocaleLowerCase().includes(query)) {
                const snippet = lines[index].trim().slice(0, 240);
                matches.push(`${relativeVaultPath(root, file)}:${index + 1}: ${snippet}`);
                if (matches.length >= maxResults) break;
              }
            }
          } catch {
            // Ignore unreadable files and continue the bounded search.
          }
        }

        const heading = `Vault search: ${params.query}\nFolder: ${target.relative}\nText files scanned: ${scanned}\n`;
        return makeTextResult(heading + (matches.length ? matches.join("\n") : "No matches found."), {
          vaultRoot: root,
          folder: target.relative,
          query: params.query,
          scanned,
          matches,
        });
      } catch (error) {
        return makeTextResult(`Vault search unavailable: ${(error as Error).message}`, { status: "unavailable" });
      }
    },
  });

  pi.registerTool({
    name: "vault_read",
    label: "vault_read",
    description:
      "Read a Markdown/text source or extract selectable text from a PDF inside the configured Obsidian vault. Supply a vault-relative path. PDF reading uses macOS PDFKit; scanned/image-only PDFs need OCR and will be reported as having no selectable text. This tool is read-only and rejects paths or symlinks that leave the vault.",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    promptSnippet: "Read a relevant note or lecture PDF from the Obsidian vault.",
    executionMode: "sequential",
    parameters: Type.Object({
      path: Type.String({ description: "Path to a file, relative to the Obsidian vault." }),
      maxChars: Type.Optional(Type.Number({ description: "Maximum characters to return (capped at 32000)." })),
      startPage: Type.Optional(Type.Number({ description: "PDF page to start at, 1-indexed." })),
      pageCount: Type.Optional(Type.Number({ description: "PDF pages to read (capped at 100)." })),
    }),
    async execute(_toolCallId, params) {
      try {
        const root = getVaultRoot();
        const target = resolveVaultPath(root, params.path);
        const entry = lstatSync(target.absolute);
        if (!entry.isFile()) throw new Error("The requested path is not a regular file.");
        const extension = extname(target.absolute).toLowerCase();
        const maxChars = Math.max(500, Math.min(MAX_TEXT_CHARS, Math.floor(params.maxChars ?? MAX_TEXT_CHARS)));
        let text: string;
        if (extension === ".pdf") {
          const startPage = Math.max(1, Math.floor(params.startPage ?? 1));
          const pageCount = Math.max(1, Math.min(100, Math.floor(params.pageCount ?? 30)));
          text = readPdfText(target.absolute, startPage, pageCount);
          if (!text.trim()) {
            return makeTextResult(
              `No selectable text found in ${target.relative}. It may be image-only; OCR is not included.`,
              { status: "no_text", path: target.relative },
            );
          }
        } else if (TEXT_EXTENSIONS.has(extension)) {
          if (entry.size > 2_000_000) throw new Error("File is over the 2 MB text-read limit.");
          text = readFileSync(target.absolute, "utf8");
        } else {
          throw new Error(`Unsupported file type: ${extension || "no extension"}. Read Markdown, text, TeX, CSV, JSON, Canvas, YAML, or PDF files.`);
        }

        const truncated = text.length > maxChars;
        const content = truncated ? `${text.slice(0, maxChars)}\n\n[Output truncated; request a smaller PDF page range or a narrower source.]` : text;
        return makeTextResult(`Source: [[${target.relative}]]\n\n${content}`, {
          path: target.relative,
          truncated,
          characters: Math.min(text.length, maxChars),
        });
      } catch (error) {
        return makeTextResult(`Vault read unavailable: ${(error as Error).message}`, {
          status: "unavailable",
          requestedPath: params.path,
        });
      }
    },
  });

  pi.on("session_start", async () => {
    const bridge = (globalThis as any).__pi_interactive_subagents as
      | { registerToolExtension?: (name: string, path: string) => void }
      | undefined;
    if (!bridge?.registerToolExtension) return;
    for (const name of ["vault_list", "vault_search", "vault_read"]) {
      try {
        bridge.registerToolExtension(name, extensionPath);
      } catch {
        // Safe on /reload: the same tool can already be mapped to this file.
      }
    }
  });
}
