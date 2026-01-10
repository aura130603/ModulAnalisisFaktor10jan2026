/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useAnalyzeHook } from '@/components/Modals/Analyze/TimeSeries/UnitRootTest/hooks/analyzeHook';
import { Variable } from '@/types/Variable';

const createMockVar = (type: "NUMERIC" | "STRING" = "NUMERIC"): Variable => ({
    id: 1,
    name: "Test Var",
    columnIndex: 0,
    type,
    width: 8,
    decimals: 2,
    label: "",
    values: [],
    missing: null,
    columns: 10,
    align: "right",
    measure: "scale",
    role: "input",
});

const periodNotDated = ["0", "Not Dated"];
const periodMonthly = ["12", "Years-Months"];
const periodYearly = ["0", "Years"];
const periodWorkingDay = ["5", "Weeks-Work Days(5)"];

const dataEmpty: any[][] = [];
const dataBelow20Obs = Array.from({ length: 5 }, () => [3]);
const data25Obs = Array.from({ length: 25 }, () => [3]);
const data49Obs = Array.from({ length: 49 }, () => [3]);

const runAnalyzeError = async (
    variables: Variable[],
    data: any[][],
    selectedMethod: string[],
    selectedEquation: string[],
    selectedDifference: string[],
    lagLength: number
) => {
    const { result } = renderHook(() =>
        useAnalyzeHook(variables, data, selectedMethod, selectedEquation, selectedDifference, lagLength, jest.fn())
    );
    await act(async () => {
        await result.current.handleAnalyzes();
    });
    return result;
};

describe("useAnalyzeHook - Error Cases", () => {
    it("TCU01: Returns error if selected variable is empty", async () => {
        const result = await runAnalyzeError([], data25Obs, ["dickey-fuller", ""], ["no_trend", ""], ["level", ""], 1);
        expect(result.current.errorMsg).toBe("Please select at least one variable.");
    });

    it("TCU02: Returns error if selected variable is not numeric", async () => {
        const result = await runAnalyzeError([createMockVar("STRING")], data25Obs, ["dickey-fuller", ""], ["no_trend", ""], ["level", ""], 1);
        expect(result.current.errorMsg).toBe("Selected variable is not numeric");
    });

    it("TCU03: Returns error if selected variable data is empty", async () => {
        const result = await runAnalyzeError([createMockVar()], [dataEmpty], ["dickey-fuller", ""], ["no_trend", ""], ["level", ""], 1);
        expect(result.current.errorMsg).toBe("No data available for the selected variable.");
    });

    it("TCU04: Returns error if data observations are less than 20", async () => {
        const result = await runAnalyzeError([createMockVar()], dataBelow20Obs, ["dickey-fuller", ""], ["no_trend", ""], ["level", ""], 1);
        expect(result.current.errorMsg).toBe("Data length is less than 20 observations.");
    });

    it("TCU14: Returns error if lag length is out of range", async () => {
        const result = await runAnalyzeError([createMockVar()], data25Obs, ["dickey-fuller", ""], ["no_trend", ""], ["level", ""], 11);
        expect(result.current.errorMsg).toBe("Lag length must be between 1 and 10.");
    });
});

const mockAddStatistic = jest.fn();
const mockHandleUnitRootTest = jest.fn();

jest.mock('@/stores/useResultStore', () => ({
    useResultStore: () => ({
        addLog: jest.fn(() => Promise.resolve(1)),
        addAnalytic: jest.fn(() => Promise.resolve(1)),
        addStatistic: mockAddStatistic,
    }),
}));

jest.mock('@/components/Modals/Analyze/TimeSeries/UnitRootTest/analyze/analyze', () => ({
    handleUnitRootTest: (...args: any[]) => mockHandleUnitRootTest(...args),
}));

const assertDescriptionStatistic = (expectedRows: { rowHeader: string[]; description: string }[]) => {
    const call = mockAddStatistic.mock.calls.find(
        ([, stat]) => stat?.title === "Description Table"
    );
    expect(call).toBeDefined();
    const parsed = JSON.parse(call[1].output_data); // perbaikan di sini
    const rows = parsed.tables[0].rows;
    expectedRows.forEach((expectedRow) => {
        expect(rows).toContainEqual(expectedRow);
    });
};

