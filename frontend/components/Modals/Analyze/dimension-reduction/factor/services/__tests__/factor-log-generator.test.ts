/**
 * Unit tests for Factor Analysis SPSS-Style Log Generator
 */

import { generateFactorAnalysisLog, generateFactorAnalysisLogCompact } from "../factor-log-generator";
import { FactorType } from "../../types/factor";
import { FactorDefault } from "../../constants/factor-default";

describe("Factor Analysis Log Generator", () => {
    describe("generateFactorAnalysisLog", () => {
        it("should generate basic SPSS syntax log with default settings", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2", "VAR3"],
                    ValueTarget: null,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("FACTOR /VARIABLES VAR1 VAR2 VAR3");
            expect(log).toContain("/MISSING LISTWISE");
            expect(log).toContain("/EXTRACTION PC");
            expect(log).toContain("/ROTATION NOROTATE");
            expect(log).toContain("/METHOD=COR.");
        });

        it("should generate log with Principal Axis Factoring extraction method", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["X1", "X2"],
                    ValueTarget: null,
                },
                extraction: {
                    ...FactorDefault.extraction,
                    Method: "PrincipalAxisFactoring",
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/EXTRACTION PAF");
        });

        it("should generate log with Maximum Likelihood extraction method", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["X1", "X2"],
                    ValueTarget: null,
                },
                extraction: {
                    ...FactorDefault.extraction,
                    Method: "MaxLikelihood",
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/EXTRACTION ML");
        });

        it("should generate log with Unweighted Least Squares extraction method", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["X1", "X2"],
                    ValueTarget: null,
                },
                extraction: {
                    ...FactorDefault.extraction,
                    Method: "UnweightLeastSqr",
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/EXTRACTION ULS");
        });

        it("should generate log with Generalized Least Squares extraction method", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["X1", "X2"],
                    ValueTarget: null,
                },
                extraction: {
                    ...FactorDefault.extraction,
                    Method: "GeneralizedLeastSqr",
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/EXTRACTION GLS");
        });

        it("should generate log with Alpha Factoring extraction method", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["X1", "X2"],
                    ValueTarget: null,
                },
                extraction: {
                    ...FactorDefault.extraction,
                    Method: "AlphaFactoring",
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/EXTRACTION ALPHA");
        });

        it("should generate log with Image Factoring extraction method", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["X1", "X2"],
                    ValueTarget: null,
                },
                extraction: {
                    ...FactorDefault.extraction,
                    Method: "ImageFactoring",
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/EXTRACTION IMAGE");
        });

        it("should generate log with Varimax rotation", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2", "VAR3"],
                    ValueTarget: null,
                },
                rotation: {
                    ...FactorDefault.rotation,
                    None: false,
                    Varimax: true,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/ROTATION VARIMAX");
        });

        it("should generate log with Oblimin rotation and delta parameter", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2"],
                    ValueTarget: null,
                },
                rotation: {
                    ...FactorDefault.rotation,
                    None: false,
                    Oblimin: true,
                    Delta: -0.5,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/ROTATION OBLIMIN(-0.5)");
        });

        it("should generate log with Promax rotation and kappa parameter", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2"],
                    ValueTarget: null,
                },
                rotation: {
                    ...FactorDefault.rotation,
                    None: false,
                    Promax: true,
                    Kappa: 5,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/ROTATION PROMAX(5)");
        });

        it("should generate log with eigenvalue criteria", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2", "VAR3"],
                    ValueTarget: null,
                },
                extraction: {
                    ...FactorDefault.extraction,
                    Eigen: true,
                    EigenVal: 1.5,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("MINEIGEN(1.5)");
        });

        it("should generate log with fixed number of factors", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2", "VAR3", "VAR4"],
                    ValueTarget: null,
                },
                extraction: {
                    ...FactorDefault.extraction,
                    Eigen: false,
                    Factor: true,
                    MaxFactors: 3,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("FACTORS(3)");
        });

        it("should generate log with covariance matrix analysis", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2"],
                    ValueTarget: null,
                },
                extraction: {
                    ...FactorDefault.extraction,
                    Correlation: false,
                    Covariance: true,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/METHOD=COV.");
        });

        it("should generate log with pairwise missing value handling", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2"],
                    ValueTarget: null,
                },
                options: {
                    ...FactorDefault.options,
                    ExcludeListWise: false,
                    ExcludePairWise: true,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/MISSING PAIRWISE");
        });

        it("should generate log with mean substitution for missing values", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2"],
                    ValueTarget: null,
                },
                options: {
                    ...FactorDefault.options,
                    ExcludeListWise: false,
                    ReplaceMean: true,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/MISSING MEANSUB");
        });

        it("should generate log with KMO print option", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2"],
                    ValueTarget: null,
                },
                descriptives: {
                    ...FactorDefault.descriptives,
                    KMO: true,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("KMO");
        });

        it("should generate log with scree plot option", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2"],
                    ValueTarget: null,
                },
                extraction: {
                    ...FactorDefault.extraction,
                    Scree: true,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/PLOT EIGEN");
        });

        it("should generate log with suppression values format option", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2"],
                    ValueTarget: null,
                },
                options: {
                    ...FactorDefault.options,
                    SuppressValues: true,
                    SuppressValuesNum: 0.3,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("BLANK(0.3)");
        });

        it("should generate log with factor scores saving", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2"],
                    ValueTarget: null,
                },
                scores: {
                    ...FactorDefault.scores,
                    SaveVar: true,
                    Regression: true,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/SAVE REG(ALL)");
        });

        it("should generate log with Bartlett factor scores", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2"],
                    ValueTarget: null,
                },
                scores: {
                    ...FactorDefault.scores,
                    SaveVar: true,
                    Regression: false,
                    Bartlett: true,
                },
            };

            const log = generateFactorAnalysisLog(configData);

            expect(log).toContain("/SAVE BARTLETT(ALL)");
        });
    });

    describe("generateFactorAnalysisLogCompact", () => {
        it("should generate compact one-line log", () => {
            const configData: FactorType = {
                ...FactorDefault,
                main: {
                    TargetVar: ["VAR1", "VAR2", "VAR3"],
                    ValueTarget: null,
                },
            };

            const log = generateFactorAnalysisLogCompact(configData);

            expect(log).not.toContain("\n");
            expect(log).toContain("FACTOR /VARIABLES VAR1 VAR2 VAR3");
            expect(log).toContain("/EXTRACTION PC");
        });
    });
});
