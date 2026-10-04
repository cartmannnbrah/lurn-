# Research agent

The Research agent is an isolated, read-only specialist behind Lurn. It can inspect the configured Obsidian vault with `vault_list`, `vault_search`, and `vault_read`. These tools are confined to visible vault content and cannot write; the profile grants no general filesystem or shell tools. On macOS, the project extension extracts selectable text from PDFs. Image-only PDFs need OCR.

When the `web_search` and `web_fetch` tools are installed and available, the agent researches varied angles and fetches the strongest sources. This repository does not currently configure a live web-search provider. Without one, it can still prepare a source-based brief from the Obsidian course materials and must report that web research was unavailable.

The detailed process and required `Summary`, `Findings`, `Sources`, and `Gaps` format are in `ROLE.md`; the runtime instructions are also embedded in `.pi/agents/research.md` because the subagent receives a restricted tool allowlist.
