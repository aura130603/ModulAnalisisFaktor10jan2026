// DataProcessingWorkerExample.js
// Contoh penggunaan DataProcessingWorker

// Contoh 1: Simple Bar Chart
function example1_SimpleBarChart() {
  // Raw data dari CSV/SPSS
  const rawData = [
    ["A", 30],
    ["B", 80],
    ["C", 45],
    ["D", 60],
  ];

  const variables = [
    { name: "category", type: "string" },
    { name: "value", type: "number" },
  ];

  // Buat worker
  const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

  // Setup event listener
  worker.onmessage = function (event) {
    if (event.data.success) {
      console.log("Example 1 - Simple Bar Chart:");
      console.log("Raw data:", rawData);
      console.log("Processed data:", event.data.processedData);

      // Lanjutkan ke ChartService untuk generate chart JSON
      // const chartJSON = ChartService.createChartJSON({
      //   chartType: "Vertical Bar Chart",
      //   chartData: event.data.processedData,
      //   chartVariables: {
      //     x: ["category"],
      //     y: ["value"]
      //   },
      //   chartMetadata: {
      //     title: "Simple Bar Chart"
      //   }
      // });
    } else {
      console.error("Error:", event.data.error);
    }

    // Terminate worker
    worker.terminate();
  };

  // Kirim data ke worker
  worker.postMessage({
    chartType: "Vertical Bar Chart",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["category"],
      y: ["value"],
    },
    processingOptions: {
      aggregation: "sum",
      filterEmpty: true,
    },
  });
}

// Contoh 2: Scatter Plot
function example2_ScatterPlot() {
  const rawData = [
    [10, 20],
    [15, 25],
    [20, 30],
    [25, 35],
  ];

  const variables = [
    { name: "x", type: "number" },
    { name: "y", type: "number" },
  ];

  const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

  worker.onmessage = function (event) {
    if (event.data.success) {
      console.log("Example 2 - Scatter Plot:");
      console.log("Processed data:", event.data.processedData);
    } else {
      console.error("Error:", event.data.error);
    }
    worker.terminate();
  };

  worker.postMessage({
    chartType: "Scatter Plot",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["x"],
      y: ["y"],
    },
  });
}

// Contoh 3: Stacked Bar Chart
function example3_StackedBarChart() {
  const rawData = [
    ["A", "Group1", 30],
    ["A", "Group2", 20],
    ["A", "Group3", 10],
    ["B", "Group1", 25],
    ["B", "Group2", 15],
    ["B", "Group3", 5],
  ];

  const variables = [
    { name: "category", type: "string" },
    { name: "group", type: "string" },
    { name: "value", type: "number" },
  ];

  const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

  worker.onmessage = function (event) {
    if (event.data.success) {
      console.log("Example 3 - Stacked Bar Chart:");
      console.log("Processed data:", event.data.processedData);
    } else {
      console.error("Error:", event.data.error);
    }
    worker.terminate();
  };

  worker.postMessage({
    chartType: "Vertical Stacked Bar Chart",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["category"],
      y: ["group"],
    },
  });
}

// Contoh 4: 3D Chart
function example4_3DChart() {
  const rawData = [
    [1, 2, 3],
    [2, 4, 6],
    [3, 6, 9],
  ];

  const variables = [
    { name: "x", type: "number" },
    { name: "y", type: "number" },
    { name: "z", type: "number" },
  ];

  const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

  worker.onmessage = function (event) {
    if (event.data.success) {
      console.log("Example 4 - 3D Chart:");
      console.log("Processed data:", event.data.processedData);
    } else {
      console.error("Error:", event.data.error);
    }
    worker.terminate();
  };

  worker.postMessage({
    chartType: "3D Scatter Plot",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["x"],
      y: ["y"],
      z: ["z"],
    },
  });
}

// Contoh 5: Range Chart
function example5_RangeChart() {
  const rawData = [
    ["A", 10, 20, 15],
    ["B", 15, 25, 20],
    ["C", 20, 30, 25],
  ];

  const variables = [
    { name: "category", type: "string" },
    { name: "low", type: "number" },
    { name: "high", type: "number" },
    { name: "close", type: "number" },
  ];

  const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

  worker.onmessage = function (event) {
    if (event.data.success) {
      console.log("Example 5 - Range Chart:");
      console.log("Processed data:", event.data.processedData);
    } else {
      console.error("Error:", event.data.error);
    }
    worker.terminate();
  };

  worker.postMessage({
    chartType: "Simple Range Bar",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["category"],
      low: ["low"],
      high: ["high"],
      close: ["close"],
    },
  });
}

