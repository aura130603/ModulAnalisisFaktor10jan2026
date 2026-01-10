/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useAnalyzeHook } from '@/components/Modals/Analyze/TimeSeries/Smoothing/hooks/analyzeHook';
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
const dataEmpty: any[][] = [];
const dataBelow20Obs = Array.from({ length: 5 }, () => [3]);
const data25Obs = Array.from({ length: 25 }, () => [3]);

const runAnalyzeError = async (selectedMethod: string[], parameters: number[], period: string[], 
    storeVariables: Variable[], data: any[][]) => {
    const { result } = renderHook(() =>
        useAnalyzeHook(
            selectedMethod,
            parameters,
            period,
            storeVariables,
            data,
            false,
            jest.fn()
        )
    );
    await act(async () => {
        await result.current.handleAnalyzes();
    });
    return result;
};

describe("useAnalyzeHook - Error Cases", () => {
    it("TCS01: Returns error if selected variable is empty", async () => {
        const result = await runAnalyzeError(["sma"], [3], periodMonthly, [], dataEmpty);
        expect(result.current.errorMsg).toBe(`Please select at least one variable.`);
    });

    it("TCS02: Returns error if selected variable is not numeric", async () => {
        const result = await runAnalyzeError(["sma"], [3], periodMonthly, [createMockVar("STRING")], dataBelow20Obs);
        expect(result.current.errorMsg).toBe(`Selected variable is not numeric.`);
    });

    it("TCS03: Returns error if selected variable data is empty", async () => {
        const result = await runAnalyzeError(["sma"], [3], periodMonthly, [createMockVar()], dataEmpty);
        expect(result.current.errorMsg).toBe(`No data available for the selected variables.`);
    });

    it("TCS04: Returns error if data observations are less than 20", async () => {
        const result = await runAnalyzeError(["sma"], [3], periodMonthly, [createMockVar()], dataBelow20Obs);
        expect(result.current.errorMsg).toBe(`Data length must be at least 20 observations.`);
    });

    it("TCS05: Returns an error value if the simple moving average parameter is out of range.", async () => {
        const result = await runAnalyzeError(["sma"], [12], periodMonthly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Simple Moving Average period must be between 2 and 11.`);
    });

    it("TCS06: Returns an error value if simple moving average is used without configuring the time settings", async () => {
        const result = await runAnalyzeError(["sma"], [3], periodNotDated, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Please select another time specification.`);
    });

    it("TCS08: Returns an error value if the double moving average parameter is out of range.", async () => {
        const result = await runAnalyzeError(["dma"], [12], periodMonthly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Double Moving Average period must be between 2 and 11.`);
    });

    it("TCS09: Returns error if observations are less than 3 × double moving average parameter", async () => {
        const result = await runAnalyzeError(["dma"], [9], periodMonthly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Data length is too short for distance 9 Double Moving Average.`);
    });

    it("TCS10: Returns an error value if double moving average is used without configuring the time settings", async () => {
        const result = await runAnalyzeError(["dma"], [3], periodNotDated, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Please select another time specification.`);
    });

    it("TCS12: Returns an error value if the simple exponential smoothing parameter is out of range.", async () => {
        const result = await runAnalyzeError(["ses"], [1.5], periodMonthly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Simple Exponential Smoothing alpha parameter must be between 0 and 1.`);
    });

    it("TCS13: Returns an error value if simple exponential smoothing is used without configuring the time settings", async () => {
        const result = await runAnalyzeError(["ses"], [0.5], periodNotDated, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Please select another time specification.`);
    });

    it("TCS15: Returns an error value if the double exponential smoothing parameter is out of range.", async () => {
        const result = await runAnalyzeError(["des"], [1.5], periodMonthly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Double Exponential Smoothing alpha parameter must be between 0 and 1.`);
    });

    it("TCS16: Returns an error value if double exponential smoothing is used without configuring the time settings", async () => {
        const result = await runAnalyzeError(["des"], [0.5], periodNotDated, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Please select another time specification.`);
    });

    it("TCS18: Returns an error value if Holt's method alpha parameter is out of range.", async () => {
        const result = await runAnalyzeError(["holt"], [1.5, 0.5], periodMonthly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Holt's Method alpha parameter must be between 0 and 1.`);
    });

    it("TCS19: Returns an error value if Holt's method beta parameter is out of range.", async () => {
        const result = await runAnalyzeError(["holt"], [0.5, 1.5], periodMonthly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Holt's Method beta parameter must be between 0 and 1.`);
    });

    it("TCS20: Returns an error value if Holt's method is used without configuring the time settings", async () => {
        const result = await runAnalyzeError(["holt"], [0.5, 0.5], periodNotDated, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Please select another time specification.`);
    });

    it("TCS22: Returns an error value if Winter's method alpha parameter is out of range.", async () => {
        const result = await runAnalyzeError(["winter"], [1.5, 0.5, 0.5], periodMonthly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Winter's Method alpha parameter must be between 0 and 1.`);
    });

    it("TCS23: Returns an error value if Winter's method beta parameter is out of range.", async () => {
        const result = await runAnalyzeError(["winter"], [0.5, 1.5, 0.5], periodMonthly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Winter's Method beta parameter must be between 0 and 1.`);
    });

    it("TCS24: Returns an error value if Winter's method gamma parameter is out of range.", async () => {
        const result = await runAnalyzeError(["winter"], [0.5, 0.5, 1.5], periodMonthly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Winter's Method gamma parameter must be between 0 and 1.`);
    });

    it("TCS25: Returns an error value if Winter's method is used without configuring the time settings", async () => {
        const result = await runAnalyzeError(["winter"], [0.5, 0.5, 0.5], periodNotDated, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Please select another time specification.`);
    });
});

const mockAddStatistic = jest.fn();
const mockHandleSmoothing = jest.fn();

jest.mock('@/stores/useResultStore', () => ({
    useResultStore: () => ({
        addLog: jest.fn(() => Promise.resolve(1)),
        addAnalytic: jest.fn(() => Promise.resolve(1)),
        addStatistic: mockAddStatistic,
    }),
}));

jest.mock('@/components/Modals/Analyze/TimeSeries/Smoothing/analyze/analyze', () => ({
    handleSmoothing: (...args: any[]) => mockHandleSmoothing(...args),
}));

const runAnalyzeSuccess = async (
    method: string[],
    parameters: number[],
    selectedPeriod: string[],
    variables: Variable[],
    data: any[][]
) => {
    const { result } = renderHook(() =>
        useAnalyzeHook(method, parameters, selectedPeriod, variables, data, false, jest.fn())
    );
    await act(async () => {
        await result.current.handleAnalyzes();
    });
    return result;
};

const assertStatistic = (methodCode: string, seriesLength: string = "25") => {
    const call = mockAddStatistic.mock.calls.find(
        ([, stat]) => stat?.title === 'Description Table'
    );
    expect(call).toBeDefined();
    expect(call[1].components).toBe('Description Table');
    expect(call[1].output_data.tables[0].rows).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ rowHeader: ['Smoothing Method'], description: methodCode }),
            expect.objectContaining({ rowHeader: ['Series Length'], description: seriesLength }),
        ])
    );
};

beforeAll(() => {
    mockHandleSmoothing.mockImplementation((_, name, parameters, __, ___, ____ , _____, ______, _______, method) =>
        Promise.resolve([
            'success',
            {
                tables: [
                    {
                        title: 'Description Table',
                        columnHeaders: [{ header: '' }, { header: 'description' }],
                        rows: [
                            { rowHeader: ['Smoothing Method'], description: method },
                            { rowHeader: ['Parameter'], description: parameters.join(', ') },
                            { rowHeader: ['Series Name'], description: name },
                            { rowHeader: ['Series Period'], description: '2024-01-01 - 2024-01-25' },
                            { rowHeader: ['Periodicity'], description: 'None' },
                            { rowHeader: ['Series Length'], description: '25' },
                            { rowHeader: ['Smoothing Length'], description: '22' },
                        ],
                    },
                ],
            },
            [1, 2, 3, 4, 5],
            { graphic: true },
            { evaluation: true },
        ])
    );
});

describe('useAnalyzeHook - Success Cases', () => {
    beforeEach(() => {
        mockAddStatistic.mockClear();
    });

    const cases = [
        { code: 'sma', name: 'Simple Moving Average', params: [3], id: 'TCS07' },
        { code: 'dma', name: 'Double Moving Average', params: [3], id: 'TCS11' },
        { code: 'ses', name: 'Simple Exponential Smoothing', params: [0.5], id: 'TCS14' },
        { code: 'des', name: 'Double Exponential Smoothing', params: [0.5], id: 'TCS17' },
        { code: 'holt', name: "Holt's Exponential Smoothing", params: [0.5, 0.5], id: 'TCS21' },
        { code: 'winter', name: "Winter's Exponential Smoothing", params: [0.5, 0.5, 0.5], id: 'TCS26' },
    ];

    cases.forEach(({ code, name, params, id }) => {
        it(`${id}: Returns statistical output if all requirements for ${name.toLowerCase()} are met`, async () => {
            const result = await runAnalyzeSuccess([code, name], params, periodMonthly, [createMockVar()], data25Obs);
            expect(result.current.errorMsg).toBe(null);
            assertStatistic(code);
        });
    });
});