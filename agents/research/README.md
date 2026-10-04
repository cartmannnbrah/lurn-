# Research agent

The Research agent is an isolated, read-only specialist behind Lurn. It can prepare a focused brief for a narrow topic, a LeetCode or interview question, or a whole module, across any subject. Its workflow and required `Summary`, `Findings`, `Sources`, and `Gaps` response format are defined in `ROLE.md`.

The Pi profile allowlists `web_search` and `web_fetch`, but the Lurn repository does not yet install a working provider for those tools. The example search extension previously pointed to in the main README depends on a Google API that is closed to new customers. A current provider still needs to be selected and connected to the interactive-subagents extension. Until that is done, the agent must disclose that it cannot conduct live web research and must not invent citations.
