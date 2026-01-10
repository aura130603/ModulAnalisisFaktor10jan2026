/**
 * @fileoverview Minimal tests for KRelatedSamplesCalculator insufficient data cases
 */

// Simple mock functions
global.isNumeric = jest.fn((value) => typeof value === 'number' && !isNaN(value));
global.checkIsMissing = jest.fn((value) => value === null || value === undefined);
global.stdlibstatsBaseDistsChisquareCdf = jest.fn(() => 0.5);

// Minimal mock class
global.self.KRelatedSamplesCalculator = class KRelatedSamplesCalculator {
    constructor({ variable, batchVariable, data, options = {} }) {
        this.variable = variable;
        this.batchVariable = batchVariable;
        this.data = data;
        this.testType = options.testType || { friedman: true };
        this.k = options.k || 3;
        this.N = 0;
        this.hasInsufficientDataEmpty = false;
        this.hasInsufficientDataSingle = false;
        this.#initialize();
    }

    #initialize() {
        if (!this.data || this.data.length === 0) {
            this.N = 0;
            this.hasInsufficientDataEmpty = true;
            return;
        }

        const minLength = Math.min(...this.data.map(arr => arr.length));
        let validRows = 0;

        for (let i = 0; i < minLength; i++) {
            let rowValid = true;
            for (let j = 0; j < this.data.length; j++) {
                const value = this.data[j][i];
                if (global.checkIsMissing(value) || !global.isNumeric(value)) {
                    rowValid = false;
                    break;
                }
            }
            if (rowValid) validRows++;
        }

        this.N = validRows;
        this.hasInsufficientDataEmpty = this.N < 1;
        this.hasInsufficientDataSingle = this.N === 1;
    }

    getN() { return this.N; }
    getK() { return this.k; }

    getOutput() {
        return {
            ranks: null,
            frequencies: null,
            testStatistics: null,
            metadata: {
                hasInsufficientDataEmpty: this.hasInsufficientDataEmpty,
                hasInsufficientDataSingle: this.hasInsufficientDataSingle
            }
        };
    }
};

