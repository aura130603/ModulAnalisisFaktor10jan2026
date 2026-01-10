/** @jest-environment jsdom */
import '@testing-library/jest-dom';

import { renderHook, act } from '@testing-library/react';
import { useAnalyzeHook } from '@/components/Modals/Analyze/TimeSeries/Autocorrelation/hooks/analyzeHook';
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

const dataEmpty: any[][] = [];
const dataBelow20Obs = Array.from({ length: 5 }, () => [3]);
const data25Obs = Array.from({ length: 25 }, () => [3]);

const periodNotDated = ["0", "Not Dated"];
const periodYearly = ["0", "Years"];
const periodWithSeason = ["5", "Weeks-Work Days(5)"];

const runAnalyzeError = async (
    variables: Variable[],
    data: any[][],
    diff: string[],
    period: string[],
    lag: number,
    seasonal: boolean
) => {
    const { result } = renderHook(() =>
        useAnalyzeHook(variables, data, diff, period, lag, seasonal, jest.fn())
    );
    await act(async () => {
        await result.current.handleAnalyzes();
    });
    return result;
};

describe("useAnalyzeHook - Error Cases", () => {
    it("TCA01: Returns error if variable is not selected", async () => {
        const result = await runAnalyzeError([], data25Obs, ["level"], periodWithSeason, 12, true);
        expect(result.current.errorMsg).toBe("Please select at least one variable.");
    });

    it("TCA02: Returns error if selected variable is not numeric", async () => {
        const result = await runAnalyzeError([createMockVar("STRING")], data25Obs, ["level"], periodWithSeason, 12, true);
        expect(result.current.errorMsg).toBe("Selected variable is not numeric");
    });

    it("TCA03: Returns error if data is empty", async () => {
        const result = await runAnalyzeError([createMockVar()], [dataEmpty], ["level"], periodWithSeason, 12, true);
        expect(result.current.errorMsg).toBe("No data available for the selected variable.");
    });

    it("TCA04: Returns error if data length is less than 20", async () => {
        const result = await runAnalyzeError([createMockVar()], dataBelow20Obs, ["level"], periodWithSeason, 12, true);
        expect(result.current.errorMsg).toBe("Data length must be at least 20 observations.");
    });

    it("TCA05: Returns error if lag without seasonality is out of range", async () => {
        const result = await runAnalyzeError([createMockVar()], data25Obs, ["level"], periodWithSeason, 5, true);
        expect(result.current.errorMsg).toBe("Lag length must be between 10 and 20.");
    });

    it("TCA09: Returns an error value if running without configuring the time settings", async () => {
        const result = await runAnalyzeError([createMockVar()], data25Obs, ["level"], periodNotDated, 12, true);
        expect(result.current.errorMsg).toBe("Please select another time specification.");
    });

    it("TCA10: Returns error if seasonality is selected but period has no periodicity", async () => {
        const result = await runAnalyzeError([createMockVar()], data25Obs, ["level"], periodYearly, 12, true);
        expect(result.current.errorMsg).toBe("Please select a time specification with periodicity.");
    });

    it("TCA11: Returns error if lag with seasonality is out of range", async () => {
        const result = await runAnalyzeError([createMockVar()], data25Obs, ["level"], periodWithSeason, 5, true);
        expect(result.current.errorMsg).toBe("Lag length must be between 10 and 20.");
    });
});


const mockAddStatistic = jest.fn();
const mockHandleAutocorrelation = jest.fn();

jest.mock('@/stores/useResultStore', () => ({
    useResultStore: () => ({
        addLog: jest.fn(() => Promise.resolve(1)),
        addAnalytic: jest.fn(() => Promise.resolve(1)),
        addStatistic: mockAddStatistic,
    }),
}));

jest.mock('@/components/Modals/Analyze/TimeSeries/Autocorrelation/analyze/analyze', () => ({
    handleAutocorrelation: (...args: any[]) => mockHandleAutocorrelation(...args),
}));

