/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import init, {
    UnivariateAnalysis,
} from "@/components/Modals/Analyze/general-linear-model/univariate/rust/pkg/wasm";
import path from "path";
import fs from "fs";

const invalidFormatData = [
    {
        happiness: null,
    },
];

const allNullData = [[{ happiness: null }, { happiness: null }]];

const emptyData = [[]];

const validDepData = [
    [
        { happiness: 1 },
        { happiness: 2 },
        { happiness: 3 },
        { happiness: 4 },
        { happiness: 5 },
    ],
];
const validFixFactorData = [
    [
        { gender: "Male" },
        { gender: "Female" },
        { gender: "Male" },
        { gender: "Female" },
        { gender: "Male" },
    ],
];
const validRandFactorData = [
    [
        { school: "A" },
        { school: "B" },
        { school: "A" },
        { school: "B" },
        { school: "A" },
    ],
];
const validCovarData = [
    [{ age: 25 }, { age: 30 }, { age: 22 }, { age: 35 }, { age: 28 }],
];
const validWlsData = [
    [
        { weight: 1.1 },
        { weight: 0.9 },
        { weight: 1.0 },
        { weight: 1.2 },
        { weight: 0.8 },
    ],
];

const invalidDefsFormat = [
    {
        id: 1,
        name: "invalid",
    },
];

const validDepDefs = [
    [
        {
            id: 1,
            columnIndex: 1,
            name: "happiness",
            type: "NUMERIC",
            width: 8,
            decimals: 2,
            label: "Tingkat Kebahagiaan",
            values: [],
            missing: [],
            columns: 100,
            align: "right",
            measure: "scale",
            role: "input",
        },
    ],
];
const validFixFactorDefs = [
    [
        {
            id: 2,
            columnIndex: 2,
            name: "gender",
            type: "STRING",
            width: 8,
            decimals: 0,
            label: "Jenis Kelamin",
            values: [],
            missing: [],
            columns: 100,
            align: "left",
            measure: "nominal",
            role: "input",
        },
    ],
];
const validRandFactorDefs = [
    [
        {
            id: 3,
            columnIndex: 3,
            name: "school",
            type: "STRING",
            width: 8,
            decimals: 0,
            label: "Sekolah Asal",
            values: [],
            missing: [],
            columns: 100,
            align: "left",
            measure: "nominal",
            role: "input",
        },
    ],
];
const validCovarDefs = [
    [
        {
            id: 4,
            columnIndex: 4,
            name: "age",
            type: "NUMERIC",
            width: 8,
            decimals: 0,
            label: "Umur",
            values: [],
            missing: [],
            columns: 100,
            align: "right",
            measure: "scale",
            role: "input",
        },
    ],
];
const validWlsDefs = [
    [
        {
            id: 5,
            columnIndex: 5,
            name: "weight",
            type: "NUMERIC",
            width: 8,
            decimals: 2,
            label: "WLS Weight",
            values: [],
            missing: [],
            columns: 100,
            align: "right",
            measure: "scale",
            role: "input",
        },
    ],
];

const depVar = "happiness";
const fixFactor = ["gender"];
const randFactor = ["school"];
const allCovariates = ["age"];
const allVars = ["happiness", "gender", "school", "age", "weight"];

