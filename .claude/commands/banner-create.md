---
description: Generate side banner (310×600) + header (1366×200) for a new EzGo Hospitality venue. Usage — /banner-create [business_name] [url]
argument-hint: [business_name] [url]
allowed-tools: Task, Bash, Read, Write
---

Start a new EzGo banner generation session for the venue.

**Inputs:**
- `business_name`: $1
- `url`: $2 (optional — pass empty string if missing)

**Action:** Invoke the `banner-orchestrator` subagent via the Task tool with this exact payload:

```
INPUT: {"business_name":"$1","url":"$2"}
```

Set `subagent_type` to `banner-orchestrator`. The orchestrator owns the full workflow — initialization, brand research, logo resolution, copywriting, Canva design, and final export — including all approval gates.

**After the subagent completes**, print the final summary to the user in Hebrew with:
- Path to `final/banner_310x600.png`
- Path to `final/header_1366x200.png`
- Canva edit URLs for both designs
- Brief instruction: "להורדה ועריכות נוספות — פתחי את הקישור בקאנבה."

**On abort or failure:** the orchestrator will return its own status; relay it verbatim to the user.

Do not attempt to run the workflow yourself — your only job is to dispatch to `banner-orchestrator`.
