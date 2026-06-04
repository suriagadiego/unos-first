# Plan: Race-track progress bar for Uno's Fund page

## Pre-flight blockers (flag — do not implement until resolved)

### 1. `components/RaceProgress.vue` does not exist
The file is not present anywhere in the repo. The plan assumes it already exists.
**Do not proceed with any edits until this file is created.**

### 2. `public/images/uno-car.png` does not exist — asset is in the wrong place
The car image lives at `assets/images/uno-car.png`, not `public/images/uno-car.png`.
In Nuxt 3, `assets/` files are processed at build time and **cannot** be referenced
as plain string paths at runtime (i.e. `car-src="/images/uno-car.png"` will 404).
The correct fix is to copy/move the file to `public/images/uno-car.png` so it is
served as a static asset and the prop works as written.
**Flag: do you want me to copy the asset to `public/images/` as part of this task,
or will you place it there yourself?**

---

## Duplicate % readout (flag — needs your decision before finalizing)

`RaceProgress` renders its own "X% funded" label above the car.
The stat row already shows a `{{ displayPct }}%` / "FUNDED" cell.

Both would appear simultaneously on the same screen:

```
[stat row]  0  |  101  |  0%       ← displayPct, animates up
                                     CONTRIBUTORS / DAYS TO GO / FUNDED

[RaceProgress]  0% funded           ← component's own readout
 🏁━━━━━━🚗━━━━━━━━━━━━━━━━━━━━
```

**Do you want to:**
- A) Keep both (the stat row number is animated / counts up; the component's is real-time)
- B) Drop the "FUNDED" cell from the stat row (collapses to a 2-col grid: Contributors | Days to Go)
- C) Hide the component's internal readout via CSS (but you said not to restyle internals)

Option B is my recommendation — the track bar makes the percentage self-evident visually,
so the stat cell becomes redundant. But I'll wait for your call.

---

## What changes (one file only, pending the above)

### `components/sections/CollegeFund.vue`

**Data source** — no new fetch needed. `realPct` already computes what's needed:
```js
const realPct = computed(() => {
  if (!data.value?.goal) return 0
  return Math.min(Math.round((data.value.total / data.value.goal) * 100), 100)
})
```
This is what drives the existing "% FUNDED" stat and is what gets passed to `:percent`.

**Remove** (lines ~161–173, the old bar + START/GOAL labels):
```html
<!-- Progress bar -->
<div class="w-full max-w-[320px] md:max-w-sm">
  <div class="h-2 bg-race-gray/10 rounded-full overflow-hidden">
    <div
      class="h-full bg-race-blue rounded-full transition-all duration-1000"
      :style="{ width: `${realPct}%` }"
    />
  </div>
  <div class="flex justify-between mt-1.5">
    <span class="font-sans text-[9px] text-race-gray/35 uppercase tracking-widest">Start</span>
    <span class="font-sans text-[9px] text-race-gray/35 uppercase tracking-widest">Goal 🏁</span>
  </div>
</div>
```

**Replace with:**
```html
<RaceProgress :percent="realPct" car-src="/images/uno-car.png" />
```

No script changes needed — `realPct` already exists.

**If you choose option B** (drop the FUNDED stat cell), additionally change the stat grid
from `grid-cols-3` to `grid-cols-2` and remove the third `<div>` (the `{{ displayPct }}%` cell).
The `displayPct` ref and its `setInterval` in `onMounted` can also be deleted from the script.

---

## Summary of questions before I touch any files

1. Is `RaceProgress.vue` being created separately — or should I stub it here?
2. Should I copy `assets/images/uno-car.png` → `public/images/uno-car.png`?
3. Keep both % readouts (A), drop the stat cell (B), or something else (C)?