const assertDescriptionStatistic = (expectedRows: { rowHeader: string[]; description: string }[]) => {
    const call = mockAddStatistic.mock.calls.find(
        ([, stat]) => stat?.title === 'Description Table'
    );
    expect(call).toBeDefined();
    const parsed = JSON.parse(call[1].output_data);
    const rows = parsed.tables[0].rows;
    expectedRows.forEach((expectedRow) => {
        expect(rows).toContainEqual(expectedRow);
    });
};

describe('useAnalyzeHook - Success Case', () => {
    beforeEach(() => {
        mockAddStatistic.mockClear();
        mockHandleAutocorrelation.mockImplementation(
            (
                _dataValues: number[],
                dataHeader: string,
                lag: number,
                difference: string,
                useSeasonal: boolean,
                seasonal: number
            ) => {
                const seasonalDescription = useSeasonal ? 'with seasonal-differencing' : 'none';
                const differenceDescription = difference === 'level' ? 'none' : difference;

                const mockDescription = JSON.stringify({
                    tables: [
                        {
                            title: 'Description Table',
                            columnHeaders: [{ header: '' }, { header: 'description' }],
                            rows: [
                                { rowHeader: ['Name Method'], description: 'Autocorrelation' },
                                { rowHeader: ['Series Name'], description: dataHeader },
                                { rowHeader: ['Differencing'], description: differenceDescription },
                                { rowHeader: ['Seasonal Differencing'], description: seasonalDescription },
                                { rowHeader: ['Periodicity'], description: useSeasonal ? seasonal.toString() : '' },
                                { rowHeader: ['Maximum Lag'], description: lag.toString() },
                                { rowHeader: ['Approach Method of Standard Error'], description: 'Bartlett Formula' },
                                { rowHeader: ['Observations'], description: '25' },
                                { rowHeader: ['Number Observations of Computable First Lags'], description: '19' },
                            ],
                        },
                    ],
                });

                return Promise.resolve(['success', mockDescription, [], '', '', '', '']);
            }
        );
    });

    const successCases = [
        {
            id: 'TCA06',
            title: 'No differencing, no seasonal differencing',
            diff: 'level',
            diffLabel: 'Level',
            seasonal: false,
            period: ['5', 'Weeks-Work Days(5)'],
            lag: 12,
            expectedRows: [
                { rowHeader: ['Name Method'], description: 'Autocorrelation' },
                { rowHeader: ['Series Name'], description: 'Test Var' },
                { rowHeader: ['Differencing'], description: 'none' },
                { rowHeader: ['Seasonal Differencing'], description: 'none' },
                { rowHeader: ['Periodicity'], description: '' },
                { rowHeader: ['Maximum Lag'], description: '12' },
                { rowHeader: ['Approach Method of Standard Error'], description: 'Bartlett Formula' },
                { rowHeader: ['Observations'], description: '25' },
                { rowHeader: ['Number Observations of Computable First Lags'], description: '19' },
            ],
        },
        {
            id: 'TCA07',
            title: 'First differencing, no seasonal differencing',
            diff: 'first-difference',
            diffLabel: 'First Difference',
            seasonal: false,
            period: ['5', 'Weeks-Work Days(5)'],
            lag: 12,
            expectedRows: [
                { rowHeader: ['Name Method'], description: 'Autocorrelation' },
                { rowHeader: ['Series Name'], description: 'Test Var' },
                { rowHeader: ['Differencing'], description: 'first-difference' },
                { rowHeader: ['Seasonal Differencing'], description: 'none' },
                { rowHeader: ['Periodicity'], description: '' },
                { rowHeader: ['Maximum Lag'], description: '12' },
                { rowHeader: ['Approach Method of Standard Error'], description: 'Bartlett Formula' },
                { rowHeader: ['Observations'], description: '25' },
                { rowHeader: ['Number Observations of Computable First Lags'], description: '19' },
            ],
        },
        {
            id: 'TCA08',
            title: 'Second differencing, no seasonal differencing',
            diff: 'second-difference',
            diffLabel: 'Second Difference',
            seasonal: false,
            period: ['5', 'Weeks-Work Days(5)'],
            lag: 12,
            expectedRows: [
                { rowHeader: ['Name Method'], description: 'Autocorrelation' },
                { rowHeader: ['Series Name'], description: 'Test Var' },
                { rowHeader: ['Differencing'], description: 'second-difference' },
                { rowHeader: ['Seasonal Differencing'], description: 'none' },
                { rowHeader: ['Periodicity'], description: '' },
                { rowHeader: ['Maximum Lag'], description: '12' },
                { rowHeader: ['Approach Method of Standard Error'], description: 'Bartlett Formula' },
                { rowHeader: ['Observations'], description: '25' },
                { rowHeader: ['Number Observations of Computable First Lags'], description: '19' },
            ],
        },
        {
            id: 'TCA12',
            title: 'No differencing, with seasonal differencing',
            diff: 'level',
            diffLabel: 'Level',
            seasonal: true,
            period: ['5', 'Weeks-Work Days(5)'],
            lag: 12,
            expectedRows: [
                { rowHeader: ['Name Method'], description: 'Autocorrelation' },
                { rowHeader: ['Series Name'], description: 'Test Var' },
                { rowHeader: ['Differencing'], description: 'none' },
                { rowHeader: ['Seasonal Differencing'], description: 'with seasonal-differencing' },
                { rowHeader: ['Periodicity'], description: '5' },
                { rowHeader: ['Maximum Lag'], description: '12' },
                { rowHeader: ['Approach Method of Standard Error'], description: 'Bartlett Formula' },
                { rowHeader: ['Observations'], description: '25' },
                { rowHeader: ['Number Observations of Computable First Lags'], description: '19' },
            ],
        },
        {
            id: 'TCA13',
            title: 'First differencing, with seasonal differencing',
            diff: 'first-difference',
            diffLabel: 'First Difference',
            seasonal: true,
            period: ['5', 'Weeks-Work Days(5)'],
            lag: 12,
            expectedRows: [
                { rowHeader: ['Name Method'], description: 'Autocorrelation' },
                { rowHeader: ['Series Name'], description: 'Test Var' },
                { rowHeader: ['Differencing'], description: 'first-difference' },
                { rowHeader: ['Seasonal Differencing'], description: 'with seasonal-differencing' },
                { rowHeader: ['Periodicity'], description: '5' },
                { rowHeader: ['Maximum Lag'], description: '12' },
                { rowHeader: ['Approach Method of Standard Error'], description: 'Bartlett Formula' },
                { rowHeader: ['Observations'], description: '25' },
                { rowHeader: ['Number Observations of Computable First Lags'], description: '19' },
            ],
        },
        {
            id: 'TCA14',
            title: 'Second differencing, with seasonal differencing',
            diff: 'second-difference',
            diffLabel: 'Second Difference',
            seasonal: true,
            period: ['5', 'Weeks-Work Days(5)'],
            lag: 12,
            expectedRows: [
                { rowHeader: ['Name Method'], description: 'Autocorrelation' },
                { rowHeader: ['Series Name'], description: 'Test Var' },
                { rowHeader: ['Differencing'], description: 'second-difference' },
                { rowHeader: ['Seasonal Differencing'], description: 'with seasonal-differencing' },
                { rowHeader: ['Periodicity'], description: '5' },
                { rowHeader: ['Maximum Lag'], description: '12' },
                { rowHeader: ['Approach Method of Standard Error'], description: 'Bartlett Formula' },
                { rowHeader: ['Observations'], description: '25' },
                { rowHeader: ['Number Observations of Computable First Lags'], description: '19' },
            ],
        },
    ];

    successCases.forEach(({ id, title, diff, diffLabel, seasonal, period, lag, expectedRows }) => {
        it(`${id}: ${title}`, async () => {
            const { result } = renderHook(() =>
                useAnalyzeHook(
                    [createMockVar()],
                    data25Obs,
                    [diff, diffLabel],
                    period,
                    lag,
                    seasonal,
                    jest.fn()
                )
            );
        await act(async () => {
            await result.current.handleAnalyzes();
        });
            expect(result.current.errorMsg).toBe(null);
            assertDescriptionStatistic(expectedRows);
        });
    });
});