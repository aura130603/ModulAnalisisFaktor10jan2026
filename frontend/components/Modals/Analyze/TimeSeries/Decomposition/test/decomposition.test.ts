/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useAnalyzeHook } from '@/components/Modals/Analyze/TimeSeries/Decomposition/hooks/analyzeHook';
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

const runAnalyzeError = async (decomposition: string[], trended: string[], period: string[], 
    storeVariables: Variable[], data: any[][]) => {
    const { result } = renderHook(() =>
        useAnalyzeHook(
        decomposition,
        trended,
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
    it("TCD01: Returns error if selected variable is empty", async () => {
        const result = await runAnalyzeError(["additive"], ["linear"], periodMonthly, [], dataEmpty);
        expect(result.current.errorMsg).toBe(`Please select at least one variable.`);
    });

    it("TCD02: Returns error if selected variable is not numeric", async () => {
        const result = await runAnalyzeError(["additive"], ["linear"], periodMonthly, [createMockVar("STRING")], [dataBelow20Obs]);
        expect(result.current.errorMsg).toBe(`Selected variable is not numeric.`);
    });

    it("TCD03: Returns error if selected variable data is empty", async () => {
        const result = await runAnalyzeError(["additive"], ["linear"], periodMonthly, [createMockVar()], dataEmpty);
        expect(result.current.errorMsg).toBe(`No data available for the selected variable.`);
    });

    it("TCD04: Returns an error value if running without configuring the time settings", async () => {
        const result = await runAnalyzeError(["additive"], ["linear"], periodNotDated, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Please select another time specification.`);
    });

    it("TCD05: Returns an error value if time specification don't have periodicity", async () => {
        const result = await runAnalyzeError(["additive"], ["linear"], periodYearly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Selected time specification doesn't have periodicity.`);
    });
    
    it("TCD06: Returns an error if the number of data observations is less than four times the periodicity", async () => {
        const result = await runAnalyzeError(["additive"], ["linear"], periodMonthly, [createMockVar()], data25Obs);
        expect(result.current.errorMsg).toBe(`Data length is less than 4 times the periodicity.`);
    });
    
    it("TCD07: Returns an error if the number of data observations is not a multiple of the periodicity", async () => {
        const result = await runAnalyzeError(["additive"], ["linear"], periodWorkingDay, [createMockVar()], data49Obs);
        expect(result.current.errorMsg).toBe(`Data length is not a multiple of the periodicity.`);
    });
});

const mockAddStatistic = jest.fn();
const mockHandleDecomposition = jest.fn();

jest.mock('@/stores/useResultStore', () => ({
    useResultStore: () => ({
        addLog: jest.fn(() => Promise.resolve(1)),
        addAnalytic: jest.fn(() => Promise.resolve(1)),
        addStatistic: mockAddStatistic,
    }),
}));

jest.mock('@/components/Modals/Analyze/TimeSeries/Decomposition/analyze/analyze', () => ({
    handleDecomposition: (...args: any[]) => mockHandleDecomposition(...args),
}));

const runAnalyzeSuccess = async (
    decomposition: string[],
    trended: string[],
    selectedPeriod: string[],
    variables: Variable[],
    data: any[][]
    ) => {
    const { result } = renderHook(() =>
        useAnalyzeHook(decomposition, trended, selectedPeriod, variables, data, false, jest.fn())
    );
    await act(async () => {
        await result.current.handleAnalyzes();
    });
    return result;
};

const assertStatistic = (
    decompositionMethod: string,
    trendMethod: string,
    seriesLength = "25",
    period = "Weeks-Work Days(5)"
    ) => {
    const call = mockAddStatistic.mock.calls.find(
        ([, stat]) => stat?.title === 'Description Table'
    );

    const seriesName = "Test Var";

    expect(call).toBeDefined();
    const rows = call[1].output_data.tables[0].rows;

    expect(rows).toEqual(
        expect.arrayContaining([
        { rowHeader: ['Decomposition Method'], description: decompositionMethod },
        { rowHeader: ['Formula of Calculating Decomposition'], description: 'Classical Decomposition' },
        { rowHeader: ['Trend Method'], description: trendMethod },
        { rowHeader: ['Series Name'], description: seriesName },
        { rowHeader: ['Series Period'], description: '2024-01-01 - 2024-01-25' },
        { rowHeader: ['Periodicity'], description: period },
        { rowHeader: ['Observations'], description: seriesLength },
        ])
    );
};

beforeAll(() => {
    mockHandleDecomposition.mockImplementation((
        dataValues,
        name,
        decompositionMethod,
        trendMethod,
        periodicity,
        periodName
    ) => Promise.resolve([
        'success',
        {
        tables: [
            {
            title: 'Description Table',
            columnHeaders: [{ header: '' }, { header: 'description' }],
            rows: [
                { rowHeader: ['Decomposition Method'], description: decompositionMethod },
                { rowHeader: ['Formula of Calculating Decomposition'], description: 'Classical Decomposition' },
                { rowHeader: ['Trend Method'], description: decompositionMethod === 'additive' ? 'none' : trendMethod },
                { rowHeader: ['Series Name'], description: name },
                { rowHeader: ['Series Period'], description: '2024-01-01 - 2024-01-25' },
                { rowHeader: ['Periodicity'], description: periodName },
                { rowHeader: ['Observations'], description: dataValues.length.toString() },
            ],
            },
        ],
        },
        [], [], [], [], [], // testing, seasonal, trend, irregular, forecasting, evaluation
        {}, // evaluation
        [], // seasonIndices
        'y = a + bt', // equation
        { graphic: 'forecast' }, // graphicForecasting
        { graphic: 'original' }, // graphicData
        { graphic: 'trend' }, // graphicTrend
        { graphic: 'seasonal' }, // graphicSeasonal
        { graphic: 'irregular' }, // graphicIrregular
    ]));
});

describe('useAnalyzeHook - Success Cases', () => {
    beforeEach(() => {
        mockAddStatistic.mockClear();
    });

    const cases = [
        {
            id: 'TCD08',
            code: 'additive',
            name: 'Additive Decomposition',
            trend: 'none',
            periodicity: '5',
            periodicityName: 'Weeks-Work Days(5)',
            dataLength: 25,
        },
        {
            id: 'TCD09',
            code: 'multiplicative',
            name: 'Multiplicative Decomposition',
            trend: 'linear',
            periodicity: '5',
            periodicityName: 'Weeks-Work Days(5)',
            dataLength: 25,
        },
        {
            id: 'TCD10',
            code: 'multiplicative',
            name: 'Multiplicative Decomposition',
            trend: 'exponential',
            periodicity: '5',
            periodicityName: 'Weeks-Work Days(5)',
            dataLength: 25,
        },
    ];

    cases.forEach(({ id, code, name, trend, periodicity, periodicityName, dataLength }) => {
        it(`${id}: Returns statistical output if all requirements for ${name.toLowerCase()} are met`, async () => {
            const result = await runAnalyzeSuccess(
                [code, name],
                [trend],
                [periodicity, periodicityName],
                [createMockVar()],
                Array.from({ length: dataLength }, () => [3])
            );

            expect(result.current.errorMsg).toBe(null);

            assertStatistic(
                code,                                     
                code === 'additive' ? 'none' : trend,                        
                dataLength.toString(),                    
                periodicityName                           
            );
        });
    });
});
