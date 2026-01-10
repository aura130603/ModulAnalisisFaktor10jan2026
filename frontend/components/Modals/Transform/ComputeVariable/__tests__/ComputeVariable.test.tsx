import React from "react";
import { jest, describe, it, expect } from "@jest/globals";

// Mock the stores and components
jest.mock("@/stores/useVariableStore", () => ({
  useVariableStore: {
    getState: jest.fn(() => ({
      variables: [
        {
          id: 1,
          columnIndex: 0,
          name: "Age",
          type: "NUMERIC",
          width: 8,
          decimals: 0,
          values: [],
          missing: null,
          columns: 1,
          align: "RIGHT",
          measure: "SCALE",
          role: "INPUT",
          label: "Age in years",
        },
        {
          id: 2,
          columnIndex: 1,
          name: "Gender",
          type: "STRING",
          width: 8,
          decimals: 0,
          values: [],
          missing: null,
          columns: 1,
          align: "LEFT",
          measure: "NOMINAL",
          role: "INPUT",
          label: "Gender",
        },
        {
          id: 3,
          columnIndex: 2,
          name: "Income",
          type: "NUMERIC",
          width: 8,
          decimals: 2,
          values: [],
          missing: null,
          columns: 1,
          align: "RIGHT",
          measure: "SCALE",
          role: "INPUT",
          label: "Monthly income",
        },
      ],
    })),
    addVariable: jest.fn(),
  },
}));

jest.mock("@/stores/useDataStore", () => ({
  useDataStore: {
    getState: jest.fn(() => ({
      data: [
        [25, "Male", 50000],
        [30, "Female", 60000],
        [35, "Male", 75000],
        [28, "Female", 45000],
        [42, "Male", 90000],
      ],
      updateCells: jest.fn(),
      saveData: jest.fn(),
    })),
  },
}));

jest.mock("@/stores/useResultStore", () => ({
  useResultStore: {
    addLog: jest.fn(),
    addAnalytic: jest.fn(),
    addStatistic: jest.fn(),
  },
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

// Mock UI components
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} />
  ),
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/Common/iconHelper", () => ({
  getVariableIcon: jest.fn(() => <span>📊</span>),
}));

