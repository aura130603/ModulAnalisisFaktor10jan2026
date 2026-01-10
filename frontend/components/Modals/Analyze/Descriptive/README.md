# Descriptive Analysis Modals – Test Suite Index

This README acts as a single gateway to every Jest & React-Testing-Library test that lives inside `components/Modals/Analyze/Descriptive/*`.  If you are looking for details on how a particular modal is validated or where to add new coverage, start here.

---

## 🗂️ Directory Map

```
components/Modals/Analyze/Descriptive/
├─ Crosstabs/
│  └─ __tests__/
├─ Descriptive/   (univariate statistics)
│  └─ __tests__/
├─ Explore/
│  └─ __tests__/
└─ Frequencies/
   └─ __tests__/
```

Each `__tests__` folder follows the same convention: **UI tests** target the main modal component, **hook tests** isolate business logic, and **utility tests** verify pure helpers.

---

## 📊 Crosstabs
Location: `Crosstabs/__tests__/`

| File | Focus |
|------|-------|
| `Crosstabs.test.tsx` | Renders the dialog, tab switching, variable interactions, OK/Cancel/Reset logic, help-tour trigger. |
| `useCrosstabsAnalysis.test.ts` | Worker communication, result aggregation, error handling for the `useCrosstabsAnalysis` hook. |
| `useTourGuide.test.ts` | End-to-end tour lifecycle & automatic tab switching. |
| `formatters.test.ts` | Unit tests for `formatCaseProcessingSummary` & `formatCrosstabulationTable`. |
| `CellsTab.test.tsx` | Unit tests for the Cells tab component (UI rendering, option toggles, noninteger weight visibility). |

---

## 📈 Descriptive (Univariate)
Location: `Descriptive/__tests__/`

| File | Focus |
|------|-------|
| `Descriptive.test.tsx` | UI & user-flow of the Descriptive modal (variables/statistics tabs, buttons, help tour). |
| `useDescriptivesAnalysis.test.ts` | Worker exchange, Z-score creation, store integration. |

---

## 🔍 Explore
Location: `Explore/__tests__/`

| File | Focus |
|------|-------|
| `Explore.test.tsx` | Main modal rendering, tab navigation (Variables/Statistics/Plots), validation, buttons, help tour. |
| `useExploreAnalysis.test.ts` | Grouping by factor variables, multiple worker jobs, result formatting. |
| `PlotsTab.test.tsx` | Interaction tests for plots-specific controls (boxplot type, histogram, normality options). |
| `usePlotsSettings.test.ts` | Hook managing plot settings (boxplots, histograms, normality). |

_Note_: At the time of writing there is no dedicated README inside `Explore/__tests__`; the table above summarises current coverage.

---

## 📑 Frequencies
Location: `Frequencies/__tests__/`

| File | Focus |
|------|-------|
| `Frequencies.test.tsx` | UI rendering, tab switching (Variables/Statistics/Charts), OK/Cancel/Reset flows, help tour. |
| `useFrequenciesAnalysis.test.ts` | Worker payloads, result parsing, error states. |
| `useTourGuide.test.ts` | Tour lifecycle & tab enforcement. |
| `formatters.test.ts` | Formatting helpers for statistics and frequency tables. |

---

### Adding New Tests
1. Place the file under the appropriate modal's `__tests__` directory.
2. Update the modal-specific README **and** this central index so future contributors can find it quickly.

---

_Last updated: <!-- KEEP THIS COMMENT: the CI tool replaces it with commit SHA & date -->_ 