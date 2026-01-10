# VariableTable Component

Configurable interface for dataset variable metadata in the Statify Dashboard. Allows editing variable properties (name, type, width, decimals, label, values, missing, column mapping, alignment, measure, role) with inline validation and dialog-driven inputs.

---

## Table of Contents

1. [Overview](#overview)
2. [Features & Algorithms](#features--algorithms)
3. [File Structure](#file-structure)
4. [Detailed Descriptions](#detailed-descriptions)
   - [Constants](#constants)
   - [Table Config](#table-config)
   - [Hooks](#hooks)
   - [Dialogs](#dialogs)
   - [Utilities](#utilities)
5. [Getting Started](#getting-started)
6. [Contribution](#contribution)

---

## Overview

The VariableTable component renders a Handsontable grid for editing variable metadata. It integrates with global stores and uses dialogs for complex fields, triggers validation, and maintains minimum row counts.

---

## Features & Algorithms

### 1. Default Row Count
- **Algorithm**: Ensures at least `DEFAULT_MIN_ROWS` (default 50) are displayed plus one spare row for additions.

### 2. Column Definitions
- Defined in `tableConfig.ts`:
  - `colHeaders`: list of header labels.
  - `columns`: Handsontable settings per column (type, width, dropdown sources).

### 3. Inline Validation & Updates
- **Hooks**: `useVariableTableEvents` listens to `beforeChange`/`afterChange` events:
  - Validates and handles cell changes.
  - Maps column index to a variable property via `COLUMN_INDEX_TO_FIELD_MAP`.
  - Persists changes directly to `useVariableStore`.

### 4. Dialog-Driven Editing
- **Triggers**: Editing `type`, `values`, or `missing` columns opens custom dialogs.
- **Hooks**: 
  - `useVariableTableEvents` detects clicks on dialog-trigger columns.
  - `useVariableTableDialogs` manages the state (open/close) and submission logic for each dialog.

### 5. Event Handling & Logic
- **Component**: The main `VariableTable` (`index.tsx`) component integrates all hooks.
  - It fetches data from the store and orchestrates the hooks for events (`useVariableTableEvents`) and dialogs (`useVariableTableDialogs`).
- **Event Hook**: `useVariableTableEvents` provides cell context menu, keyboard shortcuts, and all cell-related event handling.

### 6. Performance
- Memoized calculations (`useMemo`, `useCallback`) to minimize re-renders.
- Selective store subscriptions to avoid full-grid updates.

---

## File Structure

```
variableTable/
├── index.tsx                Main component (renders HotTable, orchestrates hooks)
├── VariableTable.css        Styles for grid container
├── constants.ts             (Deprecated, to be removed)
├── tableConfig.ts           Column headers and Handsontable settings
├── services/                (optional service functions)
├── hooks/                   Custom React hooks
│   ├── useVariableTableEvents.ts  (Handles cell events, context menu, updates)
│   └── useVariableTableDialogs.ts (Manages all dialog states and logic)
├── utils/                   Helper functions
│   └── index.ts             (Exports utility functions)
└── README.md                This documentation
```

---

## Detailed Descriptions

### Constants

- `DEFAULT_MIN_ROWS` (50): Minimum number of rows displayed.
- `DEFAULT_VARIABLE_TYPE`, `DEFAULT_VARIABLE_WIDTH`, `DEFAULT_VARIABLE_DECIMALS`: Fallback values.
- `COLUMN_INDEX`: Maps field names to column indices.
- `COLUMN_INDEX_TO_FIELD_MAP`: Maps indices to variable property names.
- `DIALOG_TRIGGER_COLUMNS`: Columns that open dialogs.

### Table Config

- `colHeaders`: `['Name','Type','Width','Decimals','Label','Values','Missing','Columns','Align','Measure','Role']`
- `columns`: Settings per column (data index, type, dropdown sources, numeric format).

### Hooks

#### useVariableTableEvents
- Handles all grid interactions: context menu, keyboard shortcuts, cell focus, and edits.
- Validates and commits cell edits to `useVariableStore`.
- Triggers the appropriate dialog to open via `useVariableTableDialogs`.

#### useVariableTableDialogs
- Manages the open/close state for all dialogs (`type`, `values`, `missing`).
- Contains the callback logic for when a dialog saves data (`handleTypeChange`, etc.).

### Dialogs

Located in `dialog/`:
- Custom React components for selecting variable types, editing value lists, and specifying missing codes.

### Utilities

- `validators.ts`: Ensures numeric and dropdown fields are valid.
- `formatters.ts`: Formats display values (e.g., decimals).

---

## Getting Started

1. Ensure global CSS includes Handsontable styles:
   ```css
   @import 'handsontable/dist/handsontable.full.min.css';
   ```
2. Import and render:
   ```tsx
   import VariableTable from '@/app/dashboard/variable/components/variableTable';
   <VariableTable />
   ```
3. Customize `tableConfig.ts` or extend hooks as needed.

---

## Contribution

Contributions welcome! Please open issues or PRs following repository guidelines.
