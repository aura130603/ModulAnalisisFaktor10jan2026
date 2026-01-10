/** @jest-environment node */

import { Variable } from "@/types/Variable";
import * as fs from "fs";
import * as path from "path";
import { performance } from "perf_hooks";

import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import init, {
    UnivariateAnalysis,
} from "@/components/Modals/Analyze/general-linear-model/univariate/rust/pkg";

const performanceResultsPath = path.join(
    __dirname,
    "performance-results-univariate-all-runs.json"
);

/**
 * Menghasilkan data dummy untuk pengujian kinerja.
 * @param rowCount - Jumlah baris (titik data) yang akan dibuat.
 * @param varCount - Jumlah variabel (kolom) yang akan dibuat.
 * @returns Sebuah objek yang berisi data yang dihasilkan dan definisi variabel.
 */
const generateDummyData = (
    rowCount: number,
    varCount: number
): {
    dataVariables: string[][];
    variables: Variable[];
} => {
    const variables: Variable[] = [];
    for (let i = 0; i < varCount; i++) {
        const varName = `VAR${i + 1}`;
        let varType: "STRING" | "NUMERIC" = "NUMERIC";
        let varMeasure: "nominal" | "scale" = "scale";

        if (varName !== "VAR1" && varCount > 2) {
            const isCategorical = i > 0 && i < Math.floor(varCount / 2);
            if (isCategorical) {
                varType = "STRING";
                varMeasure = "nominal";
            }
        }

        variables.push({
            name: varName,
            type: varType,
            measure: varMeasure,
            columnIndex: i,
            width: 8,
            decimals: 2,
            label: `Variable ${i + 1}`,
            values: [],
            missing: null,
            columns: 1,
            align: "right",
            role: "input",
        });
    }

    const dataVariables: string[][] = [];
    const CATEGORY_COUNT = 5;
    for (let i = 0; i < rowCount; i++) {
        const row: string[] = [];
        for (let j = 0; j < varCount; j++) {
            const variableDef = variables[j];
            if (variableDef.name === "VAR1") {
                row.push(
                    parseFloat((Math.random() * 100).toString()).toFixed(2)
                );
            } else if (variableDef.type === "STRING") {
                row.push(`CAT_${(i % CATEGORY_COUNT) + 1}`);
            } else {
                row.push(
                    parseFloat((Math.random() * 100).toString()).toFixed(2)
                );
            }
        }
        dataVariables.push(row);
    }
    return { dataVariables, variables };
};

