// Ini file Service Layer utama yang bertugas sebagai orkestrator atau jembatan antara Frontend Next.js dan logika Rust WASM

import {getSlicedData, getVarDefs} from "@/hooks/useVariable"; // getSlicedData: Mengambil hanya data variabel yang dipilih oleh pengguna dari dataset besar di UI.
import {FactorAnalysisType} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor-worker";
import {transformFactorAnalysisResult} from "./factor-analysis-formatter";
import {resultFactorAnalysis} from "./factor-analysis-output";
import init, {
    FactorAnalysis,
} from "@/components/Modals/Analyze/dimension-reduction/factor/rust/pkg";

// Fungsi memastikan kolom seperti columnIndex, width, dan decimals benar-benar bertipe Number. 
// Tanpa ini, jika JavaScript mengirimkan angka dalam bentuk string, Rust akan mengalami error karena Rust sangat ketat terhadap tipe data (strongly typed).

function sanitizeVarDefs(varDefs: any[][]): any[][] {
    return varDefs.map((varDefGroup) =>
        varDefGroup.map((varDef: any) => ({
            ...varDef,
            columnIndex: Number(varDef.columnIndex ?? 0),
            width: Number(varDef.width ?? 0),
            decimals: Number(varDef.decimals ?? 0),
            columns: Number(varDef.columns ?? 0),
            id: varDef.id ? Number(varDef.id) : undefined,
            // Ensure enum-like fields are strings in the correct format
            type: String(varDef.type ?? "STRING"),
            align: String(varDef.align ?? "left").toLowerCase(),
            measure: String(varDef.measure ?? "unknown").toLowerCase(),
            role: String(varDef.role ?? "none").toLowerCase(),
        }))
    );
}

export async function analyzeFactor({
    configData,
    dataVariables,
    variables,
}: FactorAnalysisType) {
    const targetVariables = configData.main.TargetVar || [];
    const valueTarget = configData.main.ValueTarget
        ? [configData.main.ValueTarget]
        : [];

    const slicedDataForTarget = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: targetVariables,
    });

    const slicedDataForValue = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: valueTarget,
    });

    const varDefsForTarget = sanitizeVarDefs(
        getVarDefs(variables, targetVariables)
    );
    const varDefsForValue = sanitizeVarDefs(
        getVarDefs(variables, valueTarget)
    );

    console.log("configData", configData);
    console.log("slicedDataForTarget", slicedDataForTarget);
    console.log("varDefsForTarget", varDefsForTarget);

    // Di dalam blok try, file ini menjalankan await init (fungsi dari paket rust/pkg yang memuat modul WebAssembly 
    // ke dalam memori browser agar fungsi-fungsi Rust bisa dipanggil oleh JavaScript)
    try {
        await init();
        const factor = new FactorAnalysis(
            slicedDataForTarget, 
            slicedDataForValue,
            varDefsForTarget,
            varDefsForValue,
            configData
        );

        const results = factor.get_formatted_results();
        const error = factor.get_all_errors();

        console.log("WASM results", results);
        console.log("WASM error", error);

        const formattedResults = transformFactorAnalysisResult(results);
        console.log("formattedResults", formattedResults);

        /*
         * 🎉 Final Result Process 🎯
         * */
        await resultFactorAnalysis({
            formattedResult: formattedResults ?? [],
            configData,
        });
    } catch (error) {
        console.error("Error in analyzeFactor:", error);
        throw error;
    }
}
