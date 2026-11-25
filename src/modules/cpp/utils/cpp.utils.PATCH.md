# cpp.utils.ts — two small additions (patch, not a full file)

My project copy of `cpp.utils.ts` is older than yours (it has no `CPP_CHECKLIST` /
`CPP_SUPPORTING_DOCS`), so here are only the two changes:

In `getDefaultValues()`:

```ts
	approvalValues: {
		partValue: "",
		variationPct: "",
		amount: "",
		partValuePart: "",   // new: summary-sheet part the value was picked from
		amountPart: "",      // new
	},
	summaryParts: [],      // new: rows the server read from the summary sheet
```

Nothing else in `cpp.utils.ts` changes. `cpp.steps.ts` and `cpp.schema.ts`
import `CPP_CHECKLIST` (and `cpp.steps.ts` also `CPP_SUPPORTING_DOCS`) from it,
as `AttachmentsTab` already does.