describe("UnivariateAnalysis Constructor Performance Test", () => {
    const ROW_COUNTS = [1000];
    const VAR_COUNTS = [5, 10];
    const NUM_RUNS = 100;
    const performanceResults: Record<number, Record<number, number[]>> = {};

    beforeAll(async () => {
        const wasmPath = path.resolve(__dirname, "../rust/pkg/wasm_bg.wasm");
        const wasmBuffer = fs.readFileSync(wasmPath);
        await init(wasmBuffer);
    }, 60000);

    afterAll(() => {
        console.log(
            "\nSemua uji kinerja konstruktor selesai. Menulis hasil..."
        );
        fs.writeFileSync(
            performanceResultsPath,
            JSON.stringify(performanceResults, null, 2)
        );
        console.log(`Hasil disimpan ke ${performanceResultsPath}`);
    });

    ROW_COUNTS.forEach((rowCount) => {
        describe(`dengan ${rowCount} baris`, () => {
            VAR_COUNTS.forEach((varCount) => {
                test(`harus mengukur kinerja konstruktor untuk ${varCount} variabel selama ${NUM_RUNS} eksekusi`, async () => {
                    const { dataVariables, variables } = generateDummyData(
                        rowCount,
                        varCount
                    );

                    const depVar = "VAR1";

                    const allFactors = variables
                        .filter((v) => v.name !== depVar && v.type === "STRING")
                        .map((v) => v.name);

                    const allCovariates = variables
                        .filter(
                            (v) => v.name !== depVar && v.type === "NUMERIC"
                        )
                        .map((v) => v.name);

                    const midPoint = Math.ceil(allFactors.length / 2);
                    const fixFactor = allFactors.slice(0, midPoint);
                    const randFactor = allFactors.slice(midPoint);

                    const allVars = variables.map((v) => v.name);

                    const configData = {
                        analysisType: "Univariate",
                        main: {
                            DepVar: depVar,
                            FixFactor: fixFactor,
                            RandFactor: randFactor,
                            Covar: allCovariates,
                            WlsWeight: null,
                        },
                        model: {
                            NonCust: true,
                            Custom: false,
                            BuildCustomTerm: false,
                            FactorsVar: [...fixFactor, ...randFactor],
                            TermsVar: null,
                            FactorsModel: null,
                            CovModel: null,
                            RandomModel: null,
                            BuildTermMethod: "interaction",
                            TermText: null,
                            SumOfSquareMethod: "typeIII",
                            Intercept: true,
                        },
                        contrast: {
                            FactorList: fixFactor.map((f) => `${f}`),
                            ContrastMethod: "polynomial",
                            Last: true,
                            First: false,
                        },
                        plots: {
                            SrcList: fixFactor,
                            AxisList: null,
                            LineList: null,
                            PlotList: null,
                            FixFactorVars: null,
                            RandFactorVars: null,
                            LineChartType: true,
                            BarChartType: false,
                            IncludeErrorBars: false,
                            ConfidenceInterval: true,
                            StandardError: false,
                            Multiplier: 2,
                            IncludeRefLineForGrandMean: false,
                            YAxisStart0: false,
                        },
                        posthoc: {
                            SrcList: fixFactor,
                            FixFactorVars: null,
                            ErrorRatio: 100,
                            Twosided: true,
                            LtControl: false,
                            GtControl: false,
                            CategoryMethod: "last",
                            Waller: false,
                            Dunnett: false,
                            Lsd: false,
                            Bonfe: false,
                            Sidak: false,
                            Scheffe: false,
                            Regwf: false,
                            Regwq: false,
                            Snk: false,
                            Tu: false,
                            Tub: false,
                            Dun: false,
                            Hoc: false,
                            Gabriel: false,
                            Tam: false,
                            Dunt: false,
                            Games: false,
                            Dunc: false,
                        },
                        emmeans: {
                            SrcList: fixFactor,
                            TargetList: [],
                            CompMainEffect: true,
                            ConfiIntervalMethod: "lsdNone",
                        },
                        save: {
                            UnstandardizedPre: false,
                            WeightedPre: false,
                            StdStatistics: false,
                            CooksD: false,
                            Leverage: false,
                            UnstandardizedRes: false,
                            WeightedRes: false,
                            StandardizedRes: false,
                            StudentizedRes: false,
                            DeletedRes: false,
                            CoeffStats: false,
                            StandardStats: false,
                            Heteroscedasticity: false,
                            NewDataSet: false,
                            FilePath: null,
                            DatasetName: null,
                            WriteNewDataSet: false,
                        },
                        options: {
                            DescStats: false,
                            HomogenTest: false,
                            EstEffectSize: false,
                            SprVsLevel: false,
                            ObsPower: false,
                            ResPlot: false,
                            ParamEst: true,
                            LackOfFit: false,
                            TransformMat: false,
                            GeneralFun: false,
                            ModBruschPagan: false,
                            FTest: false,
                            BruschPagan: false,
                            WhiteTest: false,
                            ParamEstRobStdErr: false,
                            HC0: false,
                            HC1: false,
                            HC2: false,
                            HC3: false,
                            HC4: false,
                            CoefficientMatrix: false,
                            SigLevel: 0.05,
                        },
                        bootstrap: {
                            PerformBootStrapping: false,
                            NumOfSamples: 1000,
                            Seed: false,
                            SeedValue: 200000,
                            Level: 95,
                            Percentile: true,
                            BCa: false,
                            Simple: true,
                            Stratified: false,
                            Variables: allVars,
                            StrataVariables: null,
                        },
                        updatedAt: new Date().toISOString(),
                    };

                    const DependentVariables = configData.main.DepVar
                        ? [configData.main.DepVar]
                        : [];
                    const FixFactorVariables = configData.main.FixFactor || [];
                    const RandomFactorVariables =
                        configData.main.RandFactor || [];
                    const CovariateVariables = configData.main.Covar || [];
                    const WlsWeightVariable = configData.main.WlsWeight
                        ? [configData.main.WlsWeight]
                        : [];

                    const slicedDataForDependent = getSlicedData({
                        dataVariables,
                        variables,
                        selectedVariables: DependentVariables,
                    });
                    const slicedDataForFixFactor = getSlicedData({
                        dataVariables,
                        variables,
                        selectedVariables: FixFactorVariables,
                    });
                    const slicedDataForRandomFactor = getSlicedData({
                        dataVariables,
                        variables,
                        selectedVariables: RandomFactorVariables,
                    });
                    const slicedDataForCovariate = getSlicedData({
                        dataVariables,
                        variables,
                        selectedVariables: CovariateVariables,
                    });
                    const slicedDataForWlsWeight = getSlicedData({
                        dataVariables,
                        variables,
                        selectedVariables: WlsWeightVariable,
                    });

                    const varDefsForDependent = getVarDefs(
                        variables,
                        DependentVariables
                    );
                    const varDefsForFixFactor = getVarDefs(
                        variables,
                        FixFactorVariables
                    );
                    const varDefsForRandomFactor = getVarDefs(
                        variables,
                        RandomFactorVariables
                    );
                    const varDefsForCovariate = getVarDefs(
                        variables,
                        CovariateVariables
                    );
                    const varDefsForWlsWeight = getVarDefs(
                        variables,
                        WlsWeightVariable
                    );

                    const executionTimes: number[] = [];
                    for (let i = 0; i < NUM_RUNS; i++) {
                        const startTime = performance.now();

                        const configForRun = JSON.parse(
                            JSON.stringify(configData)
                        );

                        new UnivariateAnalysis(
                            slicedDataForDependent,
                            slicedDataForFixFactor,
                            slicedDataForRandomFactor,
                            slicedDataForCovariate,
                            slicedDataForWlsWeight,
                            varDefsForDependent,
                            varDefsForFixFactor,
                            varDefsForRandomFactor,
                            varDefsForCovariate,
                            varDefsForWlsWeight,
                            configForRun
                        );

                        const endTime = performance.now();
                        executionTimes.push(endTime - startTime);
                    }

                    if (!performanceResults[rowCount]) {
                        performanceResults[rowCount] = {};
                    }

                    performanceResults[rowCount][varCount] = executionTimes;

                    console.log(
                        `Waktu Konstruktor -> Baris: ${rowCount}, Var: ${varCount}. Selesai ${NUM_RUNS} eksekusi. Semua waktu telah dicatat.`
                    );
                }, 30000);
            });
        });
    });
});
