# Notes agent

The notes specialist turns a completed lesson into a concise, reusable Markdown note in the matching module's `Revision/` folder. Lurn passes it the verified lesson material, source paths, and exact destination. It does not teach or update the live Canvas; temporary working content stays in `Lurn/Current Session.canvas` and is cleared when the lesson ends.

See `ROLE.md` for its writing rules. `run-lurn.sh` defaults `LURN_OBSIDIAN_VAULT` to `~/Documents/Obsidian Vault`; the notes agent writes to the exact module `Revision/` destination Lurn supplies.