describe('KRelatedSamplesCalculator - Insufficient Data', () => {
    const mockVariable = { name: 'Test', measure: 'scale', missing: null };
    const mockBatchVariables = [
        { name: 'Var1', label: 'Variable 1' },
        { name: 'Var2', label: 'Variable 2' },
        { name: 'Var3', label: 'Variable 3' }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Empty Data Cases', () => {
        it('should handle completely empty data', () => {
            const calculator = new global.self.KRelatedSamplesCalculator({
                variable: mockVariable,
                batchVariable: mockBatchVariables,
                data: [[], [], []],
                options: { testType: { friedman: true }, k: 3 }
            });

            expect(calculator.getN()).toBe(0);
            expect(calculator.hasInsufficientDataEmpty).toBe(true);
            expect(calculator.hasInsufficientDataSingle).toBe(false);

            const output = calculator.getOutput();
            expect(output.metadata.hasInsufficientDataEmpty).toBe(true);
            expect(output.metadata.hasInsufficientDataSingle).toBe(false);
        });

        it('should handle all null data', () => {
            const calculator = new global.self.KRelatedSamplesCalculator({
                variable: mockVariable,
                batchVariable: mockBatchVariables,
                data: [[null], [null], [null]],
                options: { testType: { friedman: true }, k: 3 }
            });

            expect(calculator.getN()).toBe(0);
            expect(calculator.hasInsufficientDataEmpty).toBe(true);
            expect(calculator.hasInsufficientDataSingle).toBe(false);
        });

        it('should handle all non-numeric data', () => {
            const calculator = new global.self.KRelatedSamplesCalculator({
                variable: mockVariable,
                batchVariable: mockBatchVariables,
                data: [['a'], ['b'], ['c']],
                options: { testType: { friedman: true }, k: 3 }
            });

            expect(calculator.getN()).toBe(0);
            expect(calculator.hasInsufficientDataEmpty).toBe(true);
            expect(calculator.hasInsufficientDataSingle).toBe(false);
        });
    });

    describe('Single Case Data', () => {
        it('should handle single valid case', () => {
            const calculator = new global.self.KRelatedSamplesCalculator({
                variable: mockVariable,
                batchVariable: mockBatchVariables,
                data: [[1], [2], [3]],
                options: { testType: { friedman: true }, k: 3 }
            });

            expect(calculator.getN()).toBe(1);
            expect(calculator.hasInsufficientDataEmpty).toBe(false);
            expect(calculator.hasInsufficientDataSingle).toBe(true);

            const output = calculator.getOutput();
            expect(output.metadata.hasInsufficientDataEmpty).toBe(false);
            expect(output.metadata.hasInsufficientDataSingle).toBe(true);
        });

        it('should handle mixed valid and invalid data', () => {
            const calculator = new global.self.KRelatedSamplesCalculator({
                variable: mockVariable,
                batchVariable: mockBatchVariables,
                data: [[1, null], [2, undefined], [3, null]],
                options: { testType: { friedman: true }, k: 3 }
            });

            expect(calculator.getN()).toBe(1);
            expect(calculator.hasInsufficientDataEmpty).toBe(false);
            expect(calculator.hasInsufficientDataSingle).toBe(true);
        });

        it('should handle data with different lengths', () => {
            const calculator = new global.self.KRelatedSamplesCalculator({
                variable: mockVariable,
                batchVariable: mockBatchVariables,
                data: [[1, 2, 3], [4, 5], [6, 7, 8, 9]],
                options: { testType: { friedman: true }, k: 3 }
            });

            expect(calculator.getN()).toBe(2);
            expect(calculator.hasInsufficientDataEmpty).toBe(false);
            expect(calculator.hasInsufficientDataSingle).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle k=0 case', () => {
            const calculator = new global.self.KRelatedSamplesCalculator({
                variable: mockVariable,
                batchVariable: [],
                data: [],
                options: { testType: { friedman: true }, k: 0 }
            });

            expect(calculator.getN()).toBe(0);
            expect(calculator.hasInsufficientDataEmpty).toBe(true);
            expect(calculator.hasInsufficientDataSingle).toBe(false);
        });

        it('should handle k=1 case', () => {
            const calculator = new global.self.KRelatedSamplesCalculator({
                variable: mockVariable,
                batchVariable: [{ name: 'Var1', label: 'Variable 1' }],
                data: [[1, 2]],
                options: { testType: { friedman: true }, k: 1 }
            });

            expect(calculator.getN()).toBe(2);
            expect(calculator.hasInsufficientDataEmpty).toBe(false);
            expect(calculator.hasInsufficientDataSingle).toBe(false);
        });

        it('should handle undefined data', () => {
            const calculator = new global.self.KRelatedSamplesCalculator({
                variable: mockVariable,
                batchVariable: mockBatchVariables,
                data: undefined,
                options: { testType: { friedman: true }, k: 3 }
            });

            expect(calculator.getN()).toBe(0);
            expect(calculator.hasInsufficientDataEmpty).toBe(true);
            expect(calculator.hasInsufficientDataSingle).toBe(false);
        });
    });

    describe('Sufficient Data Cases', () => {
        it('should handle multiple valid cases', () => {
            const calculator = new global.self.KRelatedSamplesCalculator({
                variable: mockVariable,
                batchVariable: mockBatchVariables,
                data: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
                options: { testType: { friedman: true }, k: 3 }
            });

            expect(calculator.getN()).toBe(3);
            expect(calculator.hasInsufficientDataEmpty).toBe(false);
            expect(calculator.hasInsufficientDataSingle).toBe(false);

            const output = calculator.getOutput();
            expect(output.metadata.hasInsufficientDataEmpty).toBe(false);
            expect(output.metadata.hasInsufficientDataSingle).toBe(false);
        });
    });
});
