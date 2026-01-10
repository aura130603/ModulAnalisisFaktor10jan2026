# Export to CSV Feature

This document provides a comprehensive technical overview of the "Export to CSV" feature for developers, detailing its implementation, architecture, and workflow.

## 1. Overview

The Export to CSV feature allows users to export the current dataset to a CSV (Comma-Separated Values) file with customizable formatting options. The implementation follows a feature-sliced design pattern, separating concerns into distinct components, hooks, and utilities.

## 2. Key Features

- **Customizable Export Options**:
  - File name configuration
  - Multiple delimiter choices (comma, semicolon, pipe, tab)
  - Option to include variable names as headers
  - Option to include detailed variable properties as comments
  - String quoting options
  - Character encoding selection (UTF-8, UTF-16 LE, Windows-1252)

- **Interactive Tour Guide**:
  - Step-by-step walkthrough of the export options
  - Contextual help for each configuration element

- **Robust Error Handling**:
  - Data validation before export
  - User-friendly error messages via toast notifications
  - Graceful handling of edge cases

## 3. Architecture and Implementation

### 3.1. Core Components

#### `ExportCsv` (`index.tsx`)
- **Role**: UI orchestrator component
- **Responsibilities**:
  - Renders all UI elements (form fields, buttons, labels)
  - Manages UI state (loading, disabled states)
  - Initializes and consumes `useExportCsv` and `useTourGuide` hooks
  - Handles user interactions and event propagation
- **Key Implementation Details**:
  - Uses React functional components with TypeScript
  - Implements accessibility features (ARIA labels, proper semantic HTML)
  - Integrates with UI component library (`@/components/ui/*`)
  - Uses `framer-motion` for tour popup animations
  - Implements element highlighting for tour steps

#### `hooks/useExportCsv.ts`
- **Role**: Business logic core
- **Responsibilities**:
  - Manages export configuration state
  - Handles export process execution
  - Validates user input
  - Interacts with Zustand stores
  - Generates and triggers file download
- **Key Implementation Details**:
  - Uses React hooks (`useState`, `useTransition`)
  - Integrates with Zustand stores (`useDataStore`, `useVariableStore`)
  - Implements filename sanitization to prevent invalid characters
  - Uses `useToast` for user feedback
  - Handles asynchronous operations with proper error boundaries
  - Uses `useModal` for modal management

#### `hooks/useTourGuide.ts`
- **Role**: Interactive tour management
- **Responsibilities**:
  - Manages tour state (active, current step)
  - Handles tour navigation (next, previous, end)
  - Provides tour step definitions
  - Manages element highlighting

#### `utils/exportCsvUtils.ts`
- **Role**: Data processing utilities
- **Responsibilities**:
  - Converts data and variables to CSV format
  - Handles CSV escaping and formatting
  - Generates variable properties section
- **Key Functions**:
  - `generateCsvContent`: Main function that creates the CSV string
  - `escapeCsvCell`: Handles proper escaping of CSV cell values
  - `formatMissingSpecToString`: Formats missing value specifications

### 3.2. Data Flow and Workflow

```mermaid

flowchart TD
%%{init: {"theme": "base"}}%%
    A[User opens Export Modal] --> B{Initialize State};
    B --> C[Render UI Components];
    
    C --> D[User Configures Options];
    D --> E{Update State via Handlers};
    E --> C;
    
    C --> F[User Clicks Export];
    F --> G{Validate Input};
    G -- Invalid --> H[Show Error Toast];
    G -- Valid --> I[Set Loading State];
    
    I --> J[Sync with Zustand Stores];
    J --> K{Fetch Fresh Data};
    K -- Success --> L[Call generateCsvContent];
    K -- Failure --> M[Show Error Toast];
    
    L --> N[Create CSV Blob];
    N --> O[Generate Download Link];
    O --> P[Trigger File Download];
    
    P --> Q[Show Success Toast];
    Q --> R[Close Modal];
    
    R --> S[Cleanup Resources];
    
    subgraph Legend
        direction LR
        subgraph Node Types
            direction LR
            ui[UI Component]:::legend
            hook[Hook]:::legend
            util[Utility]:::legend
            store[Zustand Store]:::legend
            browser[Browser API]:::legend
        end
    end
    
    classDef legend fill:#f9f9f9,stroke:#333,stroke-width:1px;
    classDef ui fill:#cde4ff,stroke:#5a96e6;
    classDef hook fill:#d5e8d4,stroke:#82b366;
    classDef util fill:#e1d5e7,stroke:#9673a6;
    classDef store fill:#fff2cc,stroke:#d6b656;
    classDef browser fill:#ffe6cc,stroke:#d79b00;
    
    class A,C,D,F,C,R ui;
    class B,E,G,I,J,K,L hook;
    class L,N,O,P util;
    class J,K store;
    class N,O,P browser;
```