const validConfig = {
    main: {
        DepVar: depVar,
        FixFactor: fixFactor,
        RandFactor: randFactor,
        Covar: allCovariates,
        WlsWeight: "weight",
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
        FactorList: fixFactor.map((f) => `${f} (polynomial)`),
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
        TargetList: [
            "(OVERALL)",
            ...fixFactor,
            fixFactor.length > 1 ? `${fixFactor[0]}*${fixFactor[1]}` : "",
            fixFactor.length > 2
                ? `${fixFactor[0]}*${fixFactor[1]}*${fixFactor[2]}`
                : "",
        ].filter(Boolean),
        CompMainEffect: true,
        ConfiIntervalMethod: "lsdNone",
    },
    save: {
        UnstandardizedPre: true,
        WeightedPre: true,
        StdStatistics: true,
        CooksD: true,
        Leverage: true,
        UnstandardizedRes: true,
        WeightedRes: true,
        StandardizedRes: true,
        StudentizedRes: true,
        DeletedRes: true,
        CoeffStats: false,
        StandardStats: false,
        Heteroscedasticity: false,
        NewDataSet: true,
        FilePath: null,
        DatasetName: null,
        WriteNewDataSet: false,
    },
    options: {
        DescStats: true,
        HomogenTest: true,
        EstEffectSize: true,
        SprVsLevel: false,
        ObsPower: true,
        ResPlot: false,
        ParamEst: true,
        LackOfFit: true,
        TransformMat: false,
        GeneralFun: true,
        ModBruschPagan: true,
        FTest: true,
        BruschPagan: true,
        WhiteTest: true,
        ParamEstRobStdErr: true,
        HC0: false,
        HC1: false,
        HC2: false,
        HC3: false,
        HC4: false,
        CoefficientMatrix: true,
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

const invalidConfig = {};

const runAnalysisTest = async ({
    depData = validDepData,
    fixFactorData = validFixFactorData,
    randFactorData = validRandFactorData,
    covarData = validCovarData,
    wlsData = validWlsData,
    depDefs = validDepDefs,
    fixFactorDefs = validFixFactorDefs,
    randFactorDefs = validRandFactorDefs,
    covarDefs = validCovarDefs,
    wlsDefs = validWlsDefs,
    config = validConfig,
}: {
    depData?: any;
    fixFactorData?: any;
    randFactorData?: any;
    covarData?: any;
    wlsData?: any;
    depDefs?: any;
    fixFactorDefs?: any;
    randFactorDefs?: any;
    covarDefs?: any;
    wlsDefs?: any;
    config?: any;
}) => {
    let error: any | null = null;
    try {
        new UnivariateAnalysis(
            depData,
            fixFactorData,
            randFactorData,
            covarData,
            wlsData,
            depDefs,
            fixFactorDefs,
            randFactorDefs,
            covarDefs,
            wlsDefs,
            config
        );
    } catch (e: any) {
        error = e;
    }
    return error;
};

describe("Univariate Analysis Constructor Test", () => {
    beforeAll(async () => {
        const wasmPath = path.join(__dirname, "../rust/pkg/wasm_bg.wasm");
        const wasmBuffer = fs.readFileSync(wasmPath);
        await init(wasmBuffer);
    });

    it("T01: Pengujian keberhasilan konstruksi dengan seluruh input valid dan lengkap.", async () => {
        const error = await runAnalysisTest({});
        expect(error).toBeNull();
    });

    it("T02: Validasi error parsing saat dependent data tidak sesuai format.", async () => {
        const error = await runAnalysisTest({ depData: invalidFormatData });
        expect(error).toContain("Failed to parse dependent data");
    });

    it("T03: Validasi error saat semua variabel independen (fixed, random, covariate) kosong.", async () => {
        const configForT03 = {
            ...validConfig,
            main: {
                ...validConfig.main,
                FixFactor: [],
                RandFactor: [],
                Covar: [],
            },
        };

        const error = await runAnalysisTest({
            config: configForT03,
            fixFactorData: [],
            randFactorData: [],
            covarData: [],
            fixFactorDefs: [],
            randFactorDefs: [],
            covarDefs: [],
        });
        expect(error).toBe(
            "At least one fixed factor, random factor, or covariate must be provided"
        );
    });

    it("T04: Validasi error parsing saat dependent data tidak sesuai format.", async () => {
        const error = await runAnalysisTest({ depData: invalidFormatData });
        expect(error).toContain("Failed to parse dependent data");
    });

    it("T05: Validasi error parsing saat fixed data tidak sesuai format.", async () => {
        const error = await runAnalysisTest({
            fixFactorData: invalidFormatData,
        });
        expect(error).toContain("Failed to parse fixed factor data");
    });

    it("T06: Validasi error parsing saat random data tidak sesuai format.", async () => {
        const error = await runAnalysisTest({
            randFactorData: invalidFormatData,
        });
        expect(error).toContain("Failed to parse random factor data");
    });

    it("T07: Validasi error parsing saat covariate data tidak sesuai format.", async () => {
        const error = await runAnalysisTest({
            covarData: invalidFormatData,
        });
        expect(error).toContain("Failed to parse covariate data");
    });

    it("T08: Validasi error parsing saat wls data tidak sesuai format.", async () => {
        const error = await runAnalysisTest({ wlsData: invalidFormatData });
        expect(error).toContain("Failed to parse WLS weight data");
    });

    it("T09: Validasi error parsing saat dependent data defs tidak sesuai format.", async () => {
        const error = await runAnalysisTest({ depDefs: invalidDefsFormat });
        expect(error).toContain("Failed to parse dependent data definitions");
    });

    it("T10: Validasi error parsing saat fixed data defs tidak sesuai format.", async () => {
        const error = await runAnalysisTest({
            fixFactorDefs: invalidDefsFormat,
        });
        expect(error).toContain(
            "Failed to parse fixed factor data definitions"
        );
    });

    it("T11: Validasi error parsing saat random data defs tidak sesuai format.", async () => {
        const error = await runAnalysisTest({
            randFactorDefs: invalidDefsFormat,
        });
        expect(error).toContain(
            "Failed to parse random factor data definitions"
        );
    });

    it("T12: Validasi error parsing saat covariate defs tidak sesuai format.", async () => {
        const error = await runAnalysisTest({
            covarDefs: invalidDefsFormat,
        });
        expect(error).toContain("Failed to parse covariate data definitions");
    });

    it("T13: Validasi error parsing saat wls data defs tidak sesuai format.", async () => {
        const error = await runAnalysisTest({ wlsDefs: invalidDefsFormat });
        expect(error).toContain("Failed to parse WLS weight data definitions");
    });

    it("T14: Validasi error saat dependent data hanya berisi nilai null.", async () => {
        const error = await runAnalysisTest({ depData: allNullData });
        expect(error).toBe("Dependent data contains all null values");
    });

    it("T15: Validasi error saat fixed factor hanya berisi nilai null.", async () => {
        const error = await runAnalysisTest({ fixFactorData: allNullData });
        expect(error).toBe("Fixed factor data contains all null values");
    });

    it("T16: Validasi error saat random factor hanya berisi nilai null.", async () => {
        const error = await runAnalysisTest({ randFactorData: allNullData });
        expect(error).toBe("Random factor data contains all null values");
    });

    it("T17: Validasi error saat covariate hanya berisi nilai null.", async () => {
        const error = await runAnalysisTest({ covarData: allNullData });
        expect(error).toBe("Covariate data contains all null values");
    });

    it("T18: Validasi error saat wls data hanya berisi nilai null.", async () => {
        const error = await runAnalysisTest({ wlsData: allNullData });
        expect(error).toBe("WLS data contains all null values");
    });

    it("T19: Validasi kegagalan parsing konfigurasi config_data.", async () => {
        const error = await runAnalysisTest({ config: invalidConfig });
        expect(error).toContain("Failed to parse configuration");
    });

    describe("T20: Validasi konfigurasi saat nilai signifikansi tidak berada pada rentang 0 hingga 1.", () => {
        it("Harus error saat tingkat signifikansi kurang dari 0", async () => {
            const invalidConfig = {
                ...validConfig,
                options: { ...validConfig.options, SigLevel: -0.1 },
            };
            const error = await runAnalysisTest({ config: invalidConfig });
            expect(error).toBe("Significance level must be between 0 and 1");
        });

        it("Harus error saat tingkat signifikansi lebih dari 1", async () => {
            const invalidConfig = {
                ...validConfig,
                options: { ...validConfig.options, SigLevel: 1.1 },
            };
            const error = await runAnalysisTest({ config: invalidConfig });
            expect(error).toBe("Significance level must be between 0 and 1");
        });
    });
});
