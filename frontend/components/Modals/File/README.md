# File Modal Components Documentation

## Overview

This directory contains all file-related modal components for handling data import/export operations. Each component follows a consistent architecture pattern with separated concerns for UI, business logic, and utilities.

## Component Architecture

### Core Design Pattern
All file modal components follow a standardized structure:
- **Hooks**: Business logic and state management
- **Services**: API interactions and external service calls
- **Utils**: Pure functions for data processing and transformations
- **Types**: TypeScript interfaces and type definitions
- **Tests**: Unit tests for each component layer

### Shared Dependencies
- **State Management**: Zustand stores for data, variables, and metadata
- **UI Framework**: React with TypeScript
- **Styling**: Tailwind CSS with consistent design tokens
- **Testing**: Jest and React Testing Library

## Component Details

### 1. ExampleDataset
**Purpose**: Provides pre-loaded example datasets for user testing and exploration.

**Algorithm**:
1. **Data Loading**: Fetches `.sav` files from `/exampleData/` directory
2. **File Processing**: Uses existing SPSS file processing pipeline
3. **State Integration**: Updates Zustand stores with new data
4. **Metadata**: Sets project metadata including filename and creation date

**Key Files**:
- `example-datasets.ts`: Dataset definitions and metadata
- `services/services.ts`: File fetching and processing logic
- `hooks/useExampleDatasetLogic.ts`: State management and user interactions

### 2. ExportCsv
**Purpose**: Exports current dataset to CSV format with configurable options.

**Algorithm**:
1. **Data Validation**: Checks for valid data availability
2. **Option Processing**: Handles delimiter, headers, and formatting preferences
3. **File Generation**: Creates CSV content using utility functions
4. **Download Trigger**: Initiates browser download with proper MIME type

**Key Options**:
- Delimiter selection (comma, tab, semicolon)
- Header inclusion toggle
- Variable properties inclusion
- String quoting preferences
- Encoding selection (UTF-8, etc.)

**Key Files**:
- `hooks/useExportCsv.ts`: Main export logic and state management
- `utils/exportCsvUtils.ts`: CSV content generation algorithms
- `types.ts`: Type definitions for export options

### 3. ExportExcel
**Purpose**: Exports current dataset to Excel format with advanced formatting options.

**Algorithm**:
1. **Data Synchronization**: Fetches latest data from stores
2. **Workbook Creation**: Uses SheetJS (XLSX) library for Excel generation
3. **Multi-sheet Support**: Creates separate sheets for data, variables, and metadata
4. **Styling Application**: Applies formatting based on user preferences

**Key Features**:
- Multiple worksheet generation
- Variable properties sheet
- Metadata inclusion
- Header styling options
- Data label formatting

**Key Files**:
- `hooks/useExportExcelLogic.ts`: Export orchestration logic
- `utils/excelExporter.ts`: Excel workbook generation utilities
- `utils/constants.ts`: Default values and configuration

### 4. ImportClipboard
**Purpose**: Imports data directly from system clipboard with parsing capabilities.

**Algorithm**:
1. **Text Parsing**: Analyzes clipboard content structure
2. **Delimiter Detection**: Automatically detects common delimiters
3. **Data Validation**: Validates parsed data structure
4. **Configuration**: Allows user to adjust parsing parameters

**Parsing Strategy**:
- Tab-delimited detection
- CSV format recognition
- Fixed-width data handling
- Error handling for malformed data

**Key Files**:
- `hooks/useImportClipboardLogic.ts`: Clipboard handling and parsing logic
- `services/clipboardParser.ts`: Text parsing algorithms
- `types.ts`: Stage management and data structures

### 5. ImportCsv
**Purpose**: Imports CSV files with comprehensive parsing and configuration options.

**Algorithm**:
1. **File Reading**: Uses FileReader API for text file processing
2. **Content Validation**: Validates file content and structure
3. **Parsing Configuration**: Allows delimiter and encoding selection
4. **Data Integration**: Updates application state with imported data

**Processing Pipeline**:
- File type validation
- Content reading with encoding detection
- Delimiter configuration
- Data matrix generation

**Key Files**:
- `hooks/useImportCsvFileReader.ts`: File reading and validation
- `hooks/useImportCsvProcessor.ts`: Data processing pipeline
- `utils/importCsvUtils.ts`: CSV parsing algorithms

### 6. ImportExcel
**Purpose**: Imports Excel files with worksheet selection and range configuration.