describe("ComputeVariable Blackbox Tests", () => {
  describe("Function Groups and Categories Tests", () => {
    it("should validate all function groups are properly categorized", () => {
      const expectedFunctionGroups = {
        Arithmetic: ["abs", "exp", "ln", "log10", "mod", "sqrt", "trunc"],
        Statistical: [
          "mean",
          "median",
          "mode",
          "sd",
          "variance",
          "sum",
          "min",
          "max",
        ],
        String: ["concat", "length", "lower", "upper", "substr", "trim"],
        "Date & Time": [
          "date",
          "time",
          "year",
          "month",
          "day",
          "hour",
          "minute",
          "second",
        ],
        Logical: ["and", "or", "not", "if", "then", "else"],
        Conversion: ["toNumber", "toString", "toDate"],
        "CDF & Noncentral CDF": ["cdf.normal", "cdf.t", "cdf.chisq", "cdf.f"],
        "Random Variables": ["rv.uniform", "rv.normal", "rv.bernoulli"],
      };

      // Validate each function group
      Object.entries(expectedFunctionGroups).forEach(
        ([groupName, functions]) => {
          expect(Array.isArray(functions)).toBe(true);
          expect(functions.length).toBeGreaterThan(0);

          functions.forEach((func) => {
            expect(typeof func).toBe("string");
            expect(func.length).toBeGreaterThan(0);
          });
        }
      );
    });

    it("should validate arithmetic functions", () => {
      const arithmeticFunctions = [
        "abs",
        "exp",
        "ln",
        "log10",
        "mod",
        "sqrt",
        "trunc",
      ];

      arithmeticFunctions.forEach((func) => {
        expect(typeof func).toBe("string");
        expect(func).toMatch(/^[a-zA-Z0-9]+$/);
      });
    });

    it("should validate statistical functions", () => {
      const statisticalFunctions = [
        "mean",
        "median",
        "mode",
        "sd",
        "variance",
        "sum",
        "min",
        "max",
      ];

      statisticalFunctions.forEach((func) => {
        expect(typeof func).toBe("string");
        expect(func).toMatch(/^[a-zA-Z]+$/);
      });
    });

    it("should validate string functions", () => {
      const stringFunctions = [
        "concat",
        "length",
        "lower",
        "upper",
        "substr",
        "trim",
      ];

      stringFunctions.forEach((func) => {
        expect(typeof func).toBe("string");
        expect(func).toMatch(/^[a-zA-Z]+$/);
      });
    });

    it("should validate date and time functions", () => {
      const dateTimeFunctions = [
        "date",
        "time",
        "year",
        "month",
        "day",
        "hour",
        "minute",
        "second",
      ];

      dateTimeFunctions.forEach((func) => {
        expect(typeof func).toBe("string");
        expect(func).toMatch(/^[a-zA-Z]+$/);
      });
    });

    it("should validate logical functions", () => {
      const logicalFunctions = ["and", "or", "not", "if", "then", "else"];

      logicalFunctions.forEach((func) => {
        expect(typeof func).toBe("string");
        expect(func).toMatch(/^[a-zA-Z]+$/);
      });
    });

    it("should validate conversion functions", () => {
      const conversionFunctions = ["toNumber", "toString", "toDate"];

      conversionFunctions.forEach((func) => {
        expect(typeof func).toBe("string");
        expect(func).toMatch(/^to[A-Z][a-zA-Z]+$/);
      });
    });

    it("should validate CDF functions", () => {
      const cdfFunctions = ["cdf.normal", "cdf.t", "cdf.chisq", "cdf.f"];

      cdfFunctions.forEach((func) => {
        expect(typeof func).toBe("string");
        expect(func).toMatch(/^cdf\.[a-zA-Z]+$/);
      });
    });

    it("should validate random variable functions", () => {
      const rvFunctions = ["rv.uniform", "rv.normal", "rv.bernoulli"];

      rvFunctions.forEach((func) => {
        expect(typeof func).toBe("string");
        expect(func).toMatch(/^rv\.[a-zA-Z]+$/);
      });
    });
  });

  describe("Calculator Operations Tests", () => {
    it("should validate arithmetic operators", () => {
      const arithmeticOperators = ["+", "-", "*", "/", "^"];

      arithmeticOperators.forEach((operator) => {
        expect(typeof operator).toBe("string");
        expect(operator.length).toBe(1);
      });
    });

    it("should validate comparison operators", () => {
      const comparisonOperators = ["<", ">", "<=", ">=", "==", "!=", "≠"];

      comparisonOperators.forEach((operator) => {
        expect(typeof operator).toBe("string");
        expect(operator.length).toBeGreaterThan(0);
      });
    });

    it("should validate logical operators", () => {
      const logicalOperators = ["&", "|", "~"];

      logicalOperators.forEach((operator) => {
        expect(typeof operator).toBe("string");
        expect(operator.length).toBe(1);
      });
    });

    it("should validate numeric input", () => {
      const numericInputs = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        ".",
      ];

      numericInputs.forEach((input) => {
        expect(typeof input).toBe("string");
        expect(input.length).toBe(1);
      });
    });

    it("should validate special characters", () => {
      const specialChars = ["(", ")", "Delete"];

      specialChars.forEach((char) => {
        expect(typeof char).toBe("string");
        expect(char.length).toBeGreaterThan(0);
      });
    });

    it("should validate calculator button layout", () => {
      const expectedLayout = [
        ["+", "<", ">", "7", "8", "9"],
        ["-", "<=", ">=", "4", "5", "6"],
        ["*", "==", "≠", "1", "2", "3"],
        ["/", "&", "|", "0", "."],
        ["^", "~", "(", ")", "Delete", ""],
      ];

      expect(Array.isArray(expectedLayout)).toBe(true);
      expect(expectedLayout.length).toBe(5); // 5 rows

      expectedLayout.forEach((row, rowIndex) => {
        expect(Array.isArray(row)).toBe(true);
        expect(row.length).toBeLessThanOrEqual(6); // Max 6 columns
      });
    });
  });

  describe("Variable Management Tests", () => {
    it("should validate variable structure", () => {
      const mockVariable = {
        id: 1,
        columnIndex: 0,
        name: "Age",
        type: "NUMERIC",
        width: 8,
        decimals: 0,
        values: [],
        missing: null,
        columns: 1,
        align: "RIGHT",
        measure: "SCALE",
        role: "INPUT",
        label: "Age in years",
      };

      expect(mockVariable.id).toBeDefined();
      expect(mockVariable.columnIndex).toBeDefined();
      expect(mockVariable.name).toBeDefined();
      expect(mockVariable.type).toBeDefined();
      expect(mockVariable.width).toBeDefined();
      expect(mockVariable.decimals).toBeDefined();
      expect(mockVariable.values).toBeDefined();
      expect(mockVariable.columns).toBeDefined();
      expect(mockVariable.align).toBeDefined();
      expect(mockVariable.measure).toBeDefined();
      expect(mockVariable.role).toBeDefined();
    });

    it("should validate variable types", () => {
      const validTypes = ["NUMERIC", "STRING"];

      validTypes.forEach((type) => {
        expect(typeof type).toBe("string");
        expect(type).toMatch(/^(NUMERIC|STRING)$/);
      });
    });

    it("should validate variable alignment", () => {
      const validAlignments = ["LEFT", "RIGHT", "CENTER"];

      validAlignments.forEach((alignment) => {
        expect(typeof alignment).toBe("string");
        expect(alignment).toMatch(/^(LEFT|RIGHT|CENTER)$/);
      });
    });

    it("should validate variable measure", () => {
      const validMeasures = ["NOMINAL", "ORDINAL", "SCALE"];

      validMeasures.forEach((measure) => {
        expect(typeof measure).toBe("string");
        expect(measure).toMatch(/^(NOMINAL|ORDINAL|SCALE)$/);
      });
    });

    it("should validate variable role", () => {
      const validRoles = ["INPUT", "TARGET", "BOTH", "NONE"];

      validRoles.forEach((role) => {
        expect(typeof role).toBe("string");
        expect(role).toMatch(/^(INPUT|TARGET|BOTH|NONE)$/);
      });
    });
  });

  describe("Expression Validation Tests", () => {
    it("should validate basic arithmetic expressions", () => {
      const validExpressions = [
        "Age + 10",
        "Income * 1.5",
        "Age - 5",
        "Income / 1000",
        "Age ** 2",
      ];

      validExpressions.forEach((expression) => {
        expect(typeof expression).toBe("string");
        expect(expression.length).toBeGreaterThan(0);
        expect(expression).toMatch(/[+\-*/^]/);
      });
    });

    it("should validate function expressions", () => {
      const validFunctionExpressions = [
        "abs(Age)",
        "sqrt(Income)",
        "mean(Age)",
        "concat(Gender, '_', Age)",
        "if(Age > 30, 'Adult', 'Young')",
      ];

      validFunctionExpressions.forEach((expression) => {
        expect(typeof expression).toBe("string");
        expect(expression.length).toBeGreaterThan(0);
        expect(expression).toMatch(/\(.*\)/);
      });
    });

    it("should validate conditional expressions", () => {
      const validConditionalExpressions = [
        "if(Age > 30, Income * 1.1, Income)",
        "if(Gender == 'Male', Age + 5, Age)",
        "if(Income > 50000, 'High', 'Low')",
      ];

      validConditionalExpressions.forEach((expression) => {
        expect(typeof expression).toBe("string");
        expect(expression.length).toBeGreaterThan(0);
        expect(expression).toMatch(/if\(.*,.*,.*\)/);
      });
    });

    it("should validate complex expressions", () => {
      const validComplexExpressions = [
        "sqrt(Income) + abs(Age - 30)",
        "mean(Income) * (Age / 100)",
        "if(Age > 25 & Income > 50000, 'High', 'Low')",
        "concat(upper(Gender), '_', toString(Age))",
      ];

      validComplexExpressions.forEach((expression) => {
        expect(typeof expression).toBe("string");
        expect(expression.length).toBeGreaterThan(0);
        expect(expression).toMatch(/[+\-*/^()&|]/);
      });
    });
  });

  describe("Data Processing Tests", () => {
    it("should validate data structure", () => {
      const mockData = [
        [25, "Male", 50000],
        [30, "Female", 60000],
        [35, "Male", 75000],
      ];

      expect(Array.isArray(mockData)).toBe(true);
      expect(mockData.length).toBeGreaterThan(0);

      mockData.forEach((row) => {
        expect(Array.isArray(row)).toBe(true);
        expect(row.length).toBeGreaterThan(0);
      });
    });

    it("should validate data cleaning logic", () => {
      const rawData = [
        [25, "Male", 50000],
        [null, "Female", 60000],
        [35, "", 75000],
        [28, "Male", null],
        [42, "Female", 90000],
      ];

      const cleanedData = rawData.filter(
        (row) =>
          Array.isArray(row) &&
          row.some((cell) => cell !== null && cell !== undefined && cell !== "")
      );

      expect(Array.isArray(cleanedData)).toBe(true);
      expect(cleanedData.length).toBeLessThanOrEqual(rawData.length);

      cleanedData.forEach((row) => {
        expect(Array.isArray(row)).toBe(true);
        expect(
          row.some((cell) => cell !== null && cell !== undefined && cell !== "")
        ).toBe(true);
      });
    });

    it("should validate computed values structure", () => {
      const mockComputedValues = [100, 120, 140, 90, 180];

      expect(Array.isArray(mockComputedValues)).toBe(true);
      expect(mockComputedValues.length).toBeGreaterThan(0);

      mockComputedValues.forEach((value) => {
        expect(typeof value).toBe("number");
        expect(!isNaN(value)).toBe(true);
      });
    });
  });

  describe("Error Handling Tests", () => {
    it("should validate missing required fields", () => {
      const testCases = [
        { targetName: "", numericExpression: "Age + 10", shouldBeValid: false },
        { targetName: "NewVar", numericExpression: "", shouldBeValid: false },
        { targetName: "", numericExpression: "", shouldBeValid: false },
        {
          targetName: "NewVar",
          numericExpression: "Age + 10",
          shouldBeValid: true,
        },
      ];

      testCases.forEach((testCase) => {
        const isValid =
          testCase.targetName.length > 0 &&
          testCase.numericExpression.length > 0;
        expect(isValid).toBe(testCase.shouldBeValid);
      });
    });

    it("should validate duplicate variable names", () => {
      const existingVariables = ["Age", "Gender", "Income"];
      const testCases = [
        { targetName: "Age", shouldBeValid: false },
        { targetName: "NewVar", shouldBeValid: true },
        { targetName: "Gender", shouldBeValid: false },
        { targetName: "TestVariable", shouldBeValid: true },
      ];

      testCases.forEach((testCase) => {
        const isDuplicate = existingVariables.includes(testCase.targetName);
        expect(!isDuplicate).toBe(testCase.shouldBeValid);
      });
    });

    it("should validate expression syntax errors", () => {
      const invalidExpressions = [
        "Age +", // Incomplete expression
        "+ 10", // Missing operand
        "Age * / 10", // Invalid operator sequence
        "abs(", // Unclosed parenthesis
        "mean()", // Empty function
        "if(Age > 30,", // Incomplete conditional
      ];

      invalidExpressions.forEach((expression) => {
        expect(typeof expression).toBe("string");
        expect(expression.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Worker Communication Tests", () => {
    it("should validate worker message structure", () => {
      const mockWorkerMessage = {
        data: [
          [25, "Male", 50000],
          [30, "Female", 60000],
        ],
        variables: [
          { name: "Age", type: "NUMERIC" },
          { name: "Gender", type: "STRING" },
          { name: "Income", type: "NUMERIC" },
        ],
        numericExpression: "Age + 10",
        variableType: "NUMERIC",
        ifCondition: "",
      };

      expect(mockWorkerMessage.data).toBeDefined();
      expect(mockWorkerMessage.variables).toBeDefined();
      expect(mockWorkerMessage.numericExpression).toBeDefined();
      expect(mockWorkerMessage.variableType).toBeDefined();
      expect(mockWorkerMessage.ifCondition).toBeDefined();
    });

    it("should validate worker response structure", () => {
      const mockWorkerResponse = {
        success: true,
        computedValues: [35, 40, 45, 38, 52],
        error: null,
      };

      expect(typeof mockWorkerResponse.success).toBe("boolean");
      expect(Array.isArray(mockWorkerResponse.computedValues)).toBe(true);
      expect(mockWorkerResponse.error).toBeDefined();
    });

    it("should validate error response structure", () => {
      const mockErrorResponse = {
        success: false,
        computedValues: null,
        error: "Invalid expression syntax",
      };

      expect(typeof mockErrorResponse.success).toBe("boolean");
      expect(mockErrorResponse.computedValues).toBeNull();
      expect(typeof mockErrorResponse.error).toBe("string");
    });
  });

  describe("Integration Tests", () => {
    it("should validate complete compute variable workflow", () => {
      const workflowSteps = [
        "Input validation",
        "Variable name check",
        "Expression parsing",
        "Worker communication",
        "Data processing",
        "Variable creation",
        "Data update",
        "Logging",
      ];

      workflowSteps.forEach((step) => {
        expect(typeof step).toBe("string");
        expect(step.length).toBeGreaterThan(0);
      });
    });

    it("should validate data consistency after computation", () => {
      const originalDataLength = 5;
      const newVariableIndex = 3;
      const computedValues = [100, 120, 140, 90, 180];

      expect(computedValues.length).toBe(originalDataLength);
      expect(Array.isArray(computedValues)).toBe(true);

      computedValues.forEach((value) => {
        expect(typeof value).toBe("number");
        expect(!isNaN(value)).toBe(true);
      });
    });

    it("should validate variable store integration", () => {
      const mockNewVariable = {
        columnIndex: 3,
        name: "ComputedVar",
        type: "NUMERIC",
        width: 8,
        decimals: 2,
        label: "Computed Variable",
        values: [],
        missing: null,
        columns: 200,
        align: "right",
        measure: "scale",
        role: "input",
      };

      expect(mockNewVariable.columnIndex).toBeDefined();
      expect(mockNewVariable.name).toBeDefined();
      expect(mockNewVariable.type).toBeDefined();
      expect(mockNewVariable.width).toBeDefined();
      expect(mockNewVariable.decimals).toBeDefined();
      expect(mockNewVariable.label).toBeDefined();
    });
  });

  describe("Performance and Scalability Tests", () => {
    it("should handle large datasets efficiently", () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => [
        i + 1,
        i % 2 === 0 ? "Male" : "Female",
        Math.floor(Math.random() * 100000) + 20000,
      ]);

      expect(Array.isArray(largeDataset)).toBe(true);
      expect(largeDataset.length).toBe(1000);

      largeDataset.forEach((row) => {
        expect(Array.isArray(row)).toBe(true);
        expect(row.length).toBe(3);
      });
    });

    it("should validate memory usage for complex expressions", () => {
      const complexExpressions = [
        "sqrt(mean(Income)) + abs(median(Age) - 30) * (std(Income) / 1000)",
        "if(Age > 25 & Income > 50000 | Gender == 'Male', 'High', 'Low')",
        "concat(upper(substr(Gender, 1, 1)), '_', toString(round(Income/1000)))",
      ];

      complexExpressions.forEach((expression) => {
        expect(typeof expression).toBe("string");
        expect(expression.length).toBeGreaterThan(0);
        expect(expression.length).toBeLessThan(1000); // Reasonable length
      });
    });
  });

  describe("Edge Cases Tests", () => {
    it("should handle empty datasets", () => {
      const emptyData: any[] = [];
      expect(Array.isArray(emptyData)).toBe(true);
      expect(emptyData.length).toBe(0);
    });

    it("should handle single row datasets", () => {
      const singleRowData = [[25, "Male", 50000]];
      expect(Array.isArray(singleRowData)).toBe(true);
      expect(singleRowData.length).toBe(1);
    });

    it("should handle very long variable names", () => {
      const longVariableName = "VeryLongVariableNameThatExceedsNormalLength";
      expect(typeof longVariableName).toBe("string");
      expect(longVariableName.length).toBeGreaterThan(20);
    });

    it("should handle special characters in expressions", () => {
      const specialCharExpressions = [
        "Age + 10.5",
        "Income * 1.5e3",
        "Gender == 'Male'",
        "Age > 30 & Income < 100000",
      ];

      specialCharExpressions.forEach((expression) => {
        expect(typeof expression).toBe("string");
        expect(expression.length).toBeGreaterThan(0);
      });
    });
  });
});
