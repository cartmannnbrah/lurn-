# Lurn

Lurn is a step-by-step AI tutor for your Warwick Maths and Physics course. The first version runs inside Pi's interactive terminal app, following the structure of the learn project you referenced.

Codex is used to build Lurn. Pi runs it. The agent instructions and role folders are kept in this repository so you can edit each agent independently.

## Agent folders

| Folder | Responsibility | Status |
|---|---|---|
| agents/teaching/ | Teach concepts and quiz you interactively | Active first agent |
| agents/latex/ | Turn dictated or rough working into LaTeX | Planned |
| agents/notes/ | Summarize what you learned into the matching module folder | Planned |
| agents/research/ | Check uncertain claims against reliable sources | Planned |

The Pi profile for the active teaching agent is in .pi/agents/teacher.md. It starts the agent in agents/teaching/, where the role instructions live. The future agents have their own folders now; we will activate them after working through each role.

## Run Lurn

Lurn currently uses Pi's terminal interface; it is not a separate macOS app yet.

Requirements: Pi, a configured model provider, and tmux for the interactive subagent panes.

1. Install Pi using the official Pi instructions: https://github.com/earendil-works/pi. Pi currently requires Node.js 22.19 or newer if you use its npm installation.
2. From this repository, install the interactive subagent extension:
   pi install -l git:github.com/amosblomqvist/pi-interactive-subagents
3. Start Pi from the repository root:
   ./run-lurn.sh
4. In Pi, start a teaching session:
   /subagent teacher Teach me [topic] using [path to a course note]

Example:
   /subagent teacher Teach me the topic in /path/to/my/lecture-note.md one step at a time.

The teaching pane remains interactive so you can answer questions and ask for hints. The teaching agent has read-only file access.

## First milestone

Make the teaching loop useful before adding more agent behavior: understand your goal, teach one idea at a time, quiz without revealing the answer, adapt to your response, and finish with a short recap.

Use the teaching agent folder at agents/teaching/README.md to refine its role and its review checklist at agents/teaching/REVIEW.md to assess sessions manually.

## Planned architecture

- Each agent has an independent folder and role description.
- Pi agent profiles define how a role runs and which tools it may use.
- A future orchestrator can pass work to the LaTeX, notes, or research agent.
- The notes agent will eventually write to the matching Maths or Physics module folder in your Obsidian vault. The first teaching agent will not edit your notes.
