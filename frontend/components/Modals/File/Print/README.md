# Print to PDF Modal

This document provides a technical overview of the **Print to PDF** modal feature, adhering to the standard architecture for modal components.

## 1. Feature Overview

This feature enables users to export their work—data, variable definitions, and analysis results—into a single PDF document. Its core functionalities include:

-   **Content Selection**: Users can choose which sections to include in the PDF: the Data View, the Variable View, and the Output Viewer (containing analysis results).
-   **Output Configuration**: Users can specify a custom file name for the PDF and select the paper size (A4, A3, Letter, Legal).
-   **Client-Side Generation**: The entire PDF generation process occurs on the client-side within the browser's main thread, utilizing the `jsPDF` and `jspdf-autotable` libraries. There is no server-side interaction.
-   **Interactive Tour**: A built-in, step-by-step product tour is available to guide new users through the feature's options.

## 2. Directory Structure

The feature is organized according to the project's *feature-sliced design* principles:

-   **`/` (Root)**
    -   `index.tsx`: **Orchestrator**. Assembles the `PrintOptions` UI component and connects it to the `usePrintLogic` hook, managing the overall state and flow.
    -   `README.md`: This technical documentation.
    -   `types.ts`: Contains all TypeScript type and interface definitions specific to this feature (e.g., `PaperSize`, `SelectedOptions`, component props).
-   **`components/`**
    -   `PrintOptions.tsx`: **UI Component**. A "dumb" component responsible for rendering all configuration options (file name, content checkboxes, paper size dropdown) and action buttons. It also encapsulates the logic for the interactive product tour.
-   **`hooks/`**
    -   `usePrintLogic.ts`: **Primary Logic Hook**. Manages all feature state, including the file name, selected content options, paper size, and the `isGenerating` status. It is responsible for fetching the required data from Zustand stores and triggering the PDF generation process.
-   **`services/`**
    -   `pdfPrintService.ts`: **PDF Service**. Contains the core logic for constructing the PDF document using `jsPDF`. It exports dedicated functions (`addDataGridView`, `addVariableView`, `addResultsView`) for rendering each distinct section of the document.
-   **`utils/`**
    -   `print.utils.ts`: **Utilities**. Provides pure helper functions. Its main export, `generateAutoTableDataFromString`, transforms complex JSON output from statistical analyses into a structured format that `jspdf-autotable` can render into tables.
-   **`__tests__/`**
    -   Contains Jest tests for the hook (`usePrintLogic.test.ts`), the PDF service (`pdfPrintService.test.ts`), and the utilities (`print.utils.test.ts`).

## 3. Architecture and Data Flow

The "Print to PDF" feature operates entirely on the client-side, orchestrating UI components, state management hooks, and data stores to generate a file.

```mermaid
graph TD
    subgraph "UI Layer"
        A[PrintOptions.tsx]
    end

    subgraph "Logic & State"
        B[hooks/usePrintLogic.ts]
    end

    subgraph "Services & Utilities"
        C[services/pdfPrintService.ts]
        D[print.utils.ts]
    end

    subgraph "External Dependencies"
        E[Zustand Stores <br/>(useDataStore, useVariableStore, useResultStore)]
        F[jsPDF & jspdf-autotable]
    end

    A -- "User actions (e.g., onPrint, onOptionChange)" --> B
    B -- "Passes props (fileName, isGenerating)" --> A
    B -- "1. Fetches latest data" --> E
    B -- "2. Invokes PDF generation" --> C
    C -- "Renders tables from analysis JSON" --> D
    C -- "Constructs PDF document" --> F
```

**Workflow:**

1.  The user opens the "Print" modal.
2.  `PrintModal` (`index.tsx`) renders, which in turn initializes the `usePrintLogic` hook to manage state and event handlers.
3.  The `PrintOptions` UI is displayed, receiving all necessary state and callback functions from `usePrintLogic` as props.
4.  The user interacts with the UI, and any changes (e.g., updating the file name, toggling a checkbox) call a handler that updates the state within `usePrintLogic`.
5.  The user clicks the "Print" button.
6.  The `handlePrint` function in `usePrintLogic` is executed. It sets `isGenerating` to `true` to disable the UI.
7.  The hook fetches the most current data directly from the `useDataStore`, `useVariableStore`, and `useResultStore`.
8.  It then calls the appropriate functions from `pdfPrintService` in sequence (`addDataGridView`, `addVariableView`, etc.) based on the user's selections.
9.  The `pdfPrintService` uses `print.utils.ts` to parse and format complex statistical tables from JSON strings.
10. Once the `jsPDF` instance is fully populated, the `doc.save()` method is called, triggering a browser download.
11. The `isGenerating` state is reset to `false`, and the modal is closed.

## 4. Testing Strategy

The feature's logic is validated through a combination of hook, service, and utility unit tests.

-   `usePrintLogic.test.ts`:
    -   **Focus**: State management and orchestration.
    -   **Method**: Mocks Zustand stores and the `pdfPrintService`.
    -   **Coverage**: Verifies correct initial state, state updates through setters, the `resetOptions` functionality, and the primary `handlePrint` flow. It ensures that `pdfPrintService` functions are called conditionally based on `selectedOptions` and that PDF saving is triggered with the correct filename. It also tests for graceful error handling.

-   `pdfPrintService.test.ts`:
    -   **Focus**: Correct PDF section generation.
    -   **Method**: Mocks `jsPDF` and `jspdf-autotable` to inspect how they are called.
    -   **Coverage**: Tests that each `add...View` function renders its section with the correct title and data. It confirms that tables are constructed with the expected headers and body content. It also validates that page breaks are added when content exceeds vertical thresholds.
    -   **Note**: The test for `addVariableView` appears outdated, checking for columns (`No`, `Width`, `Column Index`) that are no longer in the implementation. The current implementation correctly renders `Name`, `Type`, `Label`, and `Measure`.

-   `print.utils.test.ts`:
    -   **Focus**: Data transformation for `jspdf-autotable`.
    -   **Method**: Provides mock JSON data representing various analysis outputs.
    -   **Coverage**: Tests the `generateAutoTableDataFromString` function. It validates the correct parsing of simple tables, complex tables with nested row headers, handling of invalid JSON, and behavior with empty or multiple tables in a single input string.
