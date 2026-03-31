# Phase 3: Coach Editing - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit and complete all coach editing capabilities. Main gap: add/remove entire meals from a client's meal plan. Secondary: verify exercise add/remove, cardio editing, and all editing operations save correctly and display on client dashboard. This is a gap-fill phase, not a full build.

</domain>

<decisions>
## Implementation Decisions

### Add/Remove Meals (EDIT-01) — Primary Gap
- Coach can add a new blank meal to any day of a client's meal plan
- Coach can delete an entire meal from any day
- "Add Meal" button per day in the meal plan section of the client detail page
- Delete button (trash icon) per meal, with confirmation
- Adding a meal opens the existing EditMealDialog pre-filled with empty values
- After add/delete, the full meal plan JSON is saved via the existing PUT `/api/admin/meal-plan` endpoint
- Day totals should recalculate when meals are added/removed

### Exercise Add/Remove (EDIT-02) — Verify Existing
- `edit-training-day-dialog.tsx` already has `addExercise()` and `removeExercise()` functions
- Verify these work end-to-end: add exercise in dialog → save → client dashboard shows new exercise
- Fix any bugs found during verification

### Cardio Editing (EDIT-03) — Verify Existing
- `edit-training-day-dialog.tsx` already has cardio toggle, type, and duration fields
- Verify cardio changes persist through save and display correctly on client training page
- Fix any bugs found during verification

### Full Editability Audit (EDIT-04)
- Verify ALL generated content is editable by coach:
  - Macros: macro-override-form.tsx (exists, verified)
  - Meals: edit-meal-dialog.tsx (exists, extend with add/remove)
  - Training: edit-training-day-dialog.tsx (exists, verify)
  - Supplements: coach-supplements.tsx (exists, verified)
- Verify all edits reflect on client dashboard pages
- Fix any display or save bugs found

### Claude's Discretion
- Exact placement of "Add Meal" and "Delete Meal" buttons in the UI
- Whether day totals auto-recalculate or require manual update
- Error handling for edge cases (deleting the last meal, etc.)
- Any UI polish needed for the editing experience

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/coach/edit-meal-dialog.tsx`: Full meal editor (recipe, ingredients, instructions, macros) — reuse for "add meal" with empty initial values
- `src/components/coach/edit-training-day-dialog.tsx`: Full training day editor with exercise add/remove AND cardio editing already built
- `src/components/coach/macro-override-form.tsx`: Macro overrides — already works
- `src/components/coach/coach-supplements.tsx`: Supplement CRUD — already works
- `src/app/api/admin/meal-plan/route.ts`: PUT endpoint for saving meal plan JSON
- `src/app/api/admin/training-plan/route.ts`: PUT endpoint for saving training plan JSON

### Established Patterns
- Coach edits are done inline on the client detail page (`src/app/coach/clients/[id]/page.tsx`)
- Meal plans stored as JSON in `planData` field — entire plan saved on each edit
- Training plans stored as JSON in `planData` field — same pattern
- Edit dialogs receive data via props, return updated data via `onSave` callback
- Plus/Trash2 icons from lucide-react used throughout for add/remove actions

### Integration Points
- `src/app/coach/clients/[id]/page.tsx`: Main client detail page — add "Add Meal" and "Delete Meal" buttons here
- `src/app/dashboard/meals/page.tsx`: Client meal plan view — verify edits display correctly
- `src/app/dashboard/training/page.tsx`: Client training view — verify edits display correctly

</code_context>

<specifics>
## Specific Ideas

- Keep it simple — this phase is about closing gaps, not redesigning the editing experience
- The existing EditMealDialog pattern (dialog opens, edit, save) should be reused for adding new meals
- Delete should have a simple confirmation (not a modal — just a "Are you sure?" inline)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-coach-editing*
*Context gathered: 2026-03-31*
