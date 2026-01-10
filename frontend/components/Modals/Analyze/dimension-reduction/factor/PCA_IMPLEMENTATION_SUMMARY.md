# Principal Component Analysis (PCA) Implementation Summary

## Overview
This document describes the implementation of Principal Component Analysis (PCA) feature in the Factor Analysis module. The implementation allows users to perform PCA analysis with web worker support and generates SPSS-compatible output including correlation matrices, communalities, total variance explained, component matrices, and scree plots.

## User Workflow

### Step 1: Input Data
- User imports data in the Data View

### Step 2: Descriptive Statistics (Optional but recommended)
- Open Factor Analysis Modal
- Click **Descriptives** button
- In **Statistics** box: Check **"Initial Solution"** to display communalities
- In **Correlation Matrix** box: Check **"Coefficients"** to display correlation matrix
- Click **Continue**

### Step 3: Extraction Settings
- Click **Extraction** button
- **Method**: Select **"Principal components"** (default)
- **Analyze** section: Select **"Correlation Matrix"** (default)
- **Display** section: Check **"Scree Plot"** to show eigenvalue scree plot
- **Extract** section: Select "Based on Eigenvalues"
  - Set **"Eigenvalues Greater than"**: `1` (default for PCA Kaiser criterion)
  - Set **"Maximum Iterations for Convergence"**: `25`
- Click **Continue**

### Step 4: Rotation Settings
- Click **Rotation** button
- **Method** section: Select **"None"** (no rotation for initial solution)
- Click **Continue**

### Step 5: Missing Values (Optional)
- Click **Options** button
- **Missing Values** section: Select **"Exclude cases listwise"**
- Click **Continue**

### Step 6: Run Analysis
- Click **OK** in main dialog
- System performs PCA analysis and displays results

## Output Generated

### 1. **Correlation Matrix** (if Coefficient is checked)
- Table showing correlation coefficients between all variables
- Format: Variables as rows and columns
- Includes variable names and correlation values (3 decimal places)

### 2. **Communalities** (if Initial Solution is checked)
- Table showing initial communalities for each variable
- For PCA: All initial communalities = 1.0
- Includes note: "Extraction Method: Principal Component Analysis."

### 3. **Total Variance Explained**
- Table showing:
  - **Component**: Component number (1, 2, 3, ...)
  - **Total**: Eigenvalue
  - **% of Variance**: Percentage of variance explained by each component
  - **Cumulative %**: Cumulative percentage of variance explained
- Includes note: "Extraction Method: Principal Component Analysis."

### 4. **Scree Plot** (if Scree Plot is checked)
- Line chart showing eigenvalues vs component numbers
- X-axis: Component Number
- Y-axis: Eigenvalue
- Shows the "elbow" pattern typical of PCA results
- Helps determine optimal number of components to retain

### 5. **Component Matrix** (if Unrotated Solution is checked)
- Table showing component loadings (correlations between variables and components)
- Rows: Variables
- Columns: Components
- Values: Loadings (up to 3 decimal places)
- Includes note: "Extraction Method: Principal Component Analysis."

## Files Modified

### 1. **frontend/components/Modals/Analyze/dimension-reduction/factor/services/factor-analysis.ts**
**Changes Made:**
- Updated data slicing logic to convert raw sliced data into numeric 2D arrays (variables × samples format)
- Ensured correlation matrix is calculated from the numeric data
- Fixed communalities calculation for PCA (set to 1.0 for all variables)
- Updated scree plot generation to include proper component numbers
- Updated total variance explained output format to include eigenvalues, variance percentages, and cumulative percentages
- Updated component matrix format to organize variables as rows with component values

**Key Changes:**
```typescript
// Convert sliced data to numeric 2D array (variables × samples)
const slicedDataForTarget = slicedDataRaw.map((varData, varIndex) => {
    return varData.map((row: any) => {
        const varName = targetVariables[varIndex];
        const value = row[varName];
        return typeof value === 'number' ? value : (value === null ? NaN : parseFloat(String(value)));
    });
});

// Set communalities to 1.0 for PCA
if (descriptives.InitialSol) {
    results.communalities = {
        initial: targetVariables.map((variable, i) => ({
            variable,
            value: 1.0
        }))
    };
}

// Generate scree plot with proper format
if (extraction.Scree) {
    const eigenvaluesForScree = pcaResults.eigenvalues.slice(0, pcaResults.numComponents);
    results.scree_plot = {
        eigenvalues: eigenvaluesForScree,
        components: Array.from(
            { length: eigenvaluesForScree.length },
            (_, i) => i + 1
        )
    };
}

// Total variance explained with correct format
results.total_variance_explained = {
    components: Array.from({ length: numComponentsToDisplay }, (_, i) => i + 1),
    eigenvalues: pcaResults.eigenvalues.slice(0, numComponentsToDisplay),
    variance_percent: pcaResults.varianceExplained.slice(0, numComponentsToDisplay),
    cumulative_percent: pcaResults.cumulativeVariance.slice(0, numComponentsToDisplay)
};

// Component matrix with variables as rows
if (extraction.Unrotated) {
    results.component_matrix = {
        components: targetVariables.map((variable, j) => ({
            variable,
            values: Array.from({ length: numComponentsToDisplay }, (_, i) => 
                pcaResults.loadings[i][j]
            )
        }))
    };
}
```

### 2. **frontend/components/Modals/Analyze/dimension-reduction/factor/services/factor-analysis-formatter.ts**
**Changes Made:**
- Enhanced Total Variance Explained formatting to handle simplified PCA format
- Added Scree Plot chart data generation
- Updated Component Matrix formatting to handle the variable-based structure
- Added flexibility to support both simple and complex variance explained formats

**Key Changes:**
```typescript
// Handle simplified PCA format for Total Variance Explained
if (data.total_variance_explained.components && 
    data.total_variance_explained.eigenvalues &&
    Array.isArray(data.total_variance_explained.eigenvalues)) {
    // Create simple table with Component, Total, % of Variance, Cumulative %
    const table: Table = {
        key: "total_variance_explained",
        title: "Total Variance Explained",
        columnHeaders: [
            { header: "Component", key: "component" },
            { header: "Total", key: "total" },
            { header: "% of Variance", key: "percent_variance" },
            { header: "Cumulative %", key: "cumulative_percent" },
        ],
        rows: [],
    };
    // ... populate rows with component data ...
}

// Generate Scree Plot as chart
if (data.scree_plot) {
    const chartData = {
        chartType: "line",
        chartData: data.scree_plot.components.map((component: number, index: number) => ({
            component: `${component}`,
            eigenvalue: data.scree_plot.eigenvalues[index],
        })),
        chartConfig: {
            width: 600,
            height: 400,
            useAxis: true,
            useLegend: false,
            axisLabels: {
                x: "Component Number",
                y: "Eigenvalue",
            },
        },
        chartMetadata: {
            axisInfo: {
                category: "component",
                value: "eigenvalue",
            },
            description: "Scree Plot of Eigenvalues",
            title: "Scree Plot",
        },
    };

    if (!resultJson.charts) {
        resultJson.charts = [];
    }
    resultJson.charts.push(chartData);
}

// Enhanced Component Matrix formatting
if (Array.isArray(data.component_matrix.components)) {
    data.component_matrix.components.forEach((variable_data: any) => {
        const rowData: any = {
            rowHeader: [variable_data.variable],
        };

        if (Array.isArray(variable_data.values)) {
            variable_data.values.forEach((value: number, index: number) => {
                rowData[`component_${index + 1}`] = formatDisplayNumber(value);
            });
        }

        table.rows.push(rowData);
    });
}
```

### 3. **frontend/components/Modals/Analyze/dimension-reduction/factor/services/factor-analysis-output.ts**
**Changes Made:**
- Added support for rendering charts in addition to tables
- Extended the output service to process and display Scree Plot charts
- Maintained backward compatibility with existing table-based outputs

**Key Changes:**
```typescript
// Process charts if available
if (formattedResult.charts && formattedResult.charts.length > 0) {
    for (const chart of formattedResult.charts) {
        const chartTitle = chart.chartMetadata?.title || "Chart";
        const chartJson = JSON.stringify({ charts: [chart] });

        const chartId = await addAnalytic(logId, {
            title: chartTitle,
            note: "",
        });

        await addStatistic(chartId, {
            title: chartTitle,
            description: chart.chartMetadata?.description || chartTitle,
            output_data: chartJson,
            components: chartTitle,
        });
    }
}
```

