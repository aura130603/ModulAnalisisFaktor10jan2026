// DataProcessingWorker.js - Worker untuk data processing
// Migrasi dari DataProcessingService ke Web Worker

self.onmessage = function (event) {
  const {
    chartType,
    rawData,
    variables,
    chartVariables,
    processingOptions = {},
  } = event.data;

  try {
    console.log(
      "DataProcessingWorker: Processing data for chart type:",
      chartType
    );

    // Validate input
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      throw new Error("rawData is required and must be a non-empty array");
    }

    if (!variables || !Array.isArray(variables) || variables.length === 0) {
      throw new Error("variables is required and must be a non-empty array");
    }

    // Map variable indices
    const indices = mapVariableIndices(variables, chartVariables);

    // Process data berdasarkan chart type
    const processedData = processDataForChart(
      chartType,
      rawData,
      indices,
      processingOptions
    );

    console.log("DataProcessingWorker: Data processing completed successfully");

    // Kirim hasil ke main thread
    self.postMessage({
      success: true,
      processedData: processedData,
      chartType: chartType,
    });
  } catch (error) {
    console.error("DataProcessingWorker: Error processing data:", error);
    self.postMessage({
      success: false,
      error: error.message,
    });
  }
};

// Helper function untuk map variable indices
function mapVariableIndices(variables, chartVariables) {
  const indices = {};

  if (chartVariables.x) {
    indices.x = chartVariables.x.map((v) =>
      variables.findIndex((varObj) => varObj.name === v)
    );
  }

  if (chartVariables.y) {
    indices.y = chartVariables.y.map((v) =>
      variables.findIndex((varObj) => varObj.name === v)
    );
  }

  if (chartVariables.z) {
    indices.z = chartVariables.z.map((v) =>
      variables.findIndex((varObj) => varObj.name === v)
    );
  }

  if (chartVariables.groupBy) {
    indices.groupBy = chartVariables.groupBy.map((v) =>
      variables.findIndex((varObj) => varObj.name === v)
    );
  }

  if (chartVariables.low) {
    indices.low = chartVariables.low.map((v) =>
      variables.findIndex((varObj) => varObj.name === v)
    );
  }

  if (chartVariables.high) {
    indices.high = chartVariables.high.map((v) =>
      variables.findIndex((varObj) => varObj.name === v)
    );
  }

  if (chartVariables.close) {
    indices.close = chartVariables.close.map((v) =>
      variables.findIndex((varObj) => varObj.name === v)
    );
  }

  if (chartVariables.y2) {
    indices.y2 = chartVariables.y2.map((v) =>
      variables.findIndex((varObj) => varObj.name === v)
    );
  }

  // Validate indices
  Object.entries(indices).forEach(([key, value]) => {
    if (Array.isArray(value) && value.includes(-1)) {
      const missingVars = chartVariables[key]?.filter(
        (v, i) => value[i] === -1
      );
      throw new Error(
        `Variable ${key} (${missingVars?.join(
          ", "
        )}) tidak ditemukan dalam dataset`
      );
    }
  });

  return indices;
}

// Main processing function
function processDataForChart(chartType, rawData, indices, options) {
  const { aggregation = "sum", filterEmpty = true } = options;

  // Process berdasarkan chart type
  switch (chartType) {
    case "Vertical Bar Chart":
    case "Horizontal Bar Chart":
    case "Line Chart":
    case "Area Chart":
    case "Pie Chart":
    case "Boxplot":
    case "Error Bar Chart":
    case "Dot Plot":
    case "Frequency Polygon":
    case "Summary Point Plot":
    case "Violin Plot":
      return processSimpleChartData(rawData, indices, options);

    case "Scatter Plot":
    case "Scatter Plot With Fit Line":
      return processScatterData(rawData, indices, options);

    case "Vertical Stacked Bar Chart":
    case "Horizontal Stacked Bar Chart":
    case "Clustered Bar Chart":
    case "Multiple Line Chart":
    case "Stacked Area Chart":
    case "Population Pyramid":
      return processStackedChartData(rawData, indices, options);

    case "3D Bar Chart":
    case "3D Bar Chart2":
    case "3D Scatter Plot":
    case "Clustered 3D Bar Chart":
    case "Stacked 3D Bar Chart":
      return process3DChartData(rawData, indices, options);

    case "Grouped Scatter Plot":
    case "Drop Line Chart":
      return processGroupedScatterData(rawData, indices, options);

    case "Simple Range Bar":
    case "High-Low-Close Chart":
      return processRangeChartData(rawData, indices, options);

    case "Clustered Range Bar":
      return processClusteredRangeData(rawData, indices, options);

    case "Difference Area":
      return processDifferenceAreaData(rawData, indices, options);

    case "Vertical Bar & Line Chart":
      return processBarLineData(rawData, indices, options);

    case "Dual Axes Scatter Plot":
      return processDualAxesData(rawData, indices, options);

    case "Grouped 3D Scatter Plot":
      return processGrouped3DScatterData(rawData, indices, options);

    case "Histogram":
    case "Density Chart":
    case "Stem And Leaf Plot":
      return processHistogramData(rawData, indices, options);

    case "Stacked Histogram":
      return processStackedHistogramData(rawData, indices, options);

    case "Clustered Error Bar Chart":
      return processClusteredErrorBarData(rawData, indices, options);

    case "Scatter Plot Matrix":
      return processScatterMatrixData(rawData, indices, options);

    case "Clustered Boxplot":
      return processClusteredBoxplotData(rawData, indices, options);

    case "1-D Boxplot":
      return process1DBoxplotData(rawData, indices, options);

    default:
      return processSimpleChartData(rawData, indices, options);
  }
}

// Processing functions untuk berbagai chart types
function processSimpleChartData(rawData, indices, options) {
  const { aggregation = "sum", filterEmpty = true } = options;

  const frequencyMap = rawData.reduce((acc, row) => {
    const xKey = row[indices.x[0]];
    const yValue = parseFloat(row[indices.y[0]]);

    if (filterEmpty && (xKey === null || xKey === undefined || xKey === "")) {
      return acc;
    }

    if (!isNaN(yValue)) {
      if (aggregation === "sum") {
        acc[xKey] = (acc[xKey] || 0) + yValue;
      } else if (aggregation === "count") {
        acc[xKey] = (acc[xKey] || 0) + 1;
      } else if (aggregation === "average") {
        if (!acc[xKey]) acc[xKey] = { sum: 0, count: 0 };
        acc[xKey].sum += yValue;
        acc[xKey].count += 1;
      }
    }

    return acc;
  }, {});

  // Convert to array format
  return Object.keys(frequencyMap).map((key) => {
    const value =
      aggregation === "average"
        ? frequencyMap[key].sum / frequencyMap[key].count
        : frequencyMap[key];

    return {
      category: key,
      value: value,
    };
  });
}

function processScatterData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const xValue = parseFloat(row[indices.x[0]]);
      const yValue = parseFloat(row[indices.y[0]]);

      if (filterEmpty && (isNaN(xValue) || isNaN(yValue))) {
        return null;
      }

      return {
        x: xValue,
        y: yValue,
      };
    })
    .filter((item) => item !== null);
}

function processStackedChartData(rawData, indices, options) {
  const { aggregation = "sum", filterEmpty = true } = options;

  const frequencyMap = rawData.reduce((acc, row) => {
    const xKey = row[indices.x[0]];

    if (filterEmpty && (xKey === null || xKey === undefined || xKey === "")) {
      return acc;
    }

    indices.y.forEach((yIndex, i) => {
      const yValue = parseFloat(row[yIndex]);
      if (!isNaN(yValue)) {
        if (!acc[xKey]) acc[xKey] = [];
        acc[xKey].push({
          subcategory: indices.y[i], // Use variable name as subcategory
          value: yValue,
        });
      }
    });

    return acc;
  }, {});

  // Convert to flat array format
  return Object.keys(frequencyMap)
    .map((key) => {
      return frequencyMap[key].map((entry) => ({
        category: key,
        subcategory: entry.subcategory,
        value: entry.value,
      }));
    })
    .flat();
}

function process3DChartData(rawData, indices, options) {
  const { aggregation = "sum", filterEmpty = true } = options;

  const reducedData = rawData.reduce((acc, row) => {
    const x = parseFloat(row[indices.x[0]]);
    const y = parseFloat(row[indices.y[0]]);
    const z = parseFloat(row[indices.z[0]]);

    if (filterEmpty && (isNaN(x) || isNaN(y) || isNaN(z))) {
      return acc;
    }

    // Create unique key based on x and z combination
    const key = `${x}-${z}`;

    if (!acc[key]) {
      acc[key] = { x, z, y: 0 };
    }

    acc[key].y += y;

    return acc;
  }, {});

  return Object.values(reducedData);
}

function processGroupedScatterData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const group = row[indices.groupBy[0]];
      const xValue = parseFloat(row[indices.x[0]]);
      const yValue = parseFloat(row[indices.y[0]]);

      if (filterEmpty && (isNaN(xValue) || isNaN(yValue))) {
        return null;
      }

      return {
        category: group,
        x: xValue,
        y: yValue,
      };
    })
    .filter((item) => item !== null);
}

function processRangeChartData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const category = row[indices.x[0]];
      const lowValue = parseFloat(row[indices.low[0]]);
      const highValue = parseFloat(row[indices.high[0]]);
      const closeValue = parseFloat(row[indices.close[0]]);

      if (
        filterEmpty &&
        (isNaN(lowValue) || isNaN(highValue) || isNaN(closeValue))
      ) {
        return null;
      }

      return {
        category: category,
        low: lowValue,
        high: highValue,
        close: closeValue,
      };
    })
    .filter((item) => item !== null);
}

function processClusteredRangeData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const category = row[indices.x[0]];
      const subcategory = row[indices.groupBy[0]];
      const lowValue = parseFloat(row[indices.low[0]]);
      const highValue = parseFloat(row[indices.high[0]]);
      const closeValue = parseFloat(row[indices.close[0]]);

      if (
        filterEmpty &&
        (isNaN(lowValue) || isNaN(highValue) || isNaN(closeValue))
      ) {
        return null;
      }

      return {
        category: category,
        subcategory: subcategory,
        low: lowValue,
        high: highValue,
        close: closeValue,
      };
    })
    .filter((item) => item !== null);
}

function processDifferenceAreaData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const category = row[indices.x[0]];
      const value0 = parseFloat(row[indices.low[0]]);
      const value1 = parseFloat(row[indices.high[0]]);

      if (filterEmpty && (isNaN(value0) || isNaN(value1))) {
        return null;
      }

      return {
        category: category,
        value0: value0,
        value1: value1,
      };
    })
    .filter((item) => item !== null);
}

function processBarLineData(rawData, indices, options) {
  const { aggregation = "sum", filterEmpty = true } = options;

  const frequencyMap = rawData.reduce((acc, row) => {
    const category = row[indices.x[0]];
    const barValue = parseFloat(row[indices.y[0]]);
    const lineValue = parseFloat(row[indices.y2[0]]);

    if (
      filterEmpty &&
      (category === null || category === undefined || category === "")
    ) {
      return acc;
    }

    if (!isNaN(barValue) && !isNaN(lineValue)) {
      acc[category] = {
        barValue: barValue,
        lineValue: lineValue,
      };
    }

    return acc;
  }, {});

  return Object.keys(frequencyMap).map((key) => ({
    category: key,
    barValue: frequencyMap[key].barValue,
    lineValue: frequencyMap[key].lineValue,
  }));
}

function processDualAxesData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const xValue = parseFloat(row[indices.x[0]]);
      const y1Value = parseFloat(row[indices.y[0]]);
      const y2Value = parseFloat(row[indices.y2[0]]);

      if (filterEmpty && (isNaN(xValue) || isNaN(y1Value) || isNaN(y2Value))) {
        return null;
      }

      return {
        x: xValue,
        y1: y1Value,
        y2: y2Value,
      };
    })
    .filter((item) => item !== null);
}

function processGrouped3DScatterData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const x = parseFloat(row[indices.x[0]]);
      const y = parseFloat(row[indices.y[0]]);
      const z = parseFloat(row[indices.z[0]]);
      const category = row[indices.groupBy[0]];

      if (filterEmpty && (isNaN(x) || isNaN(y) || isNaN(z))) {
        return null;
      }

      return { x, y, z, category };
    })
    .filter((item) => item !== null);
}

function processHistogramData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const value = parseFloat(row[indices.y[0]]);

      if (filterEmpty && isNaN(value)) {
        return null;
      }

      return value;
    })
    .filter((item) => item !== null);
}

function processStackedHistogramData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const value = parseFloat(row[indices.x[0]]);
      const category = row[indices.groupBy[0]];

      if (filterEmpty && isNaN(value)) {
        return null;
      }

      return {
        value: value,
        category: category,
      };
    })
    .filter((item) => item !== null);
}

function processClusteredErrorBarData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const category = row[indices.x[0]];
      const subcategory = row[indices.groupBy[0]];
      const value = parseFloat(row[indices.y[0]]);

      if (filterEmpty && isNaN(value)) {
        return null;
      }

      // Placeholder error calculation - bisa disesuaikan
      const error = 2;

      return {
        category: category,
        subcategory: subcategory,
        value: value,
        error: error,
      };
    })
    .filter((item) => item !== null);
}

function processScatterMatrixData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const entry = {};

      indices.x.forEach((xIndex, i) => {
        const value = parseFloat(row[xIndex]);
        if (!isNaN(value)) {
          entry[indices.x[i]] = value;
        }
      });

      // Only return if all variables have valid values
      return Object.keys(entry).length === indices.x.length ? entry : null;
    })
    .filter((item) => item !== null);
}

function processClusteredBoxplotData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const category = row[indices.x[0]];
      const subcategory = row[indices.groupBy[0]];
      const value = parseFloat(row[indices.y[0]]);

      if (filterEmpty && isNaN(value)) {
        return null;
      }

      return {
        category: category,
        subcategory: subcategory,
        value: value,
      };
    })
    .filter((item) => item !== null);
}

function process1DBoxplotData(rawData, indices, options) {
  const { filterEmpty = true } = options;

  return rawData
    .map((row) => {
      const value = parseFloat(row[indices.y[0]]);

      if (filterEmpty && isNaN(value)) {
        return null;
      }

      return { value: value };
    })
    .filter((item) => item !== null);
}
