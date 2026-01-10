/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import init, {
    KMeansClusterAnalysis,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/rust/pkg/wasm";
import path from "path";
import fs from "fs";

const nullData = [
    [
        {
            happiness: null,
        },
    ],
];

const emptyData = [[]];

const invalidTargetData = [
    {
        happiness: null,
    },
];

const invalidCaseData = [
    {
        puppy_names: null,
    },
];

const validTargetData = [
    [
        {
            happiness: 1,
        },
        {
            happiness: 2,
        },
        {
            happiness: 3,
        },
        {
            happiness: 4,
        },
        {
            happiness: 5,
        },
    ],
    [
        {
            puppy_love: 1,
        },
        {
            puppy_love: 2,
        },
        {
            puppy_love: 3,
        },
        {
            puppy_love: 4,
        },
        {
            puppy_love: 5,
        },
    ],
];

const validCaseData = [
    [
        {
            puppy_names: 1,
        },
        {
            puppy_names: 2,
        },
        {
            puppy_names: 3,
        },
        {
            puppy_names: 4,
        },
        {
            puppy_names: 5,
        },
    ],
];

const invalidTargetDefs = [
    [
        {
            id: 1014,
            columnIndex: 2,
        },
    ],
];

const invalidCaseDefs = [
    [
        {
            id: 1014,
            columnIndex: 2,
        },
    ],
];

const validTargetDefs = [
    [
        {
            id: 1014,
            columnIndex: 2,
            name: "happiness",
            type: "NUMERIC",
            width: 8,
            decimals: 0,
            label: "",
            values: [],
            missing: [],
            columns: 112,
            align: "right",
            measure: "scale",
            role: "input",
        },
    ],
    [
        {
            id: 1015,
            columnIndex: 3,
            name: "puppy_love",
            type: "NUMERIC",
            width: 8,
            decimals: 0,
            label: "",
            values: [],
            missing: [],
            columns: 120,
            align: "right",
            measure: "scale",
            role: "input",
        },
    ],
];

const validCaseDefs = [
    [
        {
            id: 1016,
            columnIndex: 4,
            name: "puppy_names",
            type: "STRING",
            width: 8,
            decimals: 0,
            label: "",
            values: [],
            missing: [],
            columns: 120,
            align: "right",
            measure: "scale",
            role: "input",
        },
    ],
];

const invalidConfig = {};
const validConfig = {
    analysisType: "KMeansCluster",
    main: {
        TargetVar: ["happiness", "puppy_love"],
        CaseTarget: "puppy_names",
        IterateClassify: true,
        ClassifyOnly: false,
        Cluster: 2,
        ReadInitial: false,
        OpenDataset: true,
        ExternalDatafile: false,
        WriteFinal: false,
        NewDataset: true,
        DataFile: false,
        OpenDatasetMethod: null,
        NewData: null,
        InitialData: null,
        FinalData: null,
    },
    iterate: {
        MaximumIterations: 10,
        ConvergenceCriterion: 0,
        UseRunningMeans: false,
    },
    save: {
        ClusterMembership: true,
        DistanceClusterCenter: true,
    },
    options: {
        InitialCluster: true,
        ANOVA: true,
        ClusterInfo: true,
        ClusterPlot: true,
        ExcludeListWise: true,
        ExcludePairWise: false,
    },
    updatedAt: "2025-07-27T18:14:22.663Z",
};

const runAnalysisTest = async ({
    config,
    targetData,
    caseData,
    targetDefs,
    caseDefs,
}: {
    config: any;
    targetData: any;
    caseData: any;
    targetDefs: any;
    caseDefs: any;
}) => {
    let error: any | null = null;
    try {
        const kmeans = new KMeansClusterAnalysis(
            targetData,
            caseData,
            targetDefs,
            caseDefs,
            config
        );
    } catch (e: any) {
        error = e;
    }
    return error;
};

describe("K-Means Constructor Test", () => {
    beforeAll(async () => {
        const wasmPath = path.join(__dirname, "../rust/pkg/wasm_bg.wasm");
        const wasmBuffer = fs.readFileSync(wasmPath);
        await init(wasmBuffer);
    });

    it("T01: Harus berhasil saat seluruh data input dan konfigurasi valid", async () => {
        const error = await runAnalysisTest({
            targetData: validTargetData,
            caseData: validCaseData,
            targetDefs: validTargetDefs,
            caseDefs: validCaseDefs,
            config: validConfig,
        });
        expect(error).toBeNull();
    });

    it("T02: Harus error saat target_data hanya berisi nilai null", async () => {
        const error = await runAnalysisTest({
            targetData: nullData,
            caseData: validCaseData,
            targetDefs: validTargetDefs,
            caseDefs: validCaseDefs,
            config: validConfig,
        });
        expect(error).toBe("Target data contains all null values");
    });

    it("T03: Harus error saat case_data hanya berisi nilai null", async () => {
        const error = await runAnalysisTest({
            caseData: nullData,
            targetData: validTargetData,
            targetDefs: validTargetDefs,
            caseDefs: validCaseDefs,
            config: validConfig,
        });
        expect(error).toBe("Case data contains all null values");
    });

    it("T04: Harus error saat target_data kosong", async () => {
        const error = await runAnalysisTest({
            targetData: emptyData,
            caseData: validCaseData,
            targetDefs: validTargetDefs,
            caseDefs: validCaseDefs,
            config: validConfig,
        });
        expect(error).toBe("No cases found in data");
    });

    it("T05: Harus error parsing saat target_data tidak sesuai format", async () => {
        const error = await runAnalysisTest({
            targetData: invalidTargetData,
            caseData: validCaseData,
            targetDefs: validTargetDefs,
            caseDefs: validCaseDefs,
            config: validConfig,
        });
        expect(error).toContain("Failed to parse target data");
    });

    it("T06: Harus error parsing saat case_data tidak sesuai format", async () => {
        const error = await runAnalysisTest({
            caseData: invalidCaseData,
            targetData: validTargetData,
            targetDefs: validTargetDefs,
            caseDefs: validCaseDefs,
            config: validConfig,
        });
        expect(error).toContain("Failed to parse case data");
    });

    it("T07: Harus error parsing saat target_data_defs tidak sesuai format", async () => {
        const error = await runAnalysisTest({
            targetDefs: invalidTargetDefs,
            caseData: validCaseData,
            targetData: validTargetData,
            caseDefs: validCaseDefs,
            config: validConfig,
        });
        expect(error).toContain("Failed to parse target data definitions");
    });

    it("T08: Harus error parsing saat case_data_defs tidak sesuai format", async () => {
        const error = await runAnalysisTest({
            caseDefs: invalidCaseDefs,
            caseData: validCaseData,
            targetData: validTargetData,
            targetDefs: validTargetDefs,
            config: validConfig,
        });
        expect(error).toContain("Failed to parse case data definitions");
    });

    it("T09: Harus error parsing saat field wajib pada config_data hilang", async () => {
        const invalidConfig = {
            ...validConfig,
            iterate: {},
        };

        const error = await runAnalysisTest({
            config: invalidConfig,
            targetData: validTargetData,
            caseData: validCaseData,
            targetDefs: validTargetDefs,
            caseDefs: validCaseDefs,
        });
        expect(error).not.toBeNull();
        expect(error).toContain("Failed to parse configuration");
    });

    it("T10: Harus error validasi saat jumlah cluster kurang dari atau sama dengan nol", async () => {
        const invalidConfig = {
            ...validConfig,
            main: { ...validConfig.main, Cluster: 0 },
        };
        const error = await runAnalysisTest({
            config: invalidConfig,
            targetData: validTargetData,
            caseData: validCaseData,
            targetDefs: validTargetDefs,
            caseDefs: validCaseDefs,
        });
        expect(error).toBe("Number of clusters must be positive");
    });
});