## Web Worker Files (No Changes Required)

The existing web worker files in `frontend/public/workers/FactorAnalysis/` already contain the necessary PCA implementation:

### **factorAnalysis.worker.js**
- Performs standardization of data
- Computes correlation/covariance matrix
- Performs eigenvalue decomposition using QR algorithm
- Calculates loadings, communalities, variance explained, and component scores
- Returns comprehensive PCA results

### **eigen.js**
- Implements eigenvalue decomposition using QR algorithm
- Provides matrix utilities (transpose, multiply, QR decomposition)
- Handles numeric stability and convergence

### **correlation.js**
- Contains correlation matrix utilities
- Provides helper functions for statistical calculations

## Data Flow

1. **User selects variables and submits**
   → FactorMainType.TargetVar set

2. **Data preprocessing**
   → getSlicedData() retrieves raw data
   → Convert to numeric 2D array (variables × samples)

3. **Descriptive calculations** (if enabled)
   → Calculate correlation matrix (if Coefficient checked)
   → Calculate descriptive statistics (if UnivarDesc checked)

4. **PCA analysis via Web Worker**
   → Send standardized data and options to worker
   → Worker computes eigendecomposition
   → Returns eigenvalues, eigenvectors, loadings, etc.

5. **Result compilation**
   → Format communalities (if InitialSol checked)
   → Format correlation matrix (if Coefficient checked)
   → Format total variance explained
   → Format component matrix (if Unrotated checked)
   → Format scree plot data (if Scree checked)

6. **Result formatting**
   → transformFactorAnalysisResult() creates Table objects for display
   → Add chart data for scree plot

7. **Result storage**
   → resultFactorAnalysis() stores results in ResultStore
   → Each table and chart saved as separate statistic entry

8. **Display**
   → Results displayed in Results panel
   → Scree plot rendered using GeneralChartContainer

## SPSS Compatibility

The output format matches SPSS Principal Component Analysis output:
- ✅ Correlation Matrix table format
- ✅ Communalities table with Initial column set to 1.0
- ✅ Total Variance Explained table with eigenvalues, percentages, cumulative percentages
- ✅ Component Matrix table with loadings
- ✅ Scree Plot visualization
- ✅ Extraction method notes

## Testing the Implementation

### Test Scenario 1: Full PCA with All Options
1. Load sample data with 6 variables
2. Open Factor Analysis
3. Select all 6 variables
4. Descriptives: Check "Initial Solution" and "Coefficients"
5. Extraction: Principal Components, Correlation Matrix, Scree Plot, Eigenvalues > 1
6. Rotation: None
7. Options: Exclude Listwise
8. **Expected Output:**
   - Correlation Matrix table
   - Communalities table (all 1.0)
   - Total Variance Explained table
   - Scree Plot chart
   - Component Matrix table

### Test Scenario 2: PCA Without Scree Plot
1. Same as above but skip checking "Scree Plot"
2. **Expected Output:** No Scree Plot chart

### Test Scenario 3: PCA Without Descriptives
1. Same setup but skip Descriptives dialog
2. **Expected Output:** Only variance and component outputs (no correlation/communalities)

## Error Handling

The implementation includes error handling for:
- Missing or invalid data
- Web worker timeout (30 second limit)
- Numeric conversion failures
- Missing variable definitions
- Empty datasets

## Performance Considerations

- **Web Worker**: Offloads heavy computation from main thread
- **Timeout**: 30-second timeout prevents hanging
- **Chunked Output**: Results added to store incrementally
- **Memory Efficient**: Processes data by variable iteration

## Future Enhancements

Potential improvements for future versions:
1. Support for factor analysis methods (ML, GLS, etc.)
2. Rotation methods (Varimax, Promax, etc.)
3. Factor scores calculation and storage
4. Model fit statistics (e.g., Bartlett's test, KMO)
5. Reproduced correlation matrix with residuals
6. Pattern and structure matrices for oblique rotations
7. Biplot visualization
8. Communalities comparison (Initial vs Extracted)
