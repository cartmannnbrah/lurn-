# Research agent

The Research agent is an isolated, read-only specialist behind Lurn. It can prepare a focused brief for a narrow topic, a LeetCode or interview question, or a whole module, across any subject. Its workflow and required `Summary`, `Findings`, `Sources`, and `Gaps` response format are defined in `ROLE.md`.

The Pi profile allowlists `web_search` and `web_fetch`. Those tools are supplied by separate Pi extensions at the paths described in the main project README; the Lurn repository does not install them. Until both extensions are installed and configured, the agent must disclose that it cannot conduct live web research and must not invent citations.
