// importScripts(
//   "https://cdnjs.cloudflare.com/ajax/libs/mathjs/10.0.0/math.min.js"
// );

importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/mathjs/14.2.1/math.min.js"
);

// function mode(arr) {
//   const counts = {};
//   arr.forEach((val) => (counts[val] = (counts[val] || 0) + 1));
//   const maxCount = Math.max(...Object.values(counts));
//   const modes = Object.keys(counts)
//     .filter((k) => counts[k] === maxCount)
//     .map(Number);
//   return modes.length === 1 ? modes[0] : modes;
// }

// math.import({ mode: mode, cbrt: math.cbrt }, { override: true });

// Add all necessary functions
math.import(
  {
    ln: function (x, ...args) {
      if (args.length > 0) {
        throw new Error("ln() function only accepts one parameter");
      }
      return math.log(x);
    },
    arcos: function (x, ...args) {
      if (args.length > 0) {
        throw new Error("arcos() function only accepts one parameter");
      }
      return math.acos(x);
    },
    arsin: function (x, ...args) {
      if (args.length > 0) {
        throw new Error("arsin() function only accepts one parameter");
      }
      return math.asin(x);
    },
    artan: function (x, ...args) {
      if (args.length > 0) {
        throw new Error("artan() function only accepts one parameter");
      }
      return math.atan(x);
    },
    MODE: function (...args) {
      const flat = args.flat();
      return math.mode(flat);
    },
    varp: function (...args) {
      const data = args.flat();
      return math.variance(data, "uncorrected");
    },

    vars: function (...args) {
      const data = args.flat();
      return math.variance(data, "unbiased");
    },
    stdp: function (...args) {
      const data = args.flat();
      return math.std(data, "uncorrected");
    },
    stds: function (...args) {
      const data = args.flat();
      return math.std(data, "unbiased");
    },

    // log1p: function (x) {
    //   return math.log1p(x);
    // },
    // log2: function (x) {
    //   return math.log2(x);
    // },
    // log: function (x, base) {
    //   return math.log(x, base);
    // },
    // log10: function (x) {
    //   return math.log10(x);
    // },
    // abs: function (x) {
    //   return math.abs(x);
    // },
    // sqrt: function (x) {
    //   return math.sqrt(x);
    // },
    // cbrt: function (x) {
    //   return math.cbrt(x);
    // },
    // exp: function (x) {
    //   return math.exp(x);
    // },
    // cube: function (x) {
    //   return math.pow(x, 3);
    // },
    // square: function (x) {
    //   return math.pow(x, 2);
    // },
    // round: function (x, decimals) {
    //   return math.round(x, decimals);
    // },
    // fix: function (x) {
    //   return math.floor(x);
    // },
    // trunc: function (x) {
    //   return math.trunc(x);
    // },
  },
  { override: true }
);