**Algorithm**:
1. **File Analysis**: Uses web worker for Excel file processing
2. **Sheet Detection**: Identifies available worksheets
3. **Range Selection**: Allows user to specify data ranges
4. **Data Extraction**: Extracts data with type preservation

**Worker Architecture**:
- Off-thread processing for large files
- Progressive loading indicators
- Error handling with user feedback
- Memory-efficient processing

**Key Files**:
- `hooks/useImportExcelLogic.ts`: Main import orchestration
- `hooks/useExcelWorker.ts`: Web worker integration
- `utils/importExcelUtils.ts`: Excel parsing utilities

### 7. OpenSavFile
**Purpose**: Opens SPSS `.sav` files with full metadata preservation.

**Algorithm**:
1. **File Validation**: Validates `.sav` file format
2. **Upload Processing**: Sends file to backend for processing
3. **Response Handling**: Processes SPSS-specific metadata
4. **State Integration**: Updates application with SPSS data

**SPSS Features**:
- Variable metadata preservation
- Date/time handling with SPSS epoch
- Label and value label support
- Missing value handling

**Key Files**:
- `hooks/useOpenSavFileLogic.ts`: SPSS file handling logic
- `services/services.ts`: Backend communication
- `utils/savFileUtils.ts`: SPSS-specific data processing

### 8. Print
**Purpose**: Generates PDF reports from current dataset with formatting options.

**Algorithm**:
1. **Data Preparation**: Formats data for PDF generation
2. **Layout Design**: Creates table layouts with styling
3. **PDF Generation**: Uses jsPDF library for document creation
4. **Download Trigger**: Initiates browser download

**Report Features**:
- Tabular data presentation
- Variable information inclusion
- Customizable formatting
- Professional report styling

**Key Files**:
- `hooks/usePrintLogic.ts`: Print orchestration logic
- `services/pdfPrintService.ts`: PDF generation services
- `utils/printUtils.ts`: Data formatting for print output

## Testing Strategy

### Test Structure
Each component includes comprehensive test suites:

1. **Component Tests**: UI rendering and user interaction
2. **Hook Tests**: Business logic and state management
3. **Service Tests**: API integration and external dependencies
4. **Utility Tests**: Pure function validation

### Test Coverage Areas
- File format validation
- Error handling scenarios
- User interaction flows
- Data processing accuracy
- Performance optimization

## Usage Patterns

### Common Integration Flow
```typescript
// Example usage pattern for any file modal
const { openModal } = useModal();

// Open specific modal
openModal('importCsv', {
  onSuccess: (data) => {
    // Handle successful import
    console.log('Data imported:', data);
  },
  onError: (error) => {
    // Handle import errors
    console.error('Import failed:', error);
  }
});
```

### State Management Integration
All components integrate with Zustand stores:
- `useDataStore`: Dataset management
- `useVariableStore`: Variable definitions and metadata
- `useMetaStore`: Project information and settings

## Development Guidelines

### Adding New File Format Support
1. Create new directory under `components/Modals/File/`
2. Implement standardized hook structure
3. Add service layer for format-specific processing
4. Include comprehensive test coverage
5. Update this documentation

### Error Handling Standards
- User-friendly error messages
- Console logging for debugging
- Graceful degradation for edge cases
- Clear validation feedback

### Performance Considerations
- Web worker usage for heavy processing
- Progressive loading indicators
- Memory management for large files
- Efficient state updates

## API Integration

### Backend Endpoints
- `/api/upload-sav`: SPSS file processing
- `/api/parse-excel`: Excel file parsing
- `/api/process-csv`: CSV file processing

### Error Response Format
```json
{
  "error": "Specific error message",
  "details": "Additional context",
  "code": "ERROR_CODE"
}
```

## Maintenance and Updates

### Version Control
- Semantic versioning for API changes
- Backward compatibility considerations
- Migration guides for breaking changes

### Documentation Updates
- Keep this README synchronized with code changes
- Update test documentation for new features
- Maintain changelog for significant updates

_Last updated: 2025-07-29_

## Registrasi Fitur

Semua modal dalam kategori ini didaftarkan melalui `FileRegistry.tsx`, yang kemudian digabungkan ke dalam sistem modal utama.

---

## 🧪 Unit Testing – Test Suite Index

This section serves as the single entry-point for every **Jest & React-Testing-Library** test that lives inside `components/Modals/File/*`.  If you need to locate where a particular File-modal feature is validated—​or where to place new coverage—​start here.

### 🗂️ Directory Map

