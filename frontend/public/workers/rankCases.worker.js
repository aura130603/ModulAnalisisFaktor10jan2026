// public/workers/rankCases.worker.js

self.onmessage = function(e) {
    const {
        data,                    // The dataset (array of arrays)
        variableColumnIndex,     // Column index of the variable to rank
        rankDirection,           // "largest" or "smallest"
        tieHandling,             // "mean", "low", "high", "sequential"
        variableName             // Name of the variable being ranked
    } = e.data;

    try {
        if (!data || !Array.isArray(data) || data.length < 2) {
            throw new Error("Invalid data provided");
        }

        if (variableColumnIndex === undefined || variableColumnIndex < 0) {
            throw new Error("Invalid variable column index");
        }

        if (!variableName) {
            throw new Error("Variable name is required");
        }

        // Extract values and calculate ranks
        const rankedValues = calculateRanks(
            data,
            variableColumnIndex,
            rankDirection,
            tieHandling
        );

        // Post results back to main thread
        self.postMessage({
            success: true,
            rankedValues: rankedValues,
            variableName: variableName,
            columnName: `R${variableName}`
        });
    } catch (error) {
        self.postMessage({
            success: false,
            error: error.message || "Unknown error occurred"
        });
    }
};

/**
 * Calculate ranks for a variable with tie handling
 * All rows in the data array are treated as data rows (no separate header row)
 */
function calculateRanks(data, variableColumnIndex, rankDirection, tieHandling) {
    // Treat all rows as data rows (no header row assumption)
    const valueIndices = data
        .map((row, idx) => {
            const value = row[variableColumnIndex];
            // Parse numeric value
            const numValue = parseFloat(value);
            return {
                originalIndex: idx,
                value: isNaN(numValue) ? null : numValue,
                rawValue: value
            };
        })
        .filter(item => item.value !== null); // Filter out nulls
    
    // Sort by value based on direction
    const sortedValues = [...valueIndices];
    if (rankDirection === "largest") {
        sortedValues.sort((a, b) => b.value - a.value);
    } else {
        sortedValues.sort((a, b) => a.value - b.value);
    }

    // Initialize ranks array with null for all data rows
    const ranks = new Array(data.length).fill(null);
    
    // Calculate ranks with tie handling
    let i = 0;
    while (i < sortedValues.length) {
        const currentValue = sortedValues[i].value;
        let tieCount = 1;
        
        // Count how many values are equal (ties)
        while (i + tieCount < sortedValues.length && 
               sortedValues[i + tieCount].value === currentValue) {
            tieCount++;
        }
        
        // Calculate rank based on tie handling method
        let rankValue;
        const startPosition = i + 1; // 1-based position
        const endPosition = i + tieCount; // 1-based position
        
        if (tieCount === 1) {
            // No tie, just use the position
            rankValue = startPosition;
        } else {
            // Handle ties based on method
            switch (tieHandling) {
                case "mean":
                    // Average of the tied ranks
                    rankValue = (startPosition + endPosition) / 2;
                    break;
                case "low":
                    // Lowest rank of the tied group
                    rankValue = startPosition;
                    break;
                case "high":
                    // Highest rank of the tied group
                    rankValue = endPosition;
                    break;
                case "sequential":
                    // Sequential ranks for ties (will be assigned in loop)
                    rankValue = null; // Will be set individually below
                    break;
                default:
                    rankValue = (startPosition + endPosition) / 2; // Default to mean
            }
        }
        
        // Assign ranks to all tied values
        if (tieHandling === "sequential" && tieCount > 1) {
            // Sequential: each tied value gets a sequential rank
            for (let j = 0; j < tieCount; j++) {
                ranks[sortedValues[i + j].originalIndex] = startPosition + j;
            }
        } else {
            // All other methods: same rank for ties
            for (let j = 0; j < tieCount; j++) {
                ranks[sortedValues[i + j].originalIndex] = rankValue;
            }
        }
        
        i += tieCount;
    }
    
    return ranks;
}
