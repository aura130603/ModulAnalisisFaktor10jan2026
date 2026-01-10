/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useAnalyzeHook } from '@/components/Modals/Analyze/TimeSeries/BoxJenkinsModel/hooks/analyzeHook';
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
const periodWorkingDay = ["5", "Weeks-Work Days(5)"];

const dataEmpty: any[][] = [];
const dataBelow20Obs = Array.from({ length: 5 }, () => [3]);
const data25Obs = Array.from({ length: 25 }, () => [3]);

const runAnalyzeError = async (
    storeVariables: Variable[],
    data: any[][],
    selectedPeriod: string[],
    arOrder: number,
    diffOrder: number,
    maOrder: number,
    checkedForecasting = false
) => {
    const { result } = renderHook(() =>
        useAnalyzeHook(
            storeVariables,
            data,
            selectedPeriod,
            arOrder,
            diffOrder,
            maOrder,
            checkedForecasting,
            jest.fn()
        )
    );
    await act(async () => {
        await result.current.handleAnalyzes();
    });
    return result;
};

describe("useAnalyzeHook - Error Cases", () => {
    it("TCB01: Returns error if variable is not selected", async () => {
        const result = await runAnalyzeError([], dataEmpty, periodMonthly, 1, 1, 1);
        expect(result.current.errorMsg).toBe(`Please select at least one variable.`);
    });

    it("TCB02: Returns error if selected variable is not numeric", async () => {
        const result = await runAnalyzeError([createMockVar("STRING")], data25Obs, periodMonthly, 1, 1, 1);
        expect(result.current.errorMsg).toBe(`Selected variable is not numeric`);
    });

    it("TCB03: Returns error if data is empty", async () => {
        const result = await runAnalyzeError([createMockVar()], [dataEmpty], periodMonthly, 1, 1, 1);
        expect(result.current.errorMsg).toBe(`No data available for the selected variable.`);
    });

    it("TCB04: Returns error if data length is less than 20", async () => {
        const result = await runAnalyzeError([createMockVar()], dataBelow20Obs, periodMonthly, 1, 1, 1);
        expect(result.current.errorMsg).toBe(`Data length is less than 20 observations.`);
    });

    it("TCB05: Returns error if time is not configured", async () => {
        const result = await runAnalyzeError([createMockVar()], data25Obs, periodNotDated, 1, 1, 1);
        expect(result.current.errorMsg).toBe(`Please select another time specification.`);
    });

    it("TCB06: Returns error if AR order (p) out of range", async () => {
        const result = await runAnalyzeError([createMockVar()], data25Obs, periodMonthly, 6, 1, 1);
        expect(result.current.errorMsg).toBe(`AR order must be between 0 and 5.`);
    });

    it("TCB07: Returns error if differencing order out of range", async () => {
        const result = await runAnalyzeError([createMockVar()], data25Obs, periodMonthly, 1, 3, 1);
        expect(result.current.errorMsg).toBe(`Differencing order must be between 0 and 2.`);
    });

    it("TCB08: Returns error if MA order (q) out of range", async () => {
        const result = await runAnalyzeError([createMockVar()], data25Obs, periodMonthly, 1, 1, 6);
        expect(result.current.errorMsg).toBe(`MA order must be between 0 and 5.`);
    });
});

const mockAddStatistic = jest.fn();
const mockHandleBoxJenkinsModel = jest.fn();

jest.mock('@/stores/useResultStore', () => ({
    useResultStore: () => ({
        addLog: jest.fn(() => Promise.resolve(1)),
        addAnalytic: jest.fn(() => Promise.resolve(1)),
        addStatistic: mockAddStatistic,
    }),
}));

jest.mock('@/components/Modals/Analyze/TimeSeries/BoxJenkinsModel/analyze/analyze', () => ({
    handleBoxJenkinsModel: (...args: any[]) => mockHandleBoxJenkinsModel(...args),
}));

const assertDescriptionStatistic = (expectedRows: { rowHeader: string[]; description: string }[]) => {
    const call = mockAddStatistic.mock.calls.find(
        ([, stat]) => stat?.title === "Description Table"
    );
    expect(call).toBeDefined();
    const parsed = JSON.parse(call[1].output_data);
    const rows = parsed.tables[0].rows;
    expectedRows.forEach((expectedRow) => {
        expect(rows).toContainEqual(expectedRow);
    });
};

const assertStatisticTitles = (expectedTitles: string[]) => {
    const calls = mockAddStatistic.mock.calls.map((call) => call[1]?.title);
    expect(calls).toEqual(expect.arrayContaining(expectedTitles));
};

describe('useAnalyzeHook - Success Cases', () => {
    beforeEach(() => {
        mockAddStatistic.mockClear();
        mockHandleBoxJenkinsModel.mockImplementation((
            dataValues,
            name,
            orderParams,
            forecasting
        ) => {
            const mockDescription = JSON.stringify({
                tables: [
                    {
                        title: 'Description Table',
                        columnHeaders: [{ header: '' }, { header: 'description' }],
                        rows: [
                            { rowHeader: ['Name Method'], description: `ARIMA (${orderParams.join(', ')})` },
                            { rowHeader: ['Estimation Method'], description: 'Conditional Least Squares (CLS)' },
                            { rowHeader: ['Function Estimation'], description: 'Conditional Sum of Squares (CSS)' },
                            { rowHeader: ['Optimalization Method'], description: 'L-BFGS' },
                            { rowHeader: ['Series Name'], description: name },
                            { rowHeader: ['Series Period'], description: '2024-01-01 - 2024-01-25' },
                            { rowHeader: ['Series Length'], description: dataValues.length.toString() },
                        ],
                    },
                ],
            });

            const mockCoefficient = JSON.stringify({
                tables: [
                    {
                        title: `Coefficients Test for ARIMA (${orderParams.join(',')})`,
                        columnHeaders: [
                            { header: '' },
                            { header: 'coef' },
                            { header: 'std. error' },
                            { header: 't value' },
                            { header: 'p-value' },
                        ],
                        rows: [
                            {
                                rowHeader: ['Constant'],
                                coef: '1.200',
                                'std. error': '0.100',
                                't value': '12.000',
                                'p-value': '0.000',
                            },
                        ],
                    },
                ],
            });

            const mockCriteria = JSON.stringify({
                tables: [
                    {
                        title: 'Selection Criteria for Test Var',
                        columnHeaders: [{ header: '' }, { header: 'value' }],
                        rows: [
                            { rowHeader: ['Akaike Info Crit'], value: '123.456' },
                        ],
                    },
                ],
            });

            const mockEvaluation = JSON.stringify({
                tables: [
                    {
                        title: 'Arima Forecasting Evaluation',
                        columnHeaders: [{ header: '' }, { header: 'value' }],
                        rows: [{ rowHeader: ['RMSE'], value: '2.345' }],
                    },
                ],
            });

            const mockGraphic = JSON.stringify({
                charts: [
                    {
                        chartType: 'Multiple Line Chart',
                        chartMetadata: { title: 'ARIMA Forecasting of Test Var' },
                        chartData: [],
                    },
                ],
            });

            const forecast = Array.from({ length: 25 }, () => 4.56);
            const testArray = [1.2, 2.3, 3.4];

            return Promise.resolve([
                'success',
                mockDescription,
                testArray,
                mockCoefficient,
                mockCriteria,
                mockEvaluation,
                forecast,
                mockGraphic,
            ]);
        });
    });

    const successCases = [
        {
            id: 'TCB09',
            modelLabel: 'ARIMA(1,1,1)',
            p: 1,
            d: 1,
            q: 1,
            enableForecast: false,
            expectedTitles: [
                'Description Table',
                'Coefficient Test for ARIMA(1,1,1)',
                'Criteria Selection for ARIMA(1,1,1)',
            ],
            expectedRows: [
                { rowHeader: ['Name Method'], description: 'ARIMA (1, 1, 1)' },
                { rowHeader: ['Estimation Method'], description: 'Conditional Least Squares (CLS)' },
                { rowHeader: ['Function Estimation'], description: 'Conditional Sum of Squares (CSS)' },
                { rowHeader: ['Optimalization Method'], description: 'L-BFGS' },
                { rowHeader: ['Series Name'], description: 'Test Var' },
                { rowHeader: ['Series Period'], description: '2024-01-01 - 2024-01-25' },
                { rowHeader: ['Series Length'], description: '25' },
            ],
        },
    ];

    successCases.forEach(({ id, modelLabel, p, d, q, enableForecast, expectedTitles, expectedRows }) => {
        it(`${id}: Success with ${modelLabel}`, async () => {
            const { result } = renderHook(() =>
                useAnalyzeHook(
                    [createMockVar()],
                    data25Obs,
                    periodWorkingDay,
                    p, d, q,
                    enableForecast,
                    jest.fn()
                )
            );
            
            await act(async () => {
                await result.current.handleAnalyzes();
            });
            
            expect(result.current.errorMsg).toBe(null);
            assertStatisticTitles(expectedTitles);
            assertDescriptionStatistic(expectedRows);
        });
    });
});