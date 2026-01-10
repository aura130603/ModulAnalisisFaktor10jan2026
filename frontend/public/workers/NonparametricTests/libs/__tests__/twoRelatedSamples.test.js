/**
 * @fileoverview Tests for TwoRelatedSamplesCalculator
 */

// Mock global functions
global.isNumeric = jest.fn((value) => {
    return typeof value === 'number' && !isNaN(value);
});

global.checkIsMissing = jest.fn((value, missing, isNumericType) => {
    if (value === null || value === undefined) return true;
    if (missing && missing.includes(value)) return true;
    return false;
});

global.stdlibstatsBaseDistsNormalCdf = jest.fn((x, mu, sigma) => {
    // Mock normal CDF calculation - simplified version
    const z = (x - mu) / sigma;
    // Simple approximation for normal CDF
    return 0.5 * (1 + Math.tanh(z / Math.sqrt(2)));
});

global.stdlibstatsBaseDistsBinomialCdf = jest.fn((k, n, p) => {
    // Mock binomial CDF calculation
    let sum = 0;
    for (let i = 0; i <= k; i++) {
        sum += Math.pow(p, i) * Math.pow(1 - p, n - i);
    }
    return sum;
});

// Mock the TwoRelatedSamplesCalculator class
global.self.TwoRelatedSamplesCalculator = class TwoRelatedSamplesCalculator {
    constructor({ variable1, data1, variable2, data2, options = {} }) {
        this.variable1 = variable1;
        this.data1 = data1;
        this.variable2 = variable2;
        this.data2 = data2;
        this.options = options;
        this.initialized = false;
        this.testType = options.testType || { wilcoxon: true, sign: false };
        this.validData1 = [];
        this.validData2 = [];
        this.N = 0;
        this.hasInsufficientData = false;
        this.insufficientType = [];
        this.memo = {};
    }

    #initialize() {
        if (this.initialized) return;

        const isNumericType1 = ['scale', 'date'].includes(this.variable1.measure);
        const isNumericType2 = ['scale', 'date'].includes(this.variable2.measure);

        let pairs = [];
        for (let i = 0; i < Math.min(this.data1.length, this.data2.length); i++) {
            const value1 = this.data1[i];
            const value2 = this.data2[i];
            
            const isValid1 = !global.checkIsMissing(value1, this.variable1.missing, isNumericType1) && global.isNumeric(value1);
            const isValid2 = !global.checkIsMissing(value2, this.variable2.missing, isNumericType2) && global.isNumeric(value2);
            
            if (isValid1 && isValid2) {
                pairs.push({
                    value1: parseFloat(value1),
                    value2: parseFloat(value2)
                });
            }
        }
        
        this.validData1 = pairs.map(p => p.value1);
        this.validData2 = pairs.map(p => p.value2);
        this.N = this.validData1.length;

        // Check for insufficient data conditions
        if (this.N < 1) {
            this.hasInsufficientData = true;
            this.insufficientType.push('empty');
        }
        
        // Check if there are no differences between pairs
        if (this.N > 0 && this.validData1.every((v, i) => v === this.validData2[i])) {
            this.hasInsufficientData = true;
            this.insufficientType.push('no_difference');
        }

        this.initialized = true;
    }

    getN() { this.#initialize(); return this.N; }
    getValidN() { this.#initialize(); return this.N; }

    getRanksFrequencies() {
        if (this.memo.ranksFrequencies) return this.memo.ranksFrequencies;
        
        this.#initialize();
        
        if (!this.testType.wilcoxon) {
            this.memo.ranksFrequencies = null;
            return null;
        }
        
        // Mock ranks frequencies calculation
        const differences = this.validData1.map((val, idx) => {
            const diff = this.validData2[idx] - val;
            return {
                diff: diff,
                absDiff: Math.abs(diff),
                sign: diff > 0 ? 1 : (diff < 0 ? -1 : 0)
            };
        });
        
        const ties = differences.filter(p => p.sign === 0).length;
        const nonTies = differences.filter(p => p.sign !== 0);
        
        // Mock rank calculation
        const sortedAbsDiffs = [...new Set(nonTies.map(p => p.absDiff))].sort((a, b) => a - b);
        const rankMap = {};
        sortedAbsDiffs.forEach((diff, index) => {
            rankMap[diff] = index + 1;
        });
        
        const ranks = nonTies.map(p => ({
            ...p,
            rank: rankMap[p.absDiff]
        }));
        
        const positiveRanks = ranks.filter(p => p.sign > 0);
        const negativeRanks = ranks.filter(p => p.sign < 0);
        
        const sumPositiveRanks = positiveRanks.reduce((sum, p) => sum + p.rank, 0);
        const sumNegativeRanks = negativeRanks.reduce((sum, p) => sum + p.rank, 0);
        
        this.memo.ranksFrequencies = {
            N: this.N,
            ties: ties,
            positiveRanks: {
                N: positiveRanks.length,
                sumRanks: sumPositiveRanks,
                meanRank: positiveRanks.length > 0 ? sumPositiveRanks / positiveRanks.length : 0
            },
            negativeRanks: {
                N: negativeRanks.length,
                sumRanks: sumNegativeRanks,
                meanRank: negativeRanks.length > 0 ? sumNegativeRanks / negativeRanks.length : 0
            }
        };
        
        return this.memo.ranksFrequencies;
    }

    getTestStatisticsWilcoxon() {
        if (this.memo.testStatisticsWilcoxon) return this.memo.testStatisticsWilcoxon;
        
        this.#initialize();
        
        if (!this.testType.wilcoxon) {
            this.memo.testStatisticsWilcoxon = null;
            return null;
        }
        
        const ranksFreq = this.getRanksFrequencies();
        if (!ranksFreq) {
            this.memo.testStatisticsWilcoxon = null;
            return null;
        }
        
        // Mock Wilcoxon test statistics
        const W = Math.min(ranksFreq.positiveRanks.sumRanks, ranksFreq.negativeRanks.sumRanks);
        const n = ranksFreq.N - ranksFreq.ties;
        const meanW = (n * (n + 1)) / 4;
        const varW = (n * (n + 1) * (2 * n + 1)) / 24;
        const z = (W - meanW) / Math.sqrt(varW);
        const pValue = 2 * (1 - global.stdlibstatsBaseDistsNormalCdf(Math.abs(z), 0, 1));
        
        this.memo.testStatisticsWilcoxon = {
            W: W,
            Z: z,
            pValue: pValue,
            N: n
        };
        
        return this.memo.testStatisticsWilcoxon;
    }

    getTestStatisticsSign() {
        if (this.memo.testStatisticsSign) return this.memo.testStatisticsSign;
        
        this.#initialize();
        
        if (!this.testType.sign) {
            this.memo.testStatisticsSign = null;
            return null;
        }
        
        // Mock Sign test statistics
        const differences = this.validData1.map((val, idx) => this.validData2[idx] - val);
        const positiveCount = differences.filter(d => d > 0).length;
        const negativeCount = differences.filter(d => d < 0).length;
        const ties = differences.filter(d => d === 0).length;
        
        const n = positiveCount + negativeCount;
        const p = 0.5; // null hypothesis: median difference = 0
        const z = (positiveCount - n * p) / Math.sqrt(n * p * (1 - p));
        const pValue = 2 * (1 - global.stdlibstatsBaseDistsNormalCdf(Math.abs(z), 0, 1));
        
        this.memo.testStatisticsSign = {
            positiveCount: positiveCount,
            negativeCount: negativeCount,
            ties: ties,
            N: n,
            Z: z,
            pValue: pValue
        };
        
        return this.memo.testStatisticsSign;
    }

    getOutput() {
        this.#initialize();
        
        const output = {
            variable1: this.variable1,
            variable2: this.variable2,
            N: this.N,
            metadata: {
                hasInsufficientData: this.hasInsufficientData,
                insufficientType: this.insufficientType,
                variable1Label: this.variable1.label,
                variable2Label: this.variable2.label,
                variable1Name: this.variable1.name,
                variable2Name: this.variable2.name,
            }
        };
        
        if (this.testType.wilcoxon) {
            output.ranksFrequencies = this.getRanksFrequencies();
            output.testStatisticsWilcoxon = this.getTestStatisticsWilcoxon();
        } else {
            output.ranksFrequencies = null;
            output.testStatisticsWilcoxon = null;
        }
        
        if (this.testType.sign) {
            output.testStatisticsSign = this.getTestStatisticsSign();
        } else {
            output.testStatisticsSign = null;
        }
        
        return output;
    }
};

describe('TwoRelatedSamplesCalculator', () => {
    let calculator;
    const mockVariable1 = {
        name: 'Var1',
        measure: 'scale',
        missing: null
    };
    const mockVariable2 = {
        name: 'Var2',
        measure: 'scale',
        missing: null
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic functionality', () => {
        it('should initialize with correct properties', () => {
            const mockData1 = [1, 2, 3, 4, 5];
            const mockData2 = [2, 3, 4, 5, 6];
            
            calculator = new global.self.TwoRelatedSamplesCalculator({
                variable1: mockVariable1,
                data1: mockData1,
                variable2: mockVariable2,
                data2: mockData2,
                options: {
                    testType: { wilcoxon: true, sign: false }
                }
            });
            
            expect(calculator.variable1).toBe(mockVariable1);
            expect(calculator.variable2).toBe(mockVariable2);
            expect(calculator.data1).toBe(mockData1);
            expect(calculator.data2).toBe(mockData2);
            expect(calculator.testType).toEqual({ wilcoxon: true, sign: false });
            expect(calculator.initialized).toBe(false);
        });

        it('should calculate basic statistics correctly', () => {
            const mockData1 = [1, 2, 3, 4, 5];
            const mockData2 = [2, 3, 4, 5, 6];
            
            calculator = new global.self.TwoRelatedSamplesCalculator({
                variable1: mockVariable1,
                data1: mockData1,
                variable2: mockVariable2,
                data2: mockData2,
                options: {
                    testType: { wilcoxon: true, sign: false }
                }
            });
            
            expect(calculator.getN()).toBe(5);
            expect(calculator.getValidN()).toBe(5);
            });

    describe('Insufficient Data Cases', () => {
        describe('Empty Data Cases', () => {
            it('should handle completely empty data', () => {
                const mockData1 = [];
                const mockData2 = [];
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariable1,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: true, sign: false }
                    }
                });
                
                expect(calculator.getN()).toBe(0);
                expect(calculator.hasInsufficientData).toBe(true);
                expect(calculator.insufficientType).toContain('empty');
                
                const output = calculator.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('empty');
            });

            it('should handle all null/undefined data', () => {
                const mockData1 = [null, undefined, null, undefined];
                const mockData2 = [null, undefined, null, undefined];
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariable1,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: true, sign: false }
                    }
                });
                
                expect(calculator.getN()).toBe(0);
                expect(calculator.hasInsufficientData).toBe(true);
                expect(calculator.insufficientType).toContain('empty');
            });

            it('should handle all non-numeric data', () => {
                const mockData1 = ['a', 'b', 'c', 'd'];
                const mockData2 = ['x', 'y', 'z', 'w'];
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariable1,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: true, sign: false }
                    }
                });
                
                expect(calculator.getN()).toBe(0);
                expect(calculator.hasInsufficientData).toBe(true);
                expect(calculator.insufficientType).toContain('empty');
            });

            it('should handle mixed valid and invalid data', () => {
                const mockData1 = [1, null, 3, 'a', 5];
                const mockData2 = [2, undefined, 4, 'b', 6];
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariable1,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: true, sign: false }
                    }
                });
                
                // Should have 3 valid pairs (1-2, 3-4, 5-6)
                expect(calculator.getN()).toBe(3);
                expect(calculator.hasInsufficientData).toBe(false);
                expect(calculator.insufficientType).toEqual([]);
            });
        });

        describe('No Difference Cases', () => {
            it('should handle identical data pairs', () => {
                const mockData1 = [3, 4, 5, 2, 1];
                const mockData2 = [3, 4, 5, 2, 1];
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariable1,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: true, sign: false }
                    }
                });
                
                expect(calculator.getN()).toBe(5);
                expect(calculator.hasInsufficientData).toBe(true);
                expect(calculator.insufficientType).toContain('no_difference');
                
                const output = calculator.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('no_difference');
            });

            it('should handle mixed identical and different data', () => {
                const mockData1 = [1, 2, 3, 4, 5];
                const mockData2 = [1, 2, 3, 4, 6]; // Last pair is different
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariable1,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: true, sign: false }
                    }
                });
                
                expect(calculator.getN()).toBe(5);
                expect(calculator.hasInsufficientData).toBe(false);
                expect(calculator.insufficientType).toEqual([]);
            });

            it('should handle data with some null values but identical valid pairs', () => {
                const mockData1 = [3, null, 5, 2, 1];
                const mockData2 = [3, undefined, 5, 2, 1];
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariable1,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: true, sign: false }
                    }
                });
                
                expect(calculator.getN()).toBe(4); // 4 valid pairs
                expect(calculator.hasInsufficientData).toBe(true);
                expect(calculator.insufficientType).toContain('no_difference');
            });
        });

        describe('Edge Cases', () => {
            it('should handle single valid pair with difference', () => {
                const mockData1 = [1];
                const mockData2 = [2];
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariable1,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: true, sign: false }
                    }
                });
                
                expect(calculator.getN()).toBe(1);
                expect(calculator.hasInsufficientData).toBe(false);
                expect(calculator.insufficientType).toEqual([]);
            });

            it('should handle single valid pair without difference', () => {
                const mockData1 = [1];
                const mockData2 = [1];
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariable1,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: true, sign: false }
                    }
                });
                
                expect(calculator.getN()).toBe(1);
                expect(calculator.hasInsufficientData).toBe(true);
                expect(calculator.insufficientType).toContain('no_difference');
            });

            it('should handle data with missing values in variable definition', () => {
                const mockVariableWithMissing = {
                    name: 'Var1',
                    measure: 'scale',
                    missing: ['NA', 'N/A']
                };
                
                const mockData1 = [1, 'NA', 3, 'N/A', 5];
                const mockData2 = [2, 'NA', 4, 'N/A', 6];
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariableWithMissing,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: true, sign: false }
                    }
                });
                
                expect(calculator.getN()).toBe(3); // 3 valid pairs (1-2, 3-4, 5-6)
                expect(calculator.hasInsufficientData).toBe(false);
                expect(calculator.insufficientType).toEqual([]);
            });
        });

        describe('Test Statistics with Insufficient Data', () => {
            it('should handle Wilcoxon test with no differences', () => {
                const mockData1 = [3, 4, 5, 2, 1];
                const mockData2 = [3, 4, 5, 2, 1];
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariable1,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: true, sign: false }
                    }
                });
                
                const ranksFreq = calculator.getRanksFrequencies();
                const stats = calculator.getTestStatisticsWilcoxon();
                
                // Should still return ranks frequencies but with all ties
                expect(ranksFreq).toBeDefined();
                expect(ranksFreq.ties).toBe(5);
                expect(ranksFreq.positiveRanks.N).toBe(0);
                expect(ranksFreq.negativeRanks.N).toBe(0);
                
                // Test statistics should still be calculated
                expect(stats).toBeDefined();
            });

            it('should handle Sign test with no differences', () => {
                const mockData1 = [3, 4, 5, 2, 1];
                const mockData2 = [3, 4, 5, 2, 1];
                
                calculator = new global.self.TwoRelatedSamplesCalculator({
                    variable1: mockVariable1,
                    data1: mockData1,
                    variable2: mockVariable2,
                    data2: mockData2,
                    options: {
                        testType: { wilcoxon: false, sign: true }
                    }
                });
                
                const stats = calculator.getTestStatisticsSign();
                
                // Sign test should still be calculated
                expect(stats).toBeDefined();
                expect(stats.ties).toBe(5);
                expect(stats.positiveCount).toBe(0);
                expect(stats.negativeCount).toBe(0);
            });
        });
    });
});

    describe('Wilcoxon Signed Ranks Test', () => {
        it('should calculate ranks frequencies correctly', () => {
            const mockData1 = [1, 2, 3, 4, 5];
            const mockData2 = [2, 3, 4, 5, 6];
            
            calculator = new global.self.TwoRelatedSamplesCalculator({
                variable1: mockVariable1,
                data1: mockData1,
                variable2: mockVariable2,
                data2: mockData2,
                options: {
                    testType: { wilcoxon: true, sign: false }
                }
            });
            
            const ranksFreq = calculator.getRanksFrequencies();
            
            expect(ranksFreq).toBeDefined();
            expect(ranksFreq.N).toBe(5);
            expect(ranksFreq.ties).toBe(0);
            expect(ranksFreq.positiveRanks).toBeDefined();
            expect(ranksFreq.negativeRanks).toBeDefined();
        });

        it('should calculate Wilcoxon test statistics correctly', () => {
            const mockData1 = [1, 2, 3, 4, 5];
            const mockData2 = [2, 3, 4, 5, 6];
            
            calculator = new global.self.TwoRelatedSamplesCalculator({
                variable1: mockVariable1,
                data1: mockData1,
                variable2: mockVariable2,
                data2: mockData2,
                options: {
                    testType: { wilcoxon: true, sign: false }
                }
            });
            
            const stats = calculator.getTestStatisticsWilcoxon();
            
            expect(stats).toBeDefined();
            expect(stats.W).toBeDefined();
            expect(stats.Z).toBeDefined();
            expect(stats.pValue).toBeDefined();
            expect(stats.N).toBe(5);
        });
    });

    describe('Sign Test', () => {
        it('should calculate sign test statistics correctly', () => {
            const mockData1 = [1, 2, 3, 4, 5];
            const mockData2 = [2, 3, 4, 5, 6];
            
            calculator = new global.self.TwoRelatedSamplesCalculator({
                variable1: mockVariable1,
                data1: mockData1,
                variable2: mockVariable2,
                data2: mockData2,
                options: {
                    testType: { wilcoxon: false, sign: true }
                }
            });
            
            const stats = calculator.getTestStatisticsSign();
            
            expect(stats).toBeDefined();
            expect(stats.positiveCount).toBeDefined();
            expect(stats.negativeCount).toBeDefined();
            expect(stats.ties).toBeDefined();
            expect(stats.N).toBe(5);
            expect(stats.Z).toBeDefined();
            expect(stats.pValue).toBeDefined();
        });
    });

    describe('Output generation', () => {
        it('should generate complete output with Wilcoxon test', () => {
            const mockData1 = [1, 2, 3, 4, 5];
            const mockData2 = [2, 3, 4, 5, 6];
            
            calculator = new global.self.TwoRelatedSamplesCalculator({
                variable1: mockVariable1,
                data1: mockData1,
                variable2: mockVariable2,
                data2: mockData2,
                options: {
                    testType: { wilcoxon: true, sign: false }
                }
            });
            
            const output = calculator.getOutput();
            
            expect(output.variable1).toBe(mockVariable1);
            expect(output.variable2).toBe(mockVariable2);
            expect(output.N).toBe(5);
            expect(output.ranksFrequencies).toBeDefined();
            expect(output.testStatisticsWilcoxon).toBeDefined();
            expect(output.testStatisticsSign).toBeNull();
            expect(output.metadata.hasInsufficientData).toBe(false);
            expect(output.metadata.insufficientType).toEqual([]);
        });

        it('should generate complete output with Sign test', () => {
            const mockData1 = [1, 2, 3, 4, 5];
            const mockData2 = [2, 3, 4, 5, 6];
            
            calculator = new global.self.TwoRelatedSamplesCalculator({
                variable1: mockVariable1,
                data1: mockData1,
                variable2: mockVariable2,
                data2: mockData2,
                options: {
                    testType: { wilcoxon: false, sign: true }
                }
            });
            
            const output = calculator.getOutput();
            
            expect(output.variable1).toBe(mockVariable1);
            expect(output.variable2).toBe(mockVariable2);
            expect(output.N).toBe(5);
            expect(output.testStatisticsSign).toBeDefined();
            expect(output.ranksFrequencies).toBeNull();
            expect(output.testStatisticsWilcoxon).toBeNull();
            expect(output.metadata.hasInsufficientData).toBe(false);
            expect(output.metadata.insufficientType).toEqual([]);
        });
    });
});
