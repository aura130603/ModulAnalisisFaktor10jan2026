// Mock React and React Testing Library
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock dependencies
jest.mock("@/stores/useVariableStore", () => ({
  useVariableStore: {
    getState: jest.fn(() => ({
      variables: [
        {
          name: "Age",
          label: "Age",
          type: "NUMERIC",
          columnIndex: 0,
          width: 8,
          decimals: 2,
          values: [],
          missing: null,
          columns: 1,
          align: "right",
          measure: "scale",
          role: "input",
          tempId: "age-1",
        },
        {
          name: "Income",
          label: "Income",
          type: "NUMERIC",
          columnIndex: 1,
          width: 8,
          decimals: 2,
          values: [],
          missing: null,
          columns: 1,
          align: "right",
          measure: "scale",
          role: "input",
          tempId: "income-1",
        },
      ],
    })),
    addVariable: jest.fn(),
  },
}));

jest.mock("@/stores/useDataStore", () => ({
  useDataStore: jest.fn(() => ({
    data: [
      [25, 50000],
      [30, 60000],
      [35, 70000],
    ],
    updateCells: jest.fn(),
    saveData: jest.fn(),
  })),
}));

jest.mock("@/stores/useResultStore", () => ({
  useResultStore: jest.fn(() => ({
    addLog: jest.fn(() => Promise.resolve("log-id")),
    addAnalytic: jest.fn(() => Promise.resolve("analytic-id")),
    addStatistic: jest.fn(),
  })),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  DialogHeader: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
}));

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  AlertDialogAction: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  AlertDialogContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  AlertDialogDescription: ({ children, ...props }: any) => (
    <p {...props}>{children}</p>
  ),
  AlertDialogFooter: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  AlertDialogHeader: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  AlertDialogTitle: ({ children, ...props }: any) => (
    <h3 {...props}>{children}</h3>
  ),
}));

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  SelectItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  SelectValue: ({ children, ...props }: any) => (
    <span {...props}>{children}</span>
  ),
}));

jest.mock("@/components/ui/textarea", () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea value={value} onChange={onChange} {...props} />
  ),
}));

jest.mock("@/components/ui/alert", () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => (
    <p {...props}>{children}</p>
  ),
}));

// Mock utilities
jest.mock("@/components/Common/iconHelper", () => ({
  getVariableIcon: jest.fn(() => <span>📊</span>),
}));

// Mock VariableListManager
jest.mock("@/components/Common/VariableListManager", () => ({
  __esModule: true,
  default: ({
    availableVariables,
    targetLists,
    onMoveVariable,
    onReorderVariable,
  }: any) => (
    <div data-testid="variable-list-manager">
      <div data-testid="available-variables">
        {availableVariables.map((variable: any) => (
          <div
            key={variable.tempId}
            data-testid={`available-${variable.tempId}`}
          >
            {variable.name}
          </div>
        ))}
      </div>
      <div data-testid="target-lists">
        {targetLists.map((list: any) => (
          <div key={list.id} data-testid={`target-list-${list.id}`}>
            {list.variables.map((variable: any) => (
              <div
                key={variable.tempId}
                data-testid={`target-${variable.tempId}`}
              >
                {variable.name}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  ),
}));

// Mock lucide-react
jest.mock("lucide-react", () => ({
  Info: ({ ...props }: any) => <span {...props}>ℹ️</span>,
}));

// Mock Web Worker
global.Worker = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  onmessage: null,
  terminate: jest.fn(),
}));

// Import components
import { FunctionsList } from "../FunctionsList";
import { VariablesList } from "../VariablesList";
import { Calculator } from "../Calculator";
import ComputeVariablesTab from "../ComputeVariablesTab";

describe("ComputeVariable Unit Tests", () => {
  describe("FunctionsList Component", () => {
    const mockOnFunctionSelect = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should render FunctionsList correctly", () => {
      render(<FunctionsList onFunctionSelect={mockOnFunctionSelect} />);

      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("abs")).toBeInTheDocument();
      expect(screen.getByText("round")).toBeInTheDocument();
    });

    it("should handle function selection", () => {
      render(<FunctionsList onFunctionSelect={mockOnFunctionSelect} />);

      const absFunction = screen.getByText("abs");
      fireEvent.click(absFunction);

      expect(mockOnFunctionSelect).toHaveBeenCalledWith("abs(");
    });

    it("should handle function group selection", () => {
      render(<FunctionsList onFunctionSelect={mockOnFunctionSelect} />);

      // Test that functions are available
      expect(screen.getByText("abs")).toBeInTheDocument();
      expect(screen.getByText("sqrt")).toBeInTheDocument();
    });

    it("should display all function groups when 'All' is selected", () => {
      render(<FunctionsList onFunctionSelect={mockOnFunctionSelect} />);

      // Test that all function categories are present
      expect(screen.getByText("abs")).toBeInTheDocument();
      expect(screen.getByText("exp")).toBeInTheDocument();
      expect(screen.getByText("mean")).toBeInTheDocument();
      expect(screen.getByText("colmean")).toBeInTheDocument();
      expect(screen.getByText("sin")).toBeInTheDocument();
    });

    it("should handle multiple function selections", () => {
      render(<FunctionsList onFunctionSelect={mockOnFunctionSelect} />);

      const functions = ["abs", "round", "sqrt", "mean", "sin"];

      functions.forEach((func) => {
        const functionElement = screen.getByText(func);
        fireEvent.click(functionElement);
      });

      expect(mockOnFunctionSelect).toHaveBeenCalledTimes(functions.length);
      expect(mockOnFunctionSelect).toHaveBeenCalledWith("abs(");
      expect(mockOnFunctionSelect).toHaveBeenCalledWith("round(");
      expect(mockOnFunctionSelect).toHaveBeenCalledWith("sqrt(");
      expect(mockOnFunctionSelect).toHaveBeenCalledWith("mean(");
      expect(mockOnFunctionSelect).toHaveBeenCalledWith("sin(");
    });
  });

  describe("VariablesList Component", () => {
    const mockVariables = [
      {
        name: "Age",
        label: "Age",
        type: "NUMERIC" as const,
        columnIndex: 0,
        width: 8,
        decimals: 2,
        values: [],
        missing: null,
        columns: 1,
        align: "right" as const,
        measure: "scale" as const,
        role: "input" as const,
        tempId: "age-1",
      },
      {
        name: "Income",
        label: "Income",
        type: "NUMERIC" as const,
        columnIndex: 1,
        width: 8,
        decimals: 2,
        values: [],
        missing: null,
        columns: 1,
        align: "right" as const,
        measure: "scale" as const,
        role: "input" as const,
        tempId: "income-1",
      },
    ];

    const mockOnVariableClick = jest.fn();
    const mockOnDragStart = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should render VariablesList correctly", () => {
      render(
        <VariablesList
          variables={mockVariables}
          onVariableClick={mockOnVariableClick}
          onDragStart={mockOnDragStart}
        />
      );

      expect(screen.getByText("Variables:")).toBeInTheDocument();
      expect(screen.getByText("Age [Age]")).toBeInTheDocument();
      expect(screen.getByText("Income [Income]")).toBeInTheDocument();
    });

    it("should handle variable click", () => {
      render(
        <VariablesList
          variables={mockVariables}
          onVariableClick={mockOnVariableClick}
          onDragStart={mockOnDragStart}
        />
      );

      const ageVariable = screen.getByText("Age [Age]");
      fireEvent.click(ageVariable);

      expect(mockOnVariableClick).toHaveBeenCalledWith(mockVariables[0]);
    });

    it("should handle variable drag start", () => {
      render(
        <VariablesList
          variables={mockVariables}
          onVariableClick={mockOnVariableClick}
          onDragStart={mockOnDragStart}
        />
      );

      const incomeVariable = screen.getByText("Income [Income]");
      fireEvent.dragStart(incomeVariable);

      expect(mockOnDragStart).toHaveBeenCalledWith(
        expect.any(Object),
        mockVariables[1]
      );
    });

    it("should handle empty variables list", () => {
      render(
        <VariablesList
          variables={[]}
          onVariableClick={mockOnVariableClick}
          onDragStart={mockOnDragStart}
        />
      );

      expect(screen.getByText("Variables:")).toBeInTheDocument();
      expect(screen.queryByText("Age [Age]")).not.toBeInTheDocument();
    });

    it("should display variables with and without labels", () => {
      const variablesWithMixedLabels = [
        {
          name: "Age",
          label: "Age",
          type: "NUMERIC" as const,
          columnIndex: 0,
          width: 8,
          decimals: 2,
          values: [],
          missing: null,
          columns: 1,
          align: "right" as const,
          measure: "scale" as const,
          role: "input" as const,
          tempId: "age-1",
        },
        {
          name: "Score",
          label: "",
          type: "NUMERIC" as const,
          columnIndex: 1,
          width: 8,
          decimals: 2,
          values: [],
          missing: null,
          columns: 1,
          align: "right" as const,
          measure: "scale" as const,
          role: "input" as const,
          tempId: "score-1",
        },
      ];

      render(
        <VariablesList
          variables={variablesWithMixedLabels}
          onVariableClick={mockOnVariableClick}
          onDragStart={mockOnDragStart}
        />
      );

      expect(screen.getByText("Age [Age]")).toBeInTheDocument();
      expect(screen.getByText("Score")).toBeInTheDocument();
    });
  });

  describe("Calculator Component", () => {
    const mockOnButtonClick = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should render Calculator correctly", () => {
      render(<Calculator onButtonClick={mockOnButtonClick} />);

      // Test basic operators
      expect(screen.getByText("+")).toBeInTheDocument();
      expect(screen.getByText("-")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
      expect(screen.getByText("/")).toBeInTheDocument();

      // Test numbers
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("9")).toBeInTheDocument();

      // Test special buttons
      expect(screen.getByText("Delete")).toBeInTheDocument();
      expect(screen.getByText("(")).toBeInTheDocument();
      expect(screen.getByText(")")).toBeInTheDocument();
    });

    it("should handle number button clicks", () => {
      render(<Calculator onButtonClick={mockOnButtonClick} />);

      const numberButtons = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

      numberButtons.forEach((number) => {
        const button = screen.getByText(number);
        fireEvent.click(button);
      });

      expect(mockOnButtonClick).toHaveBeenCalledTimes(numberButtons.length);
      numberButtons.forEach((number) => {
        expect(mockOnButtonClick).toHaveBeenCalledWith(number);
      });
    });

    it("should handle operator button clicks", () => {
      render(<Calculator onButtonClick={mockOnButtonClick} />);

      const operatorButtons = ["+", "-", "*", "/"];

      operatorButtons.forEach((operator) => {
        const button = screen.getByText(operator);
        fireEvent.click(button);
      });

      expect(mockOnButtonClick).toHaveBeenCalledTimes(operatorButtons.length);
      operatorButtons.forEach((operator) => {
        expect(mockOnButtonClick).toHaveBeenCalledWith(operator);
      });
    });

    it("should handle special button clicks", () => {
      render(<Calculator onButtonClick={mockOnButtonClick} />);

      // Test Delete button
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
      expect(mockOnButtonClick).toHaveBeenCalledWith("");

      // Test power operator
      const powerButton = screen.getByText("^");
      fireEvent.click(powerButton);
      expect(mockOnButtonClick).toHaveBeenCalledWith("**");

      // Test not operator
      const notButton = screen.getByText("~");
      fireEvent.click(notButton);
      expect(mockOnButtonClick).toHaveBeenCalledWith("not(");
    });

    it("should handle comparison operators", () => {
      render(<Calculator onButtonClick={mockOnButtonClick} />);

      const comparisonButtons = ["<", ">", "<=", ">=", "==", "≠"];

      comparisonButtons.forEach((operator) => {
        const button = screen.getByText(operator);
        fireEvent.click(button);
      });

      expect(mockOnButtonClick).toHaveBeenCalledTimes(comparisonButtons.length);
      expect(mockOnButtonClick).toHaveBeenCalledWith("<");
      expect(mockOnButtonClick).toHaveBeenCalledWith(">");
      expect(mockOnButtonClick).toHaveBeenCalledWith("<=");
      expect(mockOnButtonClick).toHaveBeenCalledWith(">=");
      expect(mockOnButtonClick).toHaveBeenCalledWith("==");
      expect(mockOnButtonClick).toHaveBeenCalledWith("!=");
    });

    it("should handle logical operators", () => {
      render(<Calculator onButtonClick={mockOnButtonClick} />);

      const logicalButtons = ["&", "|"];

      logicalButtons.forEach((operator) => {
        const button = screen.getByText(operator);
        fireEvent.click(button);
      });

      expect(mockOnButtonClick).toHaveBeenCalledTimes(logicalButtons.length);
      expect(mockOnButtonClick).toHaveBeenCalledWith("&");
      expect(mockOnButtonClick).toHaveBeenCalledWith("|");
    });
  });

  describe("ComputeVariablesTab Component", () => {
    const mockAvailableVariables = [
      {
        name: "Age",
        label: "Age",
        type: "NUMERIC" as const,
        columnIndex: 0,
        width: 8,
        decimals: 2,
        values: [],
        missing: null,
        columns: 1,
        align: "right" as const,
        measure: "scale" as const,
        role: "input" as const,
        tempId: "age-1",
      },
      {
        name: "Income",
        label: "Income",
        type: "NUMERIC" as const,
        columnIndex: 1,
        width: 8,
        decimals: 2,
        values: [],
        missing: null,
        columns: 1,
        align: "right" as const,
        measure: "scale" as const,
        role: "input" as const,
        tempId: "income-1",
      },
    ];

    const mockTargetVariable = {
      name: "Score",
      label: "Score",
      type: "NUMERIC" as const,
      columnIndex: 2,
      width: 8,
      decimals: 2,
      values: [],
      missing: null,
      columns: 1,
      align: "right" as const,
      measure: "scale" as const,
      role: "input" as const,
      tempId: "score-1",
    };

    const mockOnSelectVariable = jest.fn();
    const mockOnUnselectVariable = jest.fn();
    const mockSetHighlightedVariable = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should render ComputeVariablesTab correctly", () => {
      render(
        <ComputeVariablesTab
          availableVariables={mockAvailableVariables}
          targetVariable={mockTargetVariable}
          highlightedVariable={null}
          setHighlightedVariable={mockSetHighlightedVariable}
          onSelectVariable={mockOnSelectVariable}
          onUnselectVariable={mockOnUnselectVariable}
        />
      );

      expect(screen.getByTestId("variable-list-manager")).toBeInTheDocument();
      expect(screen.getByTestId("available-variables")).toBeInTheDocument();
      expect(screen.getByTestId("target-lists")).toBeInTheDocument();
    });

    it("should display available variables", () => {
      render(
        <ComputeVariablesTab
          availableVariables={mockAvailableVariables}
          targetVariable={mockTargetVariable}
          highlightedVariable={null}
          setHighlightedVariable={mockSetHighlightedVariable}
          onSelectVariable={mockOnSelectVariable}
          onUnselectVariable={mockOnUnselectVariable}
        />
      );

      expect(screen.getByTestId("available-age-1")).toBeInTheDocument();
      expect(screen.getByTestId("available-income-1")).toBeInTheDocument();
    });

    it("should display target variable", () => {
      render(
        <ComputeVariablesTab
          availableVariables={mockAvailableVariables}
          targetVariable={mockTargetVariable}
          highlightedVariable={null}
          setHighlightedVariable={mockSetHighlightedVariable}
          onSelectVariable={mockOnSelectVariable}
          onUnselectVariable={mockOnUnselectVariable}
        />
      );

      expect(screen.getByTestId("target-score-1")).toBeInTheDocument();
    });

    it("should handle empty target variable", () => {
      render(
        <ComputeVariablesTab
          availableVariables={mockAvailableVariables}
          targetVariable={null}
          highlightedVariable={null}
          setHighlightedVariable={mockSetHighlightedVariable}
          onSelectVariable={mockOnSelectVariable}
          onUnselectVariable={mockOnUnselectVariable}
        />
      );

      expect(screen.getByTestId("variable-list-manager")).toBeInTheDocument();
      expect(screen.queryByTestId("target-score-1")).not.toBeInTheDocument();
    });

    it("should handle highlighted variable", () => {
      render(
        <ComputeVariablesTab
          availableVariables={mockAvailableVariables}
          targetVariable={mockTargetVariable}
          highlightedVariable={{
            tempId: "age-1",
            source: "available",
          }}
          setHighlightedVariable={mockSetHighlightedVariable}
          onSelectVariable={mockOnSelectVariable}
          onUnselectVariable={mockOnUnselectVariable}
        />
      );

      expect(screen.getByTestId("variable-list-manager")).toBeInTheDocument();
    });
  });

  describe("ComputeVariable Integration Tests", () => {
    // it("should test basic integration", () => {
    //   expect(true).toBe(true);
    // });

    it("should test FunctionsList integration", () => {
      const mockOnFunctionSelect = jest.fn();
      render(<FunctionsList onFunctionSelect={mockOnFunctionSelect} />);

      expect(screen.getByText("abs")).toBeInTheDocument();
      expect(screen.getByText("mean")).toBeInTheDocument();
    });

    it("should test VariablesList integration", () => {
      const mockVariables = [
        {
          name: "Age",
          label: "Age",
          type: "NUMERIC" as const,
          columnIndex: 0,
          width: 8,
          decimals: 2,
          values: [],
          missing: null,
          columns: 1,
          align: "right" as const,
          measure: "scale" as const,
          role: "input" as const,
          tempId: "age-1",
        },
      ];

      const mockOnVariableClick = jest.fn();
      const mockOnDragStart = jest.fn();

      render(
        <VariablesList
          variables={mockVariables}
          onVariableClick={mockOnVariableClick}
          onDragStart={mockOnDragStart}
        />
      );

      expect(screen.getByText("Age [Age]")).toBeInTheDocument();
    });

    it("should test Calculator integration", () => {
      const mockOnButtonClick = jest.fn();
      render(<Calculator onButtonClick={mockOnButtonClick} />);

      expect(screen.getByText("+")).toBeInTheDocument();
      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("should test ComputeVariablesTab integration", () => {
      const mockAvailableVariables = [
        {
          name: "Age",
          label: "Age",
          type: "NUMERIC" as const,
          columnIndex: 0,
          width: 8,
          decimals: 2,
          values: [],
          missing: null,
          columns: 1,
          align: "right" as const,
          measure: "scale" as const,
          role: "input" as const,
          tempId: "age-1",
        },
      ];

      const mockOnSelectVariable = jest.fn();
      const mockOnUnselectVariable = jest.fn();
      const mockSetHighlightedVariable = jest.fn();

      render(
        <ComputeVariablesTab
          availableVariables={mockAvailableVariables}
          targetVariable={null}
          highlightedVariable={null}
          setHighlightedVariable={mockSetHighlightedVariable}
          onSelectVariable={mockOnSelectVariable}
          onUnselectVariable={mockOnUnselectVariable}
        />
      );

      expect(screen.getByTestId("variable-list-manager")).toBeInTheDocument();
    });
  });

  describe("ComputeVariable Edge Cases", () => {
    // it("should handle empty function list", () => {
    //   const mockOnFunctionSelect = jest.fn();
    //   render(<FunctionsList onFunctionSelect={mockOnFunctionSelect} />);

    //   // Test that functions are still available
    //   expect(screen.getByText("abs")).toBeInTheDocument();
    // });

    it("should handle empty variables list", () => {
      const mockOnVariableClick = jest.fn();
      const mockOnDragStart = jest.fn();

      render(
        <VariablesList
          variables={[]}
          onVariableClick={mockOnVariableClick}
          onDragStart={mockOnDragStart}
        />
      );

      expect(screen.getByText("Variables:")).toBeInTheDocument();
    });

    it("should handle calculator input", () => {
      const mockOnButtonClick = jest.fn();
      render(<Calculator onButtonClick={mockOnButtonClick} />);

      // Test that calculator handles all button clicks
      const buttons = ["+", "-", "*", "/", "0", "1", "Delete"];

      buttons.forEach((button) => {
        const buttonElement = screen.getByText(button);
        fireEvent.click(buttonElement);
      });

      expect(mockOnButtonClick).toHaveBeenCalledTimes(buttons.length);
    });

    it("should handle variable attributes", () => {
      const mockAvailableVariables = [
        {
          name: "Complex_Variable_123",
          label: "Complex Variable with Special Characters",
          type: "NUMERIC" as const,
          columnIndex: 0,
          width: 8,
          decimals: 2,
          values: [],
          missing: null,
          columns: 1,
          align: "right" as const,
          measure: "scale" as const,
          role: "input" as const,
          tempId: "complex-1",
        },
      ];

      const mockOnSelectVariable = jest.fn();
      const mockOnUnselectVariable = jest.fn();
      const mockSetHighlightedVariable = jest.fn();

      render(
        <ComputeVariablesTab
          availableVariables={mockAvailableVariables}
          targetVariable={null}
          highlightedVariable={null}
          setHighlightedVariable={mockSetHighlightedVariable}
          onSelectVariable={mockOnSelectVariable}
          onUnselectVariable={mockOnUnselectVariable}
        />
      );

      expect(screen.getByTestId("variable-list-manager")).toBeInTheDocument();
    });
  });

  describe("ComputeVariable Performance Tests", () => {
    it("should handle function selections", () => {
      const mockOnFunctionSelect = jest.fn();
      render(<FunctionsList onFunctionSelect={mockOnFunctionSelect} />);

      const functions = ["abs", "round", "sqrt", "mean", "log"];

      functions.forEach((func) => {
        const functionElement = screen.getByText(func);
        fireEvent.click(functionElement);
      });

      expect(mockOnFunctionSelect).toHaveBeenCalledTimes(functions.length);
    });

    it("should handle variable selections", () => {
      const mockVariables = Array.from({ length: 10 }, (_, i) => ({
        name: `Variable${i}`,
        label: `Variable ${i}`,
        type: "NUMERIC" as const,
        columnIndex: i,
        width: 8,
        decimals: 2,
        values: [],
        missing: null,
        columns: 1,
        align: "right" as const,
        measure: "scale" as const,
        role: "input" as const,
        tempId: `var-${i}`,
      }));

      const mockOnVariableClick = jest.fn();
      const mockOnDragStart = jest.fn();

      render(
        <VariablesList
          variables={mockVariables}
          onVariableClick={mockOnVariableClick}
          onDragStart={mockOnDragStart}
        />
      );

      // Test multiple variable clicks
      mockVariables.forEach((variable) => {
        const variableElement = screen.getByText(
          `${variable.name} [${variable.label}]`
        );
        fireEvent.click(variableElement);
      });

      expect(mockOnVariableClick).toHaveBeenCalledTimes(mockVariables.length);
    });

    it("should handle calculator button clicks", () => {
      const mockOnButtonClick = jest.fn();
      render(<Calculator onButtonClick={mockOnButtonClick} />);

      const buttons = ["1", "+", "2", "*", "3", "-", "4"];

      buttons.forEach((button) => {
        const buttonElement = screen.getByText(button);
        fireEvent.click(buttonElement);
      });

      expect(mockOnButtonClick).toHaveBeenCalledTimes(buttons.length);
    });

    it("should handle large variable lists", () => {
      const mockAvailableVariables = Array.from({ length: 1000 }, (_, i) => ({
        name: `Variable${i}`,
        label: `Variable ${i}`,
        type: "NUMERIC" as const,
        columnIndex: i,
        width: 8,
        decimals: 2,
        values: [],
        missing: null,
        columns: 1,
        align: "right" as const,
        measure: "scale" as const,
        role: "input" as const,
        tempId: `var-${i}`,
      }));

      const mockOnSelectVariable = jest.fn();
      const mockOnUnselectVariable = jest.fn();
      const mockSetHighlightedVariable = jest.fn();

      render(
        <ComputeVariablesTab
          availableVariables={mockAvailableVariables}
          targetVariable={null}
          highlightedVariable={null}
          setHighlightedVariable={mockSetHighlightedVariable}
          onSelectVariable={mockOnSelectVariable}
          onUnselectVariable={mockOnUnselectVariable}
        />
      );

      expect(screen.getByTestId("variable-list-manager")).toBeInTheDocument();
      expect(screen.getByText("Variable0")).toBeInTheDocument();
      expect(screen.getByText("Variable999")).toBeInTheDocument();
    });
  });

  describe("ComputeVariable Advanced Tests", () => {
    it("should test all function categories", () => {
      const mockOnFunctionSelect = jest.fn();
      render(<FunctionsList onFunctionSelect={mockOnFunctionSelect} />);

      // Test all function categories
      const allFunctions = [
        "abs",
        "round",
        "mod",
        "sqrt",
        "cbrt",
        "square",
        "cube", // Basic Math
        "exp",
        "log10",
        "ln",
        "log",
        "log2",
        "log1p", // Logarithmic
        "sum",
        "mean",
        "median",
        "stdp",
        "stds",
        "varp",
        "vars",
        "min",
        "max", // Statistical
        "colmean",
        "colmedian",
        "colmode",
        "colmin",
        "colmax", // Column Statistics
        "arcos",
        "arsin",
        "artan",
        "sin",
        "tan",
        "cos", // Trigonometric
      ];

      allFunctions.forEach((func) => {
        expect(screen.getByText(func)).toBeInTheDocument();
      });
    });

    it("should test all calculator operators", () => {
      const mockOnButtonClick = jest.fn();
      render(<Calculator onButtonClick={mockOnButtonClick} />);

      // Test all calculator operators
      const allOperators = [
        "+",
        "-",
        "*",
        "/",
        "^", // Arithmetic
        "<",
        ">",
        "<=",
        ">=",
        "==",
        "≠", // Comparison
        "&",
        "|",
        "~", // Logical
        "(",
        ")",
        ".", // Special
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9", // Numbers
        "Delete", // Control
      ];

      allOperators.forEach((operator) => {
        if (operator !== "≠") {
          // Skip the special character that gets converted
          expect(screen.getByText(operator)).toBeInTheDocument();
        }
      });
    });

    it("should test variable display formats", () => {
      const mockVariables = [
        {
          name: "SimpleVar",
          label: "",
          type: "NUMERIC" as const,
          columnIndex: 0,
          width: 8,
          decimals: 2,
          values: [],
          missing: null,
          columns: 1,
          align: "right" as const,
          measure: "scale" as const,
          role: "input" as const,
          tempId: "simple-1",
        },
        {
          name: "ComplexVar",
          label: "Complex Variable Label",
          type: "NUMERIC" as const,
          columnIndex: 1,
          width: 8,
          decimals: 2,
          values: [],
          missing: null,
          columns: 1,
          align: "right" as const,
          measure: "scale" as const,
          role: "input" as const,
          tempId: "complex-1",
        },
      ];

      const mockOnVariableClick = jest.fn();
      const mockOnDragStart = jest.fn();

      render(
        <VariablesList
          variables={mockVariables}
          onVariableClick={mockOnVariableClick}
          onDragStart={mockOnDragStart}
        />
      );

      expect(screen.getByText("SimpleVar")).toBeInTheDocument();
      expect(
        screen.getByText("ComplexVar [Complex Variable Label]")
      ).toBeInTheDocument();
    });
  });
});