// Helper function to safely evaluate expressions
function safeEvaluate(expression, context) {
  try {
    // 👉 Tangani fungsi kolom secara khusus di awal
    const colFuncMatch = expression.match(
      /^\s*(colmean|colsum|colmedian|colmin|colmax|colvarp|colvars|colstdp|colstds)\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*$/
    );
    if (colFuncMatch) {
      const [_, funcName, varName] = colFuncMatch;
      if (!self.variables || !self.data) {
        throw new Error("Data dan variabel tidak tersedia untuk fungsi kolom");
      }

      const variable = self.variables.find((v) => v.name === varName);
      if (!variable) throw new Error(`Variabel '${varName}' tidak ditemukan`);

      const colIdx = variable.columnIndex;
      const colValues = self.data
        .map((row) =>
          variable.type === "Numeric" ? parseFloat(row[colIdx]) : row[colIdx]
        )
        .filter((v) => !isNaN(v));

      if (colValues.length === 0) {
        throw new Error(`Tidak ada nilai numerik valid di kolom '${varName}'`);
      }

      let result;
      switch (funcName) {
        case "colmean":
          result = math.mean(colValues);
          break;
        case "colsum":
          result = math.sum(colValues);
          break;
        case "colmedian":
          result = math.median(colValues);
          break;
        case "colmin":
          result = math.min(colValues);
          break;
        case "colmax":
          result = math.max(colValues);
          break;
        case "colvarp":
          result = math.varp(colValues);
          break;
        case "colvars":
          result = math.vars(colValues);
          break;
        case "colstdp":
          result = math.stdp(colValues);
          break;
        case "colstds":
          result = math.stds(colValues);
          break;
        default:
          throw new Error(`Fungsi '${funcName}' tidak didukung`);
      }

      return result; // ✅ langsung kembalikan nilai
    }

    // 👉 Lanjut proses biasa
    let processedExpr = expression;
    const functionRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*([^)]+)\s*\)/g;

    processedExpr = processedExpr.replace(
      functionRegex,
      (match, funcName, args) => {
        const func = math[funcName];
        if (typeof func === "function") {
          const argValues = args.split(",").map((arg) => {
            const trimmed = arg.trim();
            return context.hasOwnProperty(trimmed)
              ? context[trimmed]
              : parseFloat(trimmed);
          });
          return func(...argValues);
        }
        return match;
      }
    );

    return math.evaluate(processedExpr, context);
  } catch (error) {
    // Improved error handling with user-friendly messages
    let userFriendlyMessage = error.message;

    // Handle specific error types
    if (error.message && error.message.includes("Parenthesis")) {
      userFriendlyMessage =
        "Missing or mismatched parentheses in your formula. Please check that all opening parentheses '(' have matching closing parentheses ')'";
    } else if (error.message && error.message.includes("Cannot convert")) {
      // Handle string to number conversion errors
      userFriendlyMessage = `Invalid data type detected. Please ensure all variables in your formula are compatibel with function you used.`;
    } else if (error.message && error.message.startsWith("Undefined symbol ")) {
      // Ambil nama symbol
      const match = error.message.match(/Undefined symbol ([^ ]+)/);
      const symbol = match ? match[1] : "unknown";
      userFriendlyMessage = `The variable or function '${symbol}' is not recognized. Please check the spelling or make sure the variable exists in your dataset.`;
    } else if (error.message && error.message.includes("Unexpected")) {
      userFriendlyMessage =
        "There's a syntax error in your formula. Please check for missing operators, extra symbols, or incorrect function usage.";
    } else if (error.message && error.message.includes("expected")) {
      userFriendlyMessage =
        "Your formula is incomplete or has incorrect syntax. Please review the expression for missing parts or typos.";
    } else if (error.message && error.message.includes("division by zero")) {
      userFriendlyMessage =
        "Division by zero detected. Please check your formula to avoid dividing by zero values.";
    } else if (error.message && error.message.includes("Invalid")) {
      userFriendlyMessage =
        "Invalid expression or function usage. Please check your formula syntax and function parameters.";
    }

    throw new Error(userFriendlyMessage);
  }
}