describe("useAnalyzeHook - Success Case", () => {
    beforeEach(() => {
        mockAddStatistic.mockClear();
        mockHandleUnitRootTest.mockImplementation((
            _dataValues,
            name,
            method,
            lag,
            equation,
            difference
        ) => {
            const methodName = method === "dickey-fuller" ? "Dickey-Fuller" : "Augmented Dickey-Fuller";
            const lagUsed = method === "dickey-fuller" ? 0 : lag;
            const mockDescription = JSON.stringify({
                tables: [
                    {
                        title: "Description Table",
                        columnHeaders: [{ header: "" }, { header: "description" }],
                        rows: [
                            { rowHeader: ["Name Method"], description: methodName },
                            { rowHeader: ["Series Name"], description: name },
                            { rowHeader: ["Equation"], description: equation },
                            { rowHeader: ["Number of Lags"], description: lagUsed.toString() },
                            { rowHeader: ["Differencing"], description: difference },
                            { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                            { rowHeader: ["Observations"], description: "25" },
                            { rowHeader: ["Number Observations After Computing"], description: "20" },
                        ],
                    },
                ],
            });
            return Promise.resolve([
                "success", mockDescription, [], "df_stat", "coef_stat", "sel_crit", methodName,
            ]);
        });
    });


    const successCases = [
        {
            id: "TCU05",
            method: "dickey-fuller",
            methodLabel: "Dickey-Fuller",
            equation: "no_constant",
            equationLabel: "No Constant",
            difference: "level",
            differenceLabel: "level",
            lag: 1,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_constant" },
                { rowHeader: ["Number of Lags"], description: "0" },
                { rowHeader: ["Differencing"], description: "level" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU06",
            method: "dickey-fuller",
            methodLabel: "Dickey-Fuller",
            equation: "no_trend",
            equationLabel: "No Trend",
            difference: "level",
            differenceLabel: "level",
            lag: 1,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_trend" },
                { rowHeader: ["Number of Lags"], description: "0" },
                { rowHeader: ["Differencing"], description: "level" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU07",
            method: "dickey-fuller",
            methodLabel: "Dickey-Fuller",
            equation: "with_trend",
            equationLabel: "With Trend",
            difference: "level",
            differenceLabel: "level",
            lag: 1,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "with_trend" },
                { rowHeader: ["Number of Lags"], description: "0" },
                { rowHeader: ["Differencing"], description: "level" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU08",
            method: "dickey-fuller",
            methodLabel: "Dickey-Fuller",
            equation: "no_constant",
            equationLabel: "No Constant",
            difference: "first-difference",
            differenceLabel: "first-difference",
            lag: 1,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_constant" },
                { rowHeader: ["Number of Lags"], description: "0" },
                { rowHeader: ["Differencing"], description: "first-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU09",
            method: "dickey-fuller",
            methodLabel: "Dickey-Fuller",
            equation: "no_trend",
            equationLabel: "No Trend",
            difference: "first-difference",
            differenceLabel: "first-difference",
            lag: 1,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_trend" },
                { rowHeader: ["Number of Lags"], description: "0" },
                { rowHeader: ["Differencing"], description: "first-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU10",
            method: "dickey-fuller",
            methodLabel: "Dickey-Fuller",
            equation: "with_trend",
            equationLabel: "With Trend",
            difference: "first-difference",
            differenceLabel: "first-difference",
            lag: 1,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "with_trend" },
                { rowHeader: ["Number of Lags"], description: "0" },
                { rowHeader: ["Differencing"], description: "first-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU11",
            method: "dickey-fuller",
            methodLabel: "Dickey-Fuller",
            equation: "no_constant",
            equationLabel: "No Constant",
            difference: "second-difference",
            differenceLabel: "second-difference",
            lag: 1,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_constant" },
                { rowHeader: ["Number of Lags"], description: "0" },
                { rowHeader: ["Differencing"], description: "second-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU12",
            method: "dickey-fuller",
            methodLabel: "Dickey-Fuller",
            equation: "no_trend",
            equationLabel: "No Trend",
            difference: "second-difference",
            differenceLabel: "second-difference",
            lag: 1,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_trend" },
                { rowHeader: ["Number of Lags"], description: "0" },
                { rowHeader: ["Differencing"], description: "second-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU13",
            method: "dickey-fuller",
            methodLabel: "Dickey-Fuller",
            equation: "with_trend",
            equationLabel: "With Trend",
            difference: "second-difference",
            differenceLabel: "second-difference",
            lag: 1,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "with_trend" },
                { rowHeader: ["Number of Lags"], description: "0" },
                { rowHeader: ["Differencing"], description: "second-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU15",
            method: "augmented-dickey-fuller",
            methodLabel: "Augmented Dickey-Fuller",
            equation: "no_constant",
            equationLabel: "No Constant",
            difference: "level",
            differenceLabel: "level",
            lag: 3,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Augmented Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_constant" },
                { rowHeader: ["Number of Lags"], description: "3" },
                { rowHeader: ["Differencing"], description: "level" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU16",
            method: "augmented-dickey-fuller",
            methodLabel: "Augmented Dickey-Fuller",
            equation: "no_trend",
            equationLabel: "No Trend",
            difference: "level",
            differenceLabel: "level",
            lag: 3,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Augmented Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_trend" },
                { rowHeader: ["Number of Lags"], description: "3" },
                { rowHeader: ["Differencing"], description: "level" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU17",
            method: "augmented-dickey-fuller",
            methodLabel: "Augmented Dickey-Fuller",
            equation: "with_trend",
            equationLabel: "With Trend",
            difference: "level",
            differenceLabel: "level",
            lag: 3,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Augmented Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "with_trend" },
                { rowHeader: ["Number of Lags"], description: "3" },
                { rowHeader: ["Differencing"], description: "level" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU18",
            method: "augmented-dickey-fuller",
            methodLabel: "Augmented Dickey-Fuller",
            equation: "no_constant",
            equationLabel: "No Constant",
            difference: "first-difference",
            differenceLabel: "first-difference",
            lag: 3,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Augmented Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_constant" },
                { rowHeader: ["Number of Lags"], description: "3" },
                { rowHeader: ["Differencing"], description: "first-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU19",
            method: "augmented-dickey-fuller",
            methodLabel: "Augmented Dickey-Fuller",
            equation: "no_trend",
            equationLabel: "No Trend",
            difference: "first-difference",
            differenceLabel: "first-difference",
            lag: 3,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Augmented Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_trend" },
                { rowHeader: ["Number of Lags"], description: "3" },
                { rowHeader: ["Differencing"], description: "first-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU20",
            method: "augmented-dickey-fuller",
            methodLabel: "Augmented Dickey-Fuller",
            equation: "with_trend",
            equationLabel: "With Trend",
            difference: "first-difference",
            differenceLabel: "first-difference",
            lag: 3,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Augmented Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "with_trend" },
                { rowHeader: ["Number of Lags"], description: "3" },
                { rowHeader: ["Differencing"], description: "first-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU21",
            method: "augmented-dickey-fuller",
            methodLabel: "Augmented Dickey-Fuller",
            equation: "no_constant",
            equationLabel: "No Constant",
            difference: "second-difference",
            differenceLabel: "second-difference",
            lag: 3,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Augmented Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_constant" },
                { rowHeader: ["Number of Lags"], description: "3" },
                { rowHeader: ["Differencing"], description: "second-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU22",
            method: "augmented-dickey-fuller",
            methodLabel: "Augmented Dickey-Fuller",
            equation: "no_trend",
            equationLabel: "No Trend",
            difference: "second-difference",
            differenceLabel: "second-difference",
            lag: 3,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Augmented Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "no_trend" },
                { rowHeader: ["Number of Lags"], description: "3" },
                { rowHeader: ["Differencing"], description: "second-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
        {
            id: "TCU23",
            method: "augmented-dickey-fuller",
            methodLabel: "Augmented Dickey-Fuller",
            equation: "with_trend",
            equationLabel: "With Trend",
            difference: "second-difference",
            differenceLabel: "second-difference",
            lag: 3,
            expectedRows: [
                { rowHeader: ["Name Method"], description: "Augmented Dickey-Fuller" },
                { rowHeader: ["Series Name"], description: "Test Var" },
                { rowHeader: ["Equation"], description: "with_trend" },
                { rowHeader: ["Number of Lags"], description: "3" },
                { rowHeader: ["Differencing"], description: "second-difference" },
                { rowHeader: ["Probability Value"], description: "Use MacKinnon (1996) one-sided p-values" },
                { rowHeader: ["Observations"], description: "25" },
                { rowHeader: ["Number Observations After Computing"], description: "20" },
            ],
        },
    ];

    successCases.forEach(
        ({
            id,
            method,
            methodLabel,
            equation,
            equationLabel,
            difference,
            differenceLabel,
            lag,
            expectedRows,
        }) => {
            it(`${id}: returns correct output for ${methodLabel} (${differenceLabel}, ${equationLabel})`, async () => {
                const { result } = renderHook(() =>
                    useAnalyzeHook(
                        [createMockVar()],
                        data25Obs,
                        [method, methodLabel],
                        [equation, equationLabel],
                        [difference, differenceLabel],
                        lag,
                        jest.fn()
                    )
                );
                await act(async () => {
                    await result.current.handleAnalyzes();
                });
                expect(result.current.errorMsg).toBe(null);
                assertDescriptionStatistic(expectedRows);
            });
        }
    );
});
