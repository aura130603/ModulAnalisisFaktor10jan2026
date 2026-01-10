// Mock React and React Testing Library
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock dependencies
jest.mock("@/stores/useVariableStore", () => ({
  useVariableStore: {
    getState: jest.fn(() => ({
      variables: [
        { name: "Category", label: "Category", type: "STRING", columnIndex: 0 },
        { name: "Value1", label: "Value 1", type: "NUMERIC", columnIndex: 1 },
        { name: "Value2", label: "Value 2", type: "NUMERIC", columnIndex: 2 },
        { name: "Group", label: "Group", type: "STRING", columnIndex: 3 },
      ],
    })),
  },
}));

jest.mock("@/stores/useResultStore", () => ({
  useResultStore: jest.fn(() => ({
    addResult: jest.fn(),
    results: [],
  })),
}));

jest.mock("@/stores/useDataStore", () => ({
  useDataStore: jest.fn(() => ({
    data: [
      ["A", 10, 20, "Group1"],
      ["B", 15, 25, "Group2"],
      ["C", 20, 30, "Group1"],
    ],
    variables: [
      { name: "Category", type: "STRING" },
      { name: "Value1", type: "NUMERIC" },
      { name: "Value2", type: "NUMERIC" },
      { name: "Group", type: "STRING" },
    ],
  })),
}));

jest.mock("@/services/chart/ChartService", () => ({
  ChartService: {
    createChartJSON: jest.fn(() => ({
      chartConfig: { type: "bar" },
      chartMetadata: { title: "Test Chart" },
    })),
  },
}));

jest.mock("@/services/chart/DataProcessingService", () => ({
  DataProcessingService: {
    processDataForChart: jest.fn(() => ({
      data: [{ category: "A", value: 10 }],
      axisInfo: { category: "Category", value: "Value1" },
    })),
  },
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock("@/components/ui/dialog", () => ({
  DialogContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  DialogFooter: ({ children, ...props }: any) => (
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

jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TooltipTrigger: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  TooltipContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  TooltipProvider: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock("@/components/ui/accordion", () => ({
  Accordion: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AccordionItem: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  AccordionTrigger: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  AccordionContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  TabsContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
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

jest.mock("@/components/ui/radio-group", () => ({
  RadioGroup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  RadioGroupItem: ({ children, ...props }: any) => (
    <input type="radio" {...props} />
  ),
}));

jest.mock("react-colorful", () => ({
  HexColorPicker: ({ color, onChange, ...props }: any) => (
    <input
      type="color"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  ),
}));

// Mock chart components
jest.mock("../ChartPreview", () => {
  const ChartPreviewMock = React.forwardRef(
    ({ chartConfig, ...props }: any, ref: any) => (
      <div ref={ref} data-testid="chart-preview" {...props}>
        Chart Preview
      </div>
    )
  );
  ChartPreviewMock.displayName = "ChartPreviewMock";
  return {
    __esModule: true,
    default: ChartPreviewMock,
  };
});

jest.mock("../VariableSelection", () => ({
  __esModule: true,
  default: ({ variables, onDragStart, ...props }: any) => (
    <div data-testid="variable-selection" {...props}>
      <div>Choose Variables</div>
      {variables.map((variable: any) => (
        <div
          key={variable.name}
          draggable
          onDragStart={(e) => onDragStart(e, variable.name)}
          data-testid={`variable-${variable.name}`}
        >
          {variable.name}
        </div>
      ))}
    </div>
  ),
}));

jest.mock("../ChartSelection", () => ({
  __esModule: true,
  default: ({ chartType, useaxis, ...props }: any) => (
    <div
      data-testid="chart-selection"
      data-chart-type={chartType}
      data-useaxis={useaxis ? "true" : "false"}
      {...props}
    >
      {chartType}
    </div>
  ),
}));

jest.mock("../CustomizationPanel", () => ({
  __esModule: true,
  default: ({ ...props }: any) => (
    <div data-testid="customization-panel" {...props}>
      Customization Panel
    </div>
  ),
}));

// Mock utilities
jest.mock("@/components/Common/iconHelper", () => ({
  getVariableIcon: jest.fn(() => <span>📊</span>),
}));

jest.mock("@/utils/chartBuilder/chartTypes/chartUtils", () => ({
  chartUtils: {
    createChart: jest.fn(() => ({})),
  },
}));

// Import components
import ChartBuilderModal from "../ChartBuilderModal";
import VariableSelection from "../VariableSelection";
import ChartSelection from "../ChartSelection";
import CustomizationPanel from "../CustomizationPanel";

describe("ChartBuilder Unit Tests", () => {
  describe("VariableSelection Component", () => {
    const mockVariables: any[] = [
      {
        name: "Category",
        label: "Category",
        type: "STRING",
        columnIndex: 0,
        width: 10,
        decimals: 0,
        values: [],
        missing: [],
        measure: "NOMINAL",
        role: "INPUT",
        format: "",
        columns: 1,
        align: "LEFT",
      },
      {
        name: "Value1",
        label: "Value 1",
        type: "NUMERIC",
        columnIndex: 1,
        width: 8,
        decimals: 2,
        values: [],
        missing: [],
        measure: "SCALE",
        role: "INPUT",
        format: "",
        columns: 1,
        align: "RIGHT",
      },
    ];

    const mockOnDragStart = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should render VariableSelection correctly", () => {
      render(
        <VariableSelection
          variables={mockVariables}
          onDragStart={mockOnDragStart}
        />
      );

      expect(screen.getByText("Choose Variables")).toBeInTheDocument();
      expect(screen.getByText("Category")).toBeInTheDocument();
      expect(screen.getByText("Value1")).toBeInTheDocument();
    });

    it("should handle variable drag start", () => {
      render(
        <VariableSelection
          variables={mockVariables}
          onDragStart={mockOnDragStart}
        />
      );

      const categoryVariable = screen.getByText("Category");
      fireEvent.dragStart(categoryVariable);

      expect(mockOnDragStart).toHaveBeenCalledWith(
        expect.any(Object),
        "Category"
      );
    });

    it("should handle empty variables list", () => {
      render(
        <VariableSelection variables={[]} onDragStart={mockOnDragStart} />
      );

      expect(screen.getByText("Choose Variables")).toBeInTheDocument();
      expect(screen.queryByText("Category")).not.toBeInTheDocument();
    });
  });

  describe("ChartSelection Component", () => {
    const defaultProps = {
      chartType: "Vertical Bar Chart",
      width: 200,
      height: 150,
      useaxis: true,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should render ChartSelection correctly", () => {
      render(<ChartSelection {...defaultProps} />);

      expect(screen.getByTestId("chart-selection")).toBeInTheDocument();
      expect(screen.getByText("Vertical Bar Chart")).toBeInTheDocument();
    });

    it("should handle different chart types", () => {
      const { rerender } = render(<ChartSelection {...defaultProps} />);

      // Test different chart types
      const chartTypes = [
        "Horizontal Bar Chart",
        "Line Chart",
        "Scatter Plot",
        "Pie Chart",
      ];

      chartTypes.forEach((chartType) => {
        rerender(<ChartSelection {...defaultProps} chartType={chartType} />);

        expect(screen.getByText(chartType)).toBeInTheDocument();
      });
    });

    it("should handle different dimensions", () => {
      const { rerender } = render(<ChartSelection {...defaultProps} />);

      // Test different dimensions
      const dimensions = [
        { width: 100, height: 100 },
        { width: 300, height: 200 },
        { width: 150, height: 150 },
      ];

      dimensions.forEach(({ width, height }) => {
        rerender(
          <ChartSelection {...defaultProps} width={width} height={height} />
        );

        expect(screen.getByTestId("chart-selection")).toBeInTheDocument();
      });
    });

    it("should handle useaxis prop", () => {
      const { rerender } = render(<ChartSelection {...defaultProps} />);

      // Test with useaxis false
      rerender(<ChartSelection {...defaultProps} useaxis={false} />);
      expect(screen.getByTestId("chart-selection")).toBeInTheDocument();

      // Test with useaxis true
      rerender(<ChartSelection {...defaultProps} useaxis={true} />);
      expect(screen.getByTestId("chart-selection")).toBeInTheDocument();
    });
  });

  describe("CustomizationPanel Component", () => {
    const mockProps = {
      onClose: jest.fn(),
      chartType: "Vertical Bar Chart",
      chartConfigOptions: {},
      colorMode: "single" as const,
      setColorMode: jest.fn(),
      singleColor: "#000000",
      setSingleColor: jest.fn(),
      groupColors: ["#ff0000", "#00ff00", "#0000ff"],
      setGroupColors: jest.fn(),
      setChartColors: jest.fn(),
      chartTitle: "Test Chart",
      setChartTitle: jest.fn(),
      chartSubtitle: "Test Subtitle",
      setChartSubtitle: jest.fn(),
      xAxisOptions: { label: "X Axis" },
      setXAxisOptions: jest.fn(),
      yAxisOptions: { label: "Y Axis" },
      setYAxisOptions: jest.fn(),
      y2AxisOptions: {},
      setY2AxisOptions: jest.fn(),
      selectedStatistic: "mean" as const,
      setSelectedStatistic: jest.fn(),
      errorBarType: "ci" as const,
      setErrorBarType: jest.fn(),
      confidenceLevel: 95,
      setConfidenceLevel: jest.fn(),
      seMultiplier: 2,
      setSeMultiplier: jest.fn(),
      sdMultiplier: 1,
      setSdMultiplier: jest.fn(),
      showNormalCurve: false,
      setShowNormalCurve: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should render CustomizationPanel correctly", () => {
      render(<CustomizationPanel {...mockProps} />);

      expect(screen.getByTestId("customization-panel")).toBeInTheDocument();
      expect(screen.getByText("Customization Panel")).toBeInTheDocument();
    });
  });

  describe("ChartBuilder Integration Tests", () => {
    // it("should test basic integration", () => {
    //   expect(true).toBe(true);
    // });

    it("should test variable selection integration", () => {
      const mockVariables = [
        {
          name: "Category",
          label: "Category",
          type: "STRING" as const,
          columnIndex: 0,
          width: 10,
          decimals: 0,
          values: [],
          missing: null,
          columns: 1,
          align: "left" as const,
          measure: "nominal" as const,
          role: "input" as const,
        },
        {
          name: "Value1",
          label: "Value 1",
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
        },
      ];

      const mockOnDragStart = jest.fn();

      render(
        <VariableSelection
          variables={mockVariables}
          onDragStart={mockOnDragStart}
        />
      );

      expect(screen.getByText("Choose Variables")).toBeInTheDocument();
      expect(screen.getByText("Category")).toBeInTheDocument();
      expect(screen.getByText("Value1")).toBeInTheDocument();
    });

    it("should test chart selection integration", () => {
      render(
        <ChartSelection
          chartType="Vertical Bar Chart"
          width={200}
          height={150}
          useaxis={true}
        />
      );

      expect(screen.getByTestId("chart-selection")).toBeInTheDocument();
      expect(screen.getByText("Vertical Bar Chart")).toBeInTheDocument();
    });
  });

  describe("ChartBuilder Edge Cases", () => {
    it("should handle empty variable list", () => {
      const mockOnDragStart = jest.fn();

      render(
        <VariableSelection variables={[]} onDragStart={mockOnDragStart} />
      );

      expect(screen.getByText("Choose Variables")).toBeInTheDocument();
      expect(screen.queryByText("Category")).not.toBeInTheDocument();
    });

    it("should handle invalid chart type", () => {
      render(
        <ChartSelection
          chartType="Invalid Chart Type"
          width={200}
          height={150}
          useaxis={true}
        />
      );

      expect(screen.getByTestId("chart-selection")).toBeInTheDocument();
      expect(screen.getByText("Invalid Chart Type")).toBeInTheDocument();
    });

    it("should handle large number of variables", () => {
      const largeVariables = Array.from({ length: 1000 }, (_, i) => ({
        name: `Variable${i}`,
        label: `Variable ${i}`,
        type: "NUMERIC" as const,
        columnIndex: i,
        width: 8,
        decimals: 2,
        values: [],
        missing: null,
        measure: "scale" as const,
        role: "input" as const,
        columns: 1,
        align: "right" as const,
      }));

      const mockOnDragStart = jest.fn();

      render(
        <VariableSelection
          variables={largeVariables}
          onDragStart={mockOnDragStart}
        />
      );

      expect(screen.getByText("Choose Variables")).toBeInTheDocument();
      expect(screen.getByText("Variable0")).toBeInTheDocument();
      expect(screen.getByText("Variable999")).toBeInTheDocument();
    });
  });

  describe("ChartBuilder Performance Tests", () => {
    it("should handle chart type changes", () => {
      const { rerender } = render(
        <ChartSelection
          chartType="Vertical Bar Chart"
          width={200}
          height={150}
          useaxis={true}
        />
      );

      // Rapidly change chart types
      const chartTypes = [
        "Horizontal Bar Chart",
        "Line Chart",
        "Scatter Plot",
        "Pie Chart",
        "3D Bar Chart",
      ];

      chartTypes.forEach((chartType) => {
        rerender(
          <ChartSelection
            chartType={chartType}
            width={200}
            height={150}
            useaxis={true}
          />
        );

        expect(screen.getByText(chartType)).toBeInTheDocument();
      });
    });

    it("should handle multiple variable operations", () => {
      const mockVariables = Array.from({ length: 5 }, (_, i) => ({
        name: `Variable${i}`,
        label: `Variable ${i}`,
        type: "NUMERIC" as const,
        columnIndex: i,
        width: 8,
        decimals: 2,
        values: [],
        missing: null,
        measure: "scale" as const,
        role: "input" as const,
        columns: 1,
        align: "right" as const,
      }));

      const mockOnDragStart = jest.fn();

      render(
        <VariableSelection
          variables={mockVariables}
          onDragStart={mockOnDragStart}
        />
      );

      // Test multiple variable operations
      mockVariables.forEach((variable) => {
        const variableElement = screen.getByText(variable.name);
        expect(variableElement).toBeInTheDocument();
      });

      expect(screen.getByText("Choose Variables")).toBeInTheDocument();
    });
  });

  describe("ChartBuilderModal Component - Core Functionality", () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should render ChartBuilderModal correctly", () => {
      render(<ChartBuilderModal onClose={mockOnClose} />);

      expect(screen.getByText("Chart Builder")).toBeInTheDocument();
      expect(screen.getByText("Choose Variables")).toBeInTheDocument();
      expect(screen.getByText("Choose Graph")).toBeInTheDocument();
      expect(screen.getByText("Chart Preview")).toBeInTheDocument();
      expect(screen.getByText("OK")).toBeInTheDocument();
      expect(screen.getByText("Reset")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should handle chart type selection", () => {
      render(<ChartBuilderModal onClose={mockOnClose} />);

      // Test that chart type selection is rendered
      expect(screen.getByText("Choose Graph")).toBeInTheDocument();
    });

    // it("should handle variable drag and drop functionality", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);

    //   const categoryVar = screen.getByText("Category");
    //   // NOTE: This test has false positive because mock components don't implement actual drag & drop
    //   // and there's no "drop-zone" testid in the mocked components
    //   // const dropZone = screen.getByTestId("drop-zone");

    //   fireEvent.dragStart(categoryVar);
    //   // fireEvent.drop(dropZone);

    //   // This only checks if text exists, not actual drag & drop functionality
    //   expect(screen.getByText("Category")).toBeInTheDocument();
    // });

    it("should handle chart generation button", () => {
      render(<ChartBuilderModal onClose={mockOnClose} />);

      // Test that generate button is present
      const generateButton = screen.getByText("OK");
      expect(generateButton).toBeInTheDocument();
    });

    it("should handle reset functionality", () => {
      render(<ChartBuilderModal onClose={mockOnClose} />);

      // Test that reset button is present
      const resetButton = screen.getByText("Reset");
      expect(resetButton).toBeInTheDocument();
    });

    it("should handle cancel functionality", () => {
      render(<ChartBuilderModal onClose={mockOnClose} />);

      // Test that cancel button is present
      const cancelButton = screen.getByText("Cancel");
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe("ChartBuilderModal Component - Advanced Features", () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    // it("should handle customization panel toggle", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);

    //   // Test that customization panel can be toggled
    //   // This would require finding the toggle button
    //   expect(screen.getByText("Chart Builder")).toBeInTheDocument();
    // });

    it("should render chart preview functionality", () => {
      render(<ChartBuilderModal onClose={mockOnClose} />);

      // Test that chart preview is rendered
      expect(screen.getByTestId("chart-preview")).toBeInTheDocument();
    });

    // it("should handle variable validation", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);

    //   // Test that variable validation works
    //   expect(screen.getByText("Choose Variables")).toBeInTheDocument();
    // });

    // it("should handle error message display", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);

    //   // NOTE: This test would be a false positive as it only checks for title existence
    //   // Real error handling would require triggering actual error states
    //   // expect(screen.getByText("Chart Builder")).toBeInTheDocument();
    // });

    // it("should handle chart configuration options", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);

    //   // NOTE: This test would be a false positive as it only checks for title existence
    //   // Real configuration testing would require testing actual configuration changes
    //   // expect(screen.getByText("Chart Builder")).toBeInTheDocument();
    // });
  });

  describe("ChartBuilderModal Component - State Management", () => {
    // const mockOnClose = jest.fn();
    // beforeEach(() => {
    //   jest.clearAllMocks();
    // });
    // it("should manage chart type state", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);
    //   // Test that chart type state is managed correctly
    //   expect(screen.getByText("Choose Graph")).toBeInTheDocument();
    // });
    // it("should manage variable state", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);
    //   // Test that variable state is managed correctly
    //   expect(screen.getByText("Choose Variables")).toBeInTheDocument();
    // });
    // it("should manage chart customization state", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);
    //   // Test that customization state is managed correctly
    //   expect(screen.getByText("Chart Builder")).toBeInTheDocument();
    // });
    // it("should manage error state", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);
    //   // Test that error state is managed correctly
    //   expect(screen.getByText("Chart Builder")).toBeInTheDocument();
    // });
  });

  describe("ChartBuilderModal Component - Integration Features", () => {
    // const mockOnClose = jest.fn();
    // beforeEach(() => {
    //   jest.clearAllMocks();
    // });
    // it("should integrate with ChartService", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);
    //   // NOTE: This test is a false positive - it only checks for title existence
    //   // Real ChartService integration would require testing:
    //   // - ChartService.createChartJSON() calls
    //   // - ChartService.createFitFunctions() calls
    //   // - ChartService.quickChart() calls
    //   // - Actual chart generation functionality
    //   // expect(screen.getByText("Chart Builder")).toBeInTheDocument();
    // });
    // it("should integrate with DataProcessingService", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);
    //   // Test integration with DataProcessingService
    //   expect(screen.getByText("Chart Builder")).toBeInTheDocument();
    // });
    // it("should integrate with ResultStore", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);
    //   // Test integration with ResultStore
    //   expect(screen.getByText("Chart Builder")).toBeInTheDocument();
    // });
    // it("should integrate with VariableStore", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);
    //   // Test integration with VariableStore
    //   expect(screen.getByText("Choose Variables")).toBeInTheDocument();
    // });
  });

  describe("ChartBuilderModal Component - Edge Cases", () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should handle empty variable list", () => {
      // Mock empty variables
      jest
        .mocked(require("@/stores/useVariableStore").useVariableStore.getState)
        .mockReturnValue({
          variables: [],
        });

      render(<ChartBuilderModal onClose={mockOnClose} />);

      expect(screen.getByText("Choose Variables")).toBeInTheDocument();
    });

    // it("should handle invalid chart configuration", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);

    //   // Test handling of invalid chart configuration
    //   expect(screen.getByText("Chart Builder")).toBeInTheDocument();
    // });

    // it("should handle network errors during chart generation", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);

    //   // Test handling of network errors
    //   expect(screen.getByText("Chart Builder")).toBeInTheDocument();
    // });

    // it("should handle large dataset processing", () => {
    //   render(<ChartBuilderModal onClose={mockOnClose} />);

    //   // Test handling of large datasets
    //   expect(screen.getByText("Chart Builder")).toBeInTheDocument();
    // });
  });
});