// Contoh 6: Grouped Scatter Plot
function example6_GroupedScatterPlot() {
  const rawData = [
    ["Group1", 10, 20],
    ["Group1", 15, 25],
    ["Group2", 20, 30],
    ["Group2", 25, 35],
  ];

  const variables = [
    { name: "group", type: "string" },
    { name: "x", type: "number" },
    { name: "y", type: "number" },
  ];

  const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

  worker.onmessage = function (event) {
    if (event.data.success) {
      console.log("Example 6 - Grouped Scatter Plot:");
      console.log("Processed data:", event.data.processedData);
    } else {
      console.error("Error:", event.data.error);
    }
    worker.terminate();
  };

  worker.postMessage({
    chartType: "Grouped Scatter Plot",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["x"],
      y: ["y"],
      groupBy: ["group"],
    },
  });
}

// Contoh 7: Histogram
function example7_Histogram() {
  const rawData = [[20], [25], [30], [35], [40]];

  const variables = [{ name: "value", type: "number" }];

  const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

  worker.onmessage = function (event) {
    if (event.data.success) {
      console.log("Example 7 - Histogram:");
      console.log("Processed data:", event.data.processedData);
    } else {
      console.error("Error:", event.data.error);
    }
    worker.terminate();
  };

  worker.postMessage({
    chartType: "Histogram",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      y: ["value"],
    },
  });
}

// Contoh 8: Complete Workflow dengan Error Handling
function example8_CompleteWorkflow() {
  // Raw data dari CSV/SPSS
  const rawData = [
    ["Product A", "Q1", 100],
    ["Product A", "Q2", 150],
    ["Product B", "Q1", 80],
    ["Product B", "Q2", 120],
  ];

  const variables = [
    { name: "product", type: "string" },
    { name: "quarter", type: "string" },
    { name: "sales", type: "number" },
  ];

  const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

  worker.onmessage = function (event) {
    if (event.data.success) {
      console.log("Example 8 - Complete Workflow:");
      console.log("Raw data:", rawData);
      console.log("Processed data:", event.data.processedData);
      console.log("Chart type:", event.data.chartType);

      // Step 2: Generate chart JSON (bisa menggunakan ChartService)
      // const chartJSON = ChartService.createChartJSON({
      //   chartType: "Vertical Stacked Bar Chart",
      //   chartData: event.data.processedData,
      //   chartVariables: {
      //     x: ["product"],
      //     y: ["quarter"]
      //   },
      //   chartMetadata: {
      //     title: "Product Sales by Quarter",
      //     subtitle: "Stacked Bar Chart"
      //   }
      // });

      console.log("Chart JSON generation ready!");
    } else {
      console.error("Error processing data:", event.data.error);
    }

    worker.terminate();
  };

  worker.onerror = function (error) {
    console.error("Worker error:", error);
    worker.terminate();
  };

  // Kirim data ke worker
  worker.postMessage({
    chartType: "Vertical Stacked Bar Chart",
    rawData: rawData,
    variables: variables,
    chartVariables: {
      x: ["product"],
      y: ["quarter"],
    },
    processingOptions: {
      aggregation: "sum",
      filterEmpty: true,
    },
  });
}

// Utility function untuk menggunakan worker dengan Promise
function createDataProcessingWorkerPromise(input) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

    worker.onmessage = function (event) {
      if (event.data.success) {
        resolve(event.data.processedData);
      } else {
        reject(new Error(event.data.error));
      }
      worker.terminate();
    };

    worker.onerror = function (error) {
      reject(error);
      worker.terminate();
    };

    worker.postMessage(input);
  });
}

// Contoh penggunaan dengan Promise
async function example9_PromiseBased() {
  try {
    const rawData = [
      ["A", 30],
      ["B", 80],
      ["C", 45],
    ];

    const variables = [
      { name: "category", type: "string" },
      { name: "value", type: "number" },
    ];

    const processedData = await createDataProcessingWorkerPromise({
      chartType: "Vertical Bar Chart",
      rawData: rawData,
      variables: variables,
      chartVariables: {
        x: ["category"],
        y: ["value"],
      },
      processingOptions: {
        aggregation: "sum",
        filterEmpty: true,
      },
    });

    console.log("Example 9 - Promise Based:");
    console.log("Processed data:", processedData);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Export semua contoh
window.DataProcessingWorkerExamples = {
  example1_SimpleBarChart,
  example2_ScatterPlot,
  example3_StackedBarChart,
  example4_3DChart,
  example5_RangeChart,
  example6_GroupedScatterPlot,
  example7_Histogram,
  example8_CompleteWorkflow,
  example9_PromiseBased,
  createDataProcessingWorkerPromise,
};