### 3.3. Detailed Workflow Steps

1. **Initialization**:
   - User opens the export modal
   - `ExportCsv` component mounts
   - `useExportCsv` hook initializes with default or provided options
   - UI renders with initial state

2. **Configuration**:
   - User interacts with form elements (filename, delimiter, etc.)
   - Each interaction triggers appropriate handler functions (`handleChange`, `handleFilenameChange`)
   - State updates trigger re-renders of the UI
   - Filename sanitization removes invalid characters

3. **Export Execution**:
   - User clicks the "Export" button
   - `handleExport` function is called
   - Input validation checks (filename not empty, data exists)
   - If validation fails, error toast is shown
   - If validation passes:
     - Loading state is set
     - Zustand stores are synced to get fresh data
     - `generateCsvContent` is called with data, variables, and options
     - CSV string is generated
     - Blob is created with specified encoding
     - Download link is generated and triggered
     - Success toast is shown
     - Modal is closed
     - Resources are cleaned up (object URL revoked)

## 4. Component Properties (`ExportCsvProps`)

The `ExportCsv` component accepts the following props:

- `onClose: () => void`: **(Required)** Callback function to close the modal
- `containerType?: "dialog" | "sidebar" | "panel"`: **(Optional)** Rendering context for tour guide positioning
- All `UseExportCsvOptions` for initial configuration:
  - `initialFilename?: string`
  - `initialDelimiter?: string`
  - `initialIncludeHeaders?: boolean`
  - `initialIncludeVariableProperties?: boolean`
  - `initialQuoteStrings?: boolean`
  - `initialEncoding?: string`

## 5. Error Handling

The feature implements comprehensive error handling:

- **Input Validation**:
  - Checks for empty filenames
  - Ensures data exists before export
  - Validates data after syncing with stores

- **Error Feedback**:
  - Uses toast notifications for user feedback
  - Provides specific error messages for different failure scenarios
  - Logs errors to console for debugging

- **Graceful Degradation**:
  - Handles edge cases in data processing
  - Properly cleans up resources even on failure

## 6. Testing Strategy

### 6.1. Component Testing (`__test__/index.test.tsx`)
- **Focus**: UI rendering and user interactions
- **Approach**: Mock hooks to isolate component
- **Coverage**:
  - Form element rendering
  - Event handler calls
  - State-dependent UI changes
  - Loading and disabled states
  - Tour guide integration

### 6.2. Hook Testing (`__test__/useExportCsv.test.ts`)
- **Focus**: Business logic in `useExportCsv` hook
- **Approach**: Mock Zustand stores and utilities
- **Coverage**:
  - State initialization
  - Handler function behavior
  - Input validation
  - Export process flow
  - Error scenarios
  - Toast notifications

### 6.3. Utility Testing (`__test__/exportCsvUtils.test.ts`)
- **Focus**: Pure functions in `exportCsvUtils.ts`
- **Approach**: Test with various mock datasets
- **Coverage**:
  - CSV string generation
  - Proper escaping and formatting
  - Header inclusion/exclusion
  - Variable properties section
  - Different delimiter handling
  - Edge cases in data values

## 7. Performance Considerations

- Uses `useTransition` for non-blocking export process
- Efficient state management with Zustand
- Proper resource cleanup (object URL revocation)
- Memoization techniques where applicable
- Optimized rendering with proper React patterns

## 8. Accessibility

- Semantic HTML structure
- Proper ARIA attributes
- Keyboard navigation support
- Sufficient color contrast
- Focus management
- Screen reader compatibility