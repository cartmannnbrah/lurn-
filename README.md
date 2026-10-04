# Lurn

Lurn is a step-by-step tutor for Warwick Maths and Physics, other subjects, LeetCode, and quantitative or general interview questions. You talk directly to the main Lurn teacher; specialist agents work behind it when useful.

Lurn currently runs in Pi's interactive terminal. It is not a separate desktop or web app yet. The structure takes inspiration from the [learn Pi setup](https://github.com/amosblomqvist/learn).

## Agent folders

| Folder | Responsibility | Status |
|---|---|---|
| `.pi/SYSTEM.md` | Makes the Pi root session act as Lurn's main teacher and coordinator | Active |
| `agents/teaching/` | Lesson flow, quizzes, and keeping the Obsidian lesson board current | Active role |
| `agents/research/` | Web research briefs for concepts, problems, interview questions, or whole modules | Role and tool allowlist ready; web-search extensions still need installing/configuring |
| `agents/notes/` | Save concise lesson notes to the right Obsidian module or practice folder | Active role; needs a configured vault path |
| `agents/latex/` | Turn rough or dictated mathematical working into clean LaTeX | Planned |

The research and notes specialists have Pi profiles in `.pi/agents/`. They return their work to Lurn, which keeps teaching and quizzing you. There is no separate teacher agent to summon. Each role's instructions live in its folder so you can refine the agents separately.

## Run Lurn

Requirements: Pi, access to a model provider, and tmux for the [interactive subagent extension](https://github.com/amosblomqvist/pi-interactive-subagents). Pi's npm installation requires Node.js 22.19 or newer; the [official Pi quickstart](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/quickstart.md) also offers an installer for macOS and Linux.

1. Install Pi using the official macOS/Linux installer or its npm instructions.
2. From this repository, install the interactive subagent extension:

   `pi install -l git:github.com/amosblomqvist/pi-interactive-subagents`

3. The Research profile allows `web_search` and `web_fetch`, but live research needs matching Pi extensions at `~/.pi/agent/extensions/web-search/index.ts` and `~/.pi/agent/extensions/web-fetch/index.ts`. The interactive-subagents extension loads them from those paths. The example `web_search` in [amosblomqvist/pi-config](https://github.com/amosblomqvist/pi-config/tree/main/extensions/web-search) uses Google's Custom Search JSON API, which Google has closed to new customers; it is not a from-scratch option unless you already have access. The Lurn project still needs a suitable search provider selected and connected to the subagent tool loader. Until then, the Research agent must say live web search is unavailable. Keep API credentials out of this repository.

4. Set the path to your Obsidian vault in the terminal. This is local configuration and should not be committed:

   `export LURN_OBSIDIAN_VAULT="/path/to/your/Obsidian Vault"`

5. Start Pi from the repository root with `./run-lurn.sh`. Trust the Lurn project when Pi prompts so it can load the project instructions and agent profiles. Use `/login` to connect a model provider if you have not already.
6. Talk to Lurn directly, for example: “Teach me eigenvectors from my MA149 notes,” “Map the whole PX156 module,” or “Give me a hint for this LeetCode problem.”

The first time you open Pi in the Lurn repository, its project instructions make the root session the tutor. Lurn can call the research and notes agents without you typing a `/subagent teacher` command.

## Obsidian as the lesson board

Lurn uses the vault path in `LURN_OBSIDIAN_VAULT`. It creates a fresh Canvas for each lesson in the relevant module folder, or in the relevant Practice or Career area for coding and interview sessions. The Canvas is the live board for the goal, current question, definitions, working, and diagrams. Course notes appear as linked source cards. Diagrams can be linked as image files when that capability is added.

The notes agent writes a separate, concise Markdown study note after a substantive lesson. It does not replace source notes; it asks Lurn when the destination is ambiguous or an existing note might need changing.

## Agent roles

- **Lurn / teacher:** Main point of contact. Adapts to a single topic, a problem-solving session, or a broad module request; teaches and quizzes directly; coordinates specialists; maintains the live Obsidian Canvas.
- **Research:** Read-only. Receives a self-contained task, searches 2–4 facets from varied angles, fetches the strongest sources, and returns a cited brief with `Summary`, `Findings`, `Sources`, and `Gaps`. Its profile allows `web_search` and `web_fetch`; the extensions still need to be installed and configured as described above before live research works.
- **Notes:** Writes a concise lesson note to the exact destination Lurn provides in the configured vault. It does not teach, invent missing course facts, or overwrite existing notes.
- **LaTeX:** Planned as a separate role.

## First milestone

Use Lurn for one real topic or interview question. Check that the teacher scopes the request well, asks questions one at a time, uses the Canvas as the visual board, delegates only when useful, and saves a clear note in the right place. Record specific improvements in `agents/teaching/REVIEW.md`.
