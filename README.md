# Lurn

Lurn is a step-by-step tutor for Warwick Maths and Physics, other subjects, LeetCode, and quantitative or general interview questions. You talk directly to the main Lurn teacher; specialist agents work behind it when useful.

Lurn currently runs in Pi's interactive terminal. It is not a separate desktop or web app yet. The structure takes inspiration from the [learn Pi setup](https://github.com/amosblomqvist/learn).

## Agent folders

| Folder | Responsibility | Status |
|---|---|---|
| `.pi/SYSTEM.md` | Makes the Pi root session act as Lurn's main teacher and coordinator | Active |
| `agents/teaching/` | Lesson flow, quizzes, and keeping the Obsidian lesson board current | Active role |
| `agents/research/` | Local Obsidian research briefs, with web research when configured | Vault tools ready; live web search still needs a provider |
| `agents/notes/` | Save concise lesson notes to the right Obsidian module or practice folder | Active role; launcher supplies the default vault path |
| `agents/latex/` | Turn rough or dictated mathematical working into clean LaTeX | Planned |

The research and notes specialists have Pi profiles in `.pi/agents/`. They return their work to Lurn, which keeps teaching and quizzing you. There is no separate teacher agent to summon. Each role's instructions live in its folder so you can refine the agents separately.

The project extensions in `.pi/extensions/lesson-interactions.ts` provide `quiz` for right-or-wrong checks and `ask_user_question` for genuine preferences. `.pi/extensions/vault-access.ts` provides read-only, vault-scoped listing, search, and reading tools. It reads Markdown and other text notes directly and extracts selectable PDF text with macOS PDFKit; image-only PDFs need OCR. The Research profile has no general filesystem, shell, or write tools.

Lurn's project settings collapse thinking blocks by default. Press **Ctrl+T** to expand or collapse them during a session. **Ctrl+O** is Pi's separate shortcut for expanding or collapsing tool output. Restart Pi from this repository after changing the setting.

## Run Lurn

Requirements: Pi, access to a model provider, and tmux for the [interactive subagent extension](https://github.com/amosblomqvist/pi-interactive-subagents). Pi's npm installation requires Node.js 22.19 or newer; the [official Pi quickstart](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/quickstart.md) also offers an installer for macOS and Linux.

1. Install Pi using the official macOS/Linux installer or its npm instructions.
2. From this repository, install the interactive subagent extension:

   `pi install -l git:github.com/amosblomqvist/pi-interactive-subagents`

3. Local research works from the configured Obsidian vault through `vault_list`, `vault_search`, and `vault_read`. Live web research still needs working `web_search` and `web_fetch` extensions in `~/.pi/agent/extensions/`; the Research agent must disclose if those tools are unavailable and must not invent citations. The previously considered `pi-config` sample uses Google Custom Search and is not a turnkey provider setup; select and configure a suitable provider before relying on live search. Keep API credentials out of this repository.
4. Start Pi from the repository root with `./run-lurn.sh`. The launcher uses `~/Documents/Obsidian Vault` as the default vault. Set `LURN_OBSIDIAN_VAULT` before launching only if you want to use a different vault. Trust the Lurn project when Pi prompts so it can load project instructions and agent profiles. Use `/login` to connect a model provider if needed.
5. Talk to Lurn directly, for example: “Teach me eigenvectors from my MA149 notes,” “Map the whole PX156 module,” or “Give me a hint for this LeetCode problem.”

The first time you open Pi in the Lurn repository, its project instructions make the root session the tutor. Lurn can call the research and notes agents without you typing a `/subagent teacher` command.

## Obsidian as the lesson board

Lurn uses `LURN_OBSIDIAN_VAULT` (default `~/Documents/Obsidian Vault`). `Lurn/Current Session.canvas` is the reusable live board. At the start of a lesson, Lurn clears stale session content and updates the board while teaching. When a lesson ends, it saves any requested permanent summary under the module's `Revision/` folder, then clears the board. Lecture PDFs remain in each module's `Lectures/` folder and can be linked from the Canvas.

The notes agent writes a separate, concise Markdown study note after a substantive lesson. It does not replace source notes; it asks Lurn when the destination is ambiguous or an existing note might need changing.

## Agent roles

- **Lurn / teacher:** Main point of contact. Maps the learner's level and goal, researches and presents a dependency plan for approval, then teaches and checks one connected idea at a time.
- **Research:** Read-only. Reads relevant local course sources first, then searches 2–4 facets and fetches strong web sources when the required tools are available. Returns `Summary`, `Findings`, `Sources`, and `Gaps`. Online search still needs a provider; without it, the agent reports that it used local material only.
- **Notes:** Writes a concise lesson note to the exact destination Lurn provides in the configured vault. It does not teach, invent missing course facts, or overwrite existing notes.
- **LaTeX:** Planned as a separate role.

## First milestone

Restart Pi from this repository and confirm the quiz, preference, and vault tools load. Try one lesson from a Warwick module folder and check that Research cites the right local sources. Then verify the live Canvas and notes-agent save in Obsidian. Record teaching improvements in `agents/teaching/REVIEW.md`.
