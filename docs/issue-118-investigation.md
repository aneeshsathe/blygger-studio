# Issue #118: hopper picker and Mentions pagination

Investigated on 2026-11-04 from `upstream/main` at `8ee7092`, in branch
`codex/investigate-issue-118`.

## Hopper picker: confirmed UI race, fixed here

The failed mobile trace from [Check run 41911077002, attempt 1](https://github.com/blygger/blygger-studio/actions/runs/41911077002/attempts/1)
contains the newly created hopper in the editor's response:

| Trace time (ms) | Event |
| ---: | --- |
| 479160 | `POST /api/hoppers` creates `Own picks mobile` |
| 479334 | Editor reads change state with hopper revision 22 |
| 479403 | `GET /api/hoppers?limit=100` starts; its response includes the new hopper |
| 479472 | Test starts selecting “add to hopper…” from the actions menu |
| 479728 | Test waits for the hopper button, but the picker only offers “new hopper…” |

The response also contains all four older hoppers. The picker is empty, rather
than showing an older server list. This trace does not support stale change-state
or read-batch results as the cause. Hopper lists are not batched by this transport.

`Editor` used a live-query result for `buckets`, initially an empty array.
`more()` passes callbacks to the imperative `menu()` store, which retains them
after the editor renders again. Its `addToHopper` callback can therefore retain
the empty array even after the list arrives. The nested picker copies that array
into its own static menu rows. Neither a later response nor polling updates the
open picker.

The fix awaits `preloadView(listViews.hoppers)` inside `addToHopper`, then reads
`listViews.hoppers.toArray` before building the picker. The editor no longer
needs a hopper subscription solely to capture rows for a later action.

The regression test holds hopper responses until after the actions menu opens
and its hopper action is selected. It fails against the original editor and
passes with the fix. The existing test now uses a unique hopper name and an
exact locator, so retries and repeated runs do not fail on leftover names.

## Mentions: reproduced; related upstream recovery work remains open

The same CI evidence shows a failed continuation at cursor `11`, followed by
successful requests at cursors `11`, `22`, `33`, `44`, `55`, `66`, and `77`.
In the desktop first attempt, this recovery starts while Playwright is trying
to click “retry reads”; the button then detaches. In the desktop retry, the
click succeeds but the test detects reads beyond the requested window.

Temporary instrumentation of the collection query function recorded a new
`['mention-groups', 'rows']` read with no bounded subset after the failure.
`readCursorWindow` passes that unbounded demand to `createCursorPager`, which
walks the remaining backend pages. Slowing Chromium to six times its normal
CPU cost while logging demands reproduced six failures in twelve runs: five
pagination-bound failures and one retry-click timeout. Normal-speed focused
runs passed, so they do not establish that this flake is fixed.

[TanStack DB #2165](https://github.com/TanStack/db/issues/2165)
tracks replacing full-source recovery after failed ordered requests with bounded
repair. Its [receiving-test comment](https://github.com/TanStack/db/issues/2165#issuecomment-6642533950)
confirms that direct retry can exhaust the dataset, even when the failed page
wrote no rows. This matches the unbounded demand observed here.

The comment also reports that **awaited reload followed by expansion stays
bounded** in its fixture and explicitly does not establish the cause of the
app's timing-sensitive failure. Studio's retry uses reload. The exact transition
that starts Studio's unbounded read before the retry click remains unisolated;
do not treat the upstream measurement alone as proof of that transition.

No Mentions implementation or test assertions are changed here. A follow-up
should preserve the browser reproduction while testing the upstream recovery
change, including both the read bound and the retry button's lifetime. For a
local timing probe, add this before `page.clock.install()` in the existing
continuation-failure test, then run that test on desktop and mobile:

```ts
await (await page.context().newCDPSession(page)).send(
  'Emulation.setCPUThrottlingRate', { rate: 6 },
);
```

This changes scheduling and can also expose the test's frozen-clock polling
timeout. It is a diagnostic probe, not a deterministic regression test.

## Validation

- Delayed hopper regression: failed before the fix; passed after it.
- Existing hopper flow, delayed hopper regression, and existing Mentions retry:
  five repeats on each browser project, **30 passed**.
- Both affected browser spec files in full: **14 passed**.
- Focused authoring, read-health, and source-collection UI suites: **58 passed**.
- Full UI suite: **194 passed**. An initial concurrent run overlapped the browser
  build replacing the SDK output and failed module resolution; rerunning after
  the build passed.
- `npm run typecheck`: passed.
- CPU-throttled diagnostic run: **6 failed, 6 passed**, as described above.

These results validate the hopper fix. The Mentions failure remains open.
