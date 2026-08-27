# Requirements — Improve Tasks

## Overview

Enhance the Tasks section of the Productivity Dashboard with priority levels, due dates,
category/tag filtering, and drag-to-reorder. All improvements must stay within the
existing single-file architecture (index.html / style.css / app.js) and remain fully
persistent via localStorage.

---

## Requirements

### 1 — Priority Levels

**1.1** Each task must have a priority: **High**, **Medium** (default), or **Low**.

**1.2** When adding a task, the user can select the priority from a dropdown next to the
input field before pressing Add.

**1.3** Priority is visually indicated on each task item with a colored left-border accent:
- High → red (`--color-danger`)
- Medium → brand purple (`--color-brand`)
- Low → muted gray (`--color-text-faint`)

**1.4** Priority is persisted in localStorage alongside the task text and done state.

---

### 2 — Due Dates

**2.1** Each task may optionally have a due date (date only, no time).

**2.2** When adding a task, the user can pick a due date via a `<input type="date">` field.
Leaving it blank means no due date.

**2.3** Due date is displayed on the task item in a compact format (e.g. `Aug 30`).

**2.4** Tasks that are overdue (due date < today, not yet done) show the date in red.

**2.5** Tasks due today show the date in orange/amber.

**2.6** Due date is persisted in localStorage.

---

### 3 — Categories / Tags

**3.1** Each task may have one category tag chosen from a fixed list: **Work**, **Personal**,
**Study**, **Other** (default: none / no tag).

**3.2** The tag is shown as a small pill badge on the task item.

**3.3** A filter bar above the task list lets the user show: All | Work | Personal | Study | Other.
The active filter is highlighted.

**3.4** The selected filter is not persisted (resets to "All" on page reload).

**3.5** Tag is persisted in localStorage.

---

### 4 — Drag-to-Reorder

**4.1** Task items must be draggable using the HTML5 Drag and Drop API (no external library).

**4.2** A drag handle icon (⠿) is shown at the left edge of each task item.

**4.3** While dragging, the dragged item is visually dimmed (opacity 0.4).

**4.4** A drop indicator line shows between items where the task will be dropped.

**4.5** On drop, the tasks array is reordered and persisted immediately.

**4.6** Drag-and-drop only reorders within the currently visible (filtered) set; the
underlying array order respects only drops made when the "All" filter is active, or
reorders within the filtered subset's positions in the full array.

---

### 5 — Sorting

**5.1** A sort control (dropdown) above the task list lets the user sort by:
- **Manual** (default — respects drag order)
- **Priority** (High → Medium → Low)
- **Due Date** (earliest first; tasks without dates go last)

**5.2** Sort preference is not persisted (resets to Manual on reload).

---

### 6 — General / UX

**6.1** The task input row must accommodate the new priority dropdown and date picker without
breaking the existing layout on screens ≥ 560 px. Below 560 px the inputs stack vertically.

**6.2** Completed tasks continue to render with strikethrough style. Their due-date color
overrides (red/orange) are suppressed when the task is marked done.

**6.3** Empty-state messaging is updated to reflect filtering ("No tasks match this filter."
when a filter is active with no results, vs. "No tasks yet. Add one above." when the list
is truly empty).

**6.4** All existing keyboard interactions (Enter to add, focus return after add/delete) are
preserved.

**6.5** All new interactive elements (priority dropdown, date input, filter buttons, sort
dropdown, drag handle) must be accessible: proper `aria-label` or `<label>` associations,
keyboard operable, and visible focus indicators.