```text
components/Modals/File/
├─ ImportCsv/
│  └─ __tests__/
├─ ImportExcel/
│  └─ __tests__/
├─ ImportClipboard/
│  └─ __tests__/
├─ ExportCsv/
│  └─ __tests__/
├─ ExportExcel/
│  └─ __tests__/
├─ ExampleDataset/
│  └─ __tests__/
├─ OpenSavFile/
│  └─ __tests__/
└─ Print/
   └─ __tests__/
```

Each `__tests__` folder follows a common convention:

1. **Component tests** target the orchestrator / UI surface.
2. **Hook tests** isolate business logic & state management.
3. **Utility / Worker tests** validate pure helpers or off-thread code.

---

### 📥 ImportCsv
Location: `ImportCsv/__tests__/`

| File | Focus |
|------|-------|
| `index.test.tsx` | Orchestrator UI – stage switching, file selection → configuration flow, button states. |
| `useImportCsvFileReader.test.ts` | Hook – FileReader handling, loading / error states. |
| `useImportCsvProcessor.test.ts` | Hook – worker orchestration, store population. |
| `useCsvWorker.test.ts` | Hook – Promise state (processing / error). |
| `importCsv.utils.test.ts` *(optional)* | Pure CSV parsing helpers. |

---

### 📥 ImportExcel
Location: `ImportExcel/__tests__/`

| File | Focus |
|------|-------|
| `ImportExcelSelectionStep.test.tsx` | UI – file chooser interactions, validation errors. |
| `ImportExcelConfigurationStep.test.tsx` | UI – worksheet & range selection, option toggles. |
| `useImportExcelLogic.test.ts` | Hook – state transitions, validation, store writes. |
| `useExcelWorker.test.ts` | Hook – worker lifecycle, progress & error handling. |
| `importExcel.utils.test.ts` | Utility – workbook parsing helpers. |

---

### 📋 ImportClipboard
Location: `ImportClipboard/__tests__/`

| File | Focus |
|------|-------|
| `ImportClipboardPasteStep.test.tsx` | UI – paste interaction, textarea behaviours. |
| `ImportClipboardConfigurationStep.test.tsx` | UI – delimiter & header detection settings. |
| `useImportClipboardLogic.test.ts` | Hook – text handling, validation, stage switching. |
| `useImportClipboardProcessor.test.ts` | Hook – worker call & store population. |
| `importClipboard.utils.test.ts` | Utility – TSV/CSV string parsing edge-cases. |
| `services.test.ts` | Service mocks – clipboard worker messaging. |

---

### 📤 ExportCsv
Location: `ExportCsv/__test__/`

| File | Focus |
|------|-------|
| `index.test.tsx` | UI – form rendering, option toggles, disabled / loading states. |
| `useExportCsv.test.ts` | Hook – option state, validation, export flow. |
| `exportCsvUtils.test.ts` | Utility – `generateCsvContent` formatting correctness. |

---

### 📤 ExportExcel
Location: `ExportExcel/__tests__/`

| File | Focus |
|------|-------|
| `ExportExcel.test.tsx` | UI – main modal rendering, option handling. |
| `useExportExcelLogic.test.ts` | Hook – state, validation, XLSX generation orchestration. |
| `excelExporter.test.ts` | Service – workbook creation & file writing via `xlsx`. |

---

### 📚 ExampleDataset
Location: `ExampleDataset/__tests__/`

| File | Focus |
|------|-------|
| `ExampleDatasetModal.test.tsx` | UI – list rendering, dataset selection, loading & error overlays, cancel flow. |
| `useExampleDatasetLogic.test.ts` | Hook – dataset loading orchestration, store updates, meta handling, error states. |
| `services.test.ts` *(optional)* | Service – network fetch & upload logic. |

---

### 📄 OpenSavFile
Location: `OpenSavFile/__tests__/`

| File | Focus |
|------|-------|
| `OpenSavFileModal.test.tsx` | UI – file selection, validation, OK/Cancel flow. |
| `useOpenSavFileLogic.test.ts` | Hook – file reading, worker calls, error handling. |

---

### 🖨️ Print
Location: `Print/__tests__/`

| File | Focus |
|------|-------|
| `usePrintLogic.test.ts` | Hook – state management & PDF flow orchestration. |
| `pdfPrintService.test.ts` | Service – section rendering, jsPDF calls. |
| `print.utils.test.ts` | Utility – table data transformation helpers. |

---

### Adding New Tests
1. Create the test file inside the appropriate feature's `__tests__` directory.
2. Update the **feature-specific README** *and* **this central index** so others can find it quickly.

---

_Last updated: <!-- KEEP THIS COMMENT: the CI tool replaces it with commit SHA & date -->_