self.onmessage = function (event) {
  const { data, variables, numericExpression, variableType, roundDecimals } =
    event.data;

  // Store data and variables globally for colmean function
  self.data = data;
  self.variables = variables;

  try {
    // Validasi: Cek apakah ada variabel string yang digunakan dalam ekspresi numerik
    const variableNamesInExpression =
      numericExpression.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const stringVariablesUsed = variables.filter(
      (v) => v.type === "String" && variableNamesInExpression.includes(v.name)
    );

    if (stringVariablesUsed.length > 0) {
      const variableNames = stringVariablesUsed
        .map((v) => `'${v.name}'`)
        .join(", ");
      throw new Error(
        `Cannot perform numeric operations on string variable(s): ${variableNames}. Please use only numeric variables in your formula.`
      );
    }

    let computedValues;

    const isGlobalAggregateOnly =
      /^\s*(colmean|colsum|colmedian|colmin|colmax|colvarp|colvars|colstdp|colstds)\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\)\s*$/i.test(
        numericExpression
      );

    if (isGlobalAggregateOnly) {
      // Evaluasi sekali saja
      const result = safeEvaluate(numericExpression, {}); // kosongkan context

      // Hanya kembalikan satu baris hasil
      computedValues = [
        variableType === "Numeric" ? result.toString() : String(result),
      ];
    } else {
      // Preprocess untuk mendapatkan nilai fungsi kolom terlebih dahulu
      let processedExpr = numericExpression;
      const colFuncRegex =
        /(colmean|colsum|colmedian|colmin|colmax|colvarp|colvars|colstdp|colstds)\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g;

      // Ganti semua fungsi kolom dengan nilainya
      processedExpr = processedExpr.replace(
        colFuncRegex,
        (match, funcName, varName) => {
          const variable = self.variables.find((v) => v.name === varName);
          if (!variable)
            throw new Error(`Variabel '${varName}' tidak ditemukan`);

          const colIdx = variable.columnIndex;
          const colValues = self.data
            .map((row) =>
              variable.type === "Numeric"
                ? parseFloat(row[colIdx])
                : row[colIdx]
            )
            .filter((v) => !isNaN(v));

          if (colValues.length === 0) {
            throw new Error(
              `Tidak ada nilai numerik valid di kolom '${varName}'`
            );
          }

          let result;
          switch (funcName) {
            case "colmean":
              result = math.mean(colValues);
              break;
            case "colsum":
              result = math.sum(colValues);
              break;
            case "colmedian":
              result = math.median(colValues);
              break;
            case "colmin":
              result = math.min(colValues);
              break;
            case "colmax":
              result = math.max(colValues);
              break;
            case "colvarp":
              result = math.varp(colValues);
              break;
            case "colvars":
              result = math.vars(colValues);
              break;
            case "colstdp":
              result = math.stdp(colValues);
              break;
            case "colstds":
              result = math.stds(colValues);
              break;
            default:
              throw new Error(`Fungsi '${funcName}' tidak didukung`);
          }

          return result.toString();
        }
      );

      computedValues = data.map((row, rowIndex) => {
        const context = {};

        // Hapus validasi duplikat ini - sudah ada di awal
        // const variableNamesInExpression = ...
        // const stringVariablesUsed = ...
        // if (stringVariablesUsed.length > 0) { ... }

        variables.forEach((variable) => {
          const colIndex = variable.columnIndex;
          const cellValue = row[colIndex];

          if (variable.type === "Numeric") {
            const numValue = parseFloat(cellValue);
            if (isNaN(numValue)) {
              throw new Error(
                `Invalid numeric value '${cellValue}' in variable '${variable.name}'. Please check your data.`
              );
            }
            context[variable.name] = numValue;
          } else {
            // Untuk variabel string, hanya izinkan jika tidak digunakan dalam operasi numerik
            context[variable.name] = cellValue;
          }
        });

        let computedValue;
        try {
          computedValue = safeEvaluate(processedExpr, context);
        } catch (error) {
          // More user-friendly error message without row information
          let rowErrorMessage = error.message;

          if (error.message.includes("Parenthesis")) {
            rowErrorMessage =
              "Missing or mismatched parentheses in your formula";
          } else if (error.message.includes("Undefined symbol")) {
            rowErrorMessage = "Unknown variable or function in your formula";
          } else if (error.message.includes("division by zero")) {
            rowErrorMessage = "Division by zero occurred";
          }

          // Remove row number from error message
          throw new Error(`${rowErrorMessage}. Please check your formula.`);
        }

        if (computedValue === undefined || Number.isNaN(computedValue)) {
          // Remove row number from error message
          throw new Error(
            "The formula produced an invalid result. Please check for missing values or incorrect calculations."
          );
        }

        // Apply rounding if needed
        if (roundDecimals !== null && roundDecimals !== undefined) {
          computedValue = math.round(computedValue, roundDecimals);
        }

        return variableType === "Numeric"
          ? computedValue.toString()
          : String(computedValue);
      });
    }

    const tableData = {
      title: "Computed Values",
      columns: ["variabel target"],
      rows: computedValues.map((value) => ({ "variabel target": value })),
    };

    self.postMessage({ success: true, computedValues, tableData });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message || error.toString(),
    });
  }
};
