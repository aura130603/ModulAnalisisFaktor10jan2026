// public/workers/duplicateCases.worker.js

// This worker processes duplicate cases and generates statistics
self.onmessage = function(e) {
    const {
        data,                // The dataset to analyze (array of arrays)
        matchingVariables,   // Variables used to identify duplicates
        sortingVariables,    // Variables used to sort within groups
        sortOrder,           // "ascending" or "descending"
        primaryCaseIndicator, // "first" or "last"
        primaryName,         // Name for primary indicator variable
        sequentialCount,     // Boolean - create sequential counter?
        sequentialName,      // Name for sequential counter variable
        moveMatchingToTop,   // Boolean - reorder data?
        displayFrequencies   // Boolean - display frequency tables?
    } = e.data;

    try {
        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error("Invalid data provided");
        }

        if (!matchingVariables || !Array.isArray(matchingVariables) || matchingVariables.length === 0) {
            throw new Error("No matching variables provided");
        }

        // Process the data
        const result = processDuplicateCases(
            data,
            matchingVariables,
            sortingVariables,
            sortOrder,
            primaryCaseIndicator
        );

        // Generate statistics if needed
        const statistics = displayFrequencies ? generateStatistics(result, primaryName, sequentialCount, sequentialName) : [];

        // Post results back to main thread
        self.postMessage({
            success: true,
            result: {
                primaryValues: result.primaryValues,
                sequenceValues: result.sequenceValues,
                reorderedData: moveMatchingToTop ? result.reorderedData : null
            },
            statistics
        });
    } catch (error) {
        self.postMessage({
            success: false,
            error: error.message || "Unknown error occurred"
        });
    }
};

/**
 * Main function to process duplicate cases
 */
function processDuplicateCases(data, matchingVariables, sortingVariables, sortOrder, primaryCaseIndicator) {
    // Extract headers and data rows
    const headers = data[0];
    const dataRows = data.slice(1);
    
    // Get column indices for matching variables
    const matchingIndices = matchingVariables.map(v => v.columnIndex);
    
    // Get column indices for sorting variables
    const sortingIndices = sortingVariables.map(v => v.columnIndex);
    
    // Create a map to group duplicate cases
    const duplicateGroups = new Map();
    
    // Process each row to identify duplicates
    dataRows.forEach((row, rowIndex) => {
        // Create a key from the matching variables' values
        const key = matchingIndices.map(idx => row[idx]).join('|');
        
        // Add to the group or create a new group
        if (!duplicateGroups.has(key)) {
            duplicateGroups.set(key, []);
        }
        
        duplicateGroups.get(key).push({
            rowIndex,
            row
        });
    });
    
    // Sort within groups if sorting variables are provided
    if (sortingIndices.length > 0) {
        duplicateGroups.forEach(group => {
            group.sort((a, b) => {
                for (const idx of sortingIndices) {
                    const aVal = a.row[idx];
                    const bVal = b.row[idx];
                    
                    // Handle numeric values
                    const aNum = !isNaN(parseFloat(aVal)) ? parseFloat(aVal) : aVal;
                    const bNum = !isNaN(parseFloat(bVal)) ? parseFloat(bVal) : bVal;
                    
                    if (aNum !== bNum) {
                        return sortOrder === "ascending" ? 
                            (aNum < bNum ? -1 : 1) : 
                            (aNum > bNum ? -1 : 1);
                    }
                }
                return 0;
            });
        });
    }
    
    // Initialize arrays for results
    const primaryValues = new Array(dataRows.length).fill(0);
    const sequenceValues = new Array(dataRows.length).fill(0);
    
    // Process each group to mark primary cases and assign sequence numbers
    duplicateGroups.forEach(group => {
        // If only one case in the group, it's not a duplicate
        if (group.length === 1) {
            primaryValues[group[0].rowIndex] = 1; // Mark as primary
            return;
        }
        
        // Mark primary case based on selection (first or last)
        const primaryIndex = primaryCaseIndicator === "first" ? 0 : group.length - 1;
        primaryValues[group[primaryIndex].rowIndex] = 1;
        
        // Assign sequence numbers
        group.forEach((item, i) => {
            sequenceValues[item.rowIndex] = i + 1; // 1-based sequence number
        });
    });
    
    // Reorder data if moveMatchingToTop is true
    let reorderedData = null;
    if (true) { // Always calculate reordered data, filter by moveMatchingToTop flag when returning
        // Create a copy of the original data
        reorderedData = [headers]; // Start with headers
        
        // Add rows with duplicates first
        const duplicateRows = [];
        const uniqueRows = [];
        
        duplicateGroups.forEach(group => {
            if (group.length > 1) {
                // This is a duplicate group
                group.forEach(item => {
                    duplicateRows.push(item.row);
                });
            } else {
                // This is a unique row
                uniqueRows.push(group[0].row);
            }
        });
        
        // Combine duplicate rows and unique rows
        reorderedData = reorderedData.concat(duplicateRows, uniqueRows);
    }
    
    return {
        primaryValues,
        sequenceValues,
        reorderedData
    };
}

/**
 * Generate statistics for display
 */
function generateStatistics(result, primaryName, sequentialCount, sequentialName) {
    const statistics = [];
    
    // Count primary and duplicate cases
    const primaryCount = result.primaryValues.filter(v => v === 1).length;
    const duplicateCount = result.primaryValues.filter(v => v === 0).length;
    
    // Primary case frequency table
    statistics.push({
        title: `Frequency Table: ${primaryName}`,
        description: "Frequency distribution of primary and duplicate cases",
        component: "FrequencyTable",
        output_data: {
            rows: [
                { label: "Duplicate case", value: "0", count: duplicateCount, percent: (duplicateCount / result.primaryValues.length * 100).toFixed(1) },
                { label: "Primary case", value: "1", count: primaryCount, percent: (primaryCount / result.primaryValues.length * 100).toFixed(1) },
                { label: "Total", value: "", count: result.primaryValues.length, percent: "100.0" }
            ],
            headers: ["Category", "Value", "Count", "Percent"]
        }
    });
    
    // Add sequence statistics if enabled
    if (sequentialCount) {
        // Count occurrences of each sequence value
        const sequenceCounts = {};
        result.sequenceValues.forEach(val => {
            sequenceCounts[val] = (sequenceCounts[val] || 0) + 1;
        });
        
        // Convert to rows for display
        const sequenceRows = Object.keys(sequenceCounts)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(key => {
                const count = sequenceCounts[key];
                return {
                    label: key === "0" ? "Non-matching case" : `Sequence ${key}`,
                    value: key,
                    count: count,
                    percent: (count / result.sequenceValues.length * 100).toFixed(1)
                };
            });
        
        sequenceRows.push({
            label: "Total",
            value: "",
            count: result.sequenceValues.length,
            percent: "100.0"
        });
        
        statistics.push({
            title: `Frequency Table: ${sequentialName}`,
            description: "Frequency distribution of case sequence numbers",
            component: "FrequencyTable",
            output_data: {
                rows: sequenceRows,
                headers: ["Sequence", "Value", "Count", "Percent"]
            }
        });
    }
    
    return statistics;
}