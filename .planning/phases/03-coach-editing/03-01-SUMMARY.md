---
phase: 03-coach-editing
plan: "01"
subsystem: ui
tags: [react, meal-plan, coach, editing]

# Dependency graph
requires:
  - phase: 02-client-vetting
    provides: coach client detail page with existing meal edit (Pencil) functionality
provides:
  - Add Meal button per day in meal plan section
  - Delete Meal button (Trash2) per meal in meal plan section
  - recalculateDayTotals helper for accurate day totals after changes
  - PUT /api/admin/meal-plan called on add and delete
affects:
  - 03-coach-editing

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "recalculateDayTotals: pure helper summing macro_totals across meals array, used in save/add/delete"
    - "mealIndex >= meals.length check to distinguish add-new vs update-existing in handleSaveMealEdit"

key-files:
  created: []
  modified:
    - src/app/coach/clients/[id]/page.tsx

key-decisions:
  - "window.confirm used for delete confirmation (simple, no modal) per prior project decision"
  - "Deleting last meal in a day is allowed — day remains with empty meals and zeroed day_totals"
  - "savingMealEdit flag reused for delete operation to prevent concurrent edits"

patterns-established:
  - "recalculateDayTotals called after every mutation (add/edit/delete) to keep day_totals accurate"

requirements-completed:
  - EDIT-01

# Metrics
duration: 8min
completed: 2026-03-31
---

# Phase 3 Plan 01: Add/Delete Meal Functionality Summary

**Add Meal button per day and Delete Meal (Trash2) button per meal with day-total recalculation, persisted via PUT /api/admin/meal-plan**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-31T23:32:00Z
- **Completed:** 2026-03-31T23:40:17Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `handleAddMeal(dayIndex)` that opens EditMealDialog with a blank Meal at end of each day
- Added `handleDeleteMeal(dayIndex, mealIndex)` with window.confirm, splice, and PUT to persist
- Added `recalculateDayTotals(meals)` helper used in save, add, and delete paths
- Updated `handleSaveMealEdit` to push new meals (when mealIndex >= length) and recalculate day totals
- Added Trash2 delete button next to each meal's Pencil edit button
- Added Add Meal button at bottom of each day's meals list

## Task Commits

Each task was committed atomically:

1. **Task 1: Add "Add Meal" and "Delete Meal" functionality to client detail page** - `f907453` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `src/app/coach/clients/[id]/page.tsx` - Added recalculateDayTotals, handleAddMeal, handleDeleteMeal, updated handleSaveMealEdit, added Plus/Trash2 UI buttons

## Decisions Made
- `window.confirm` used for delete confirmation — simple browser native dialog, no modal component needed
- Deleting the last meal in a day is allowed — day stays with empty meals array and zeroed totals
- `savingMealEdit` flag reused for delete operations to prevent concurrent mutations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Add/Delete meal functionality complete; coaches can now fully manage meal plan content
- Ready for next plan in phase 03-coach-editing

---
*Phase: 03-coach-editing*
*Completed: 2026-03-31*
