import { getSlicedData, getVarDefs } from "@/hooks/useVariable";
import { KMeansClusterAnalysisType } from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster-worker";
import { transformKMeansResult } from "./k-means-cluster-analysis-formatter";
import { resultKMeans } from "./k-means-cluster-analysis-output";
import init, {
    KMeansClusterAnalysis,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/rust/pkg/wasm";

export async function analyzeKMeansCluster({
    configData,
    dataVariables,
    variables,
}: KMeansClusterAnalysisType) {
    console.log(configData);
    const TargetVariables = configData.main.TargetVar || [];
    const CaseTargetVariable = configData.main.CaseTarget
        ? [configData.main.CaseTarget]
        : [];

    const slicedDataForTarget = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: TargetVariables,
    });

    const slicedDataForCaseTarget = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: CaseTargetVariable,
    });

    const varDefsForTarget = getVarDefs(variables, TargetVariables);
    const varDefsForCaseTarget = getVarDefs(variables, CaseTargetVariable);

    console.log("slicedDataForTarget", slicedDataForTarget);
    console.log("slicedDataForCaseTarget", slicedDataForCaseTarget);
    console.log("varDefsForTarget", varDefsForTarget);
    console.log("varDefsForCaseTarget", varDefsForCaseTarget);
    console.log("configData", configData);

    await init();
    const kmeans = new KMeansClusterAnalysis(
        slicedDataForTarget,
        slicedDataForCaseTarget,
        varDefsForTarget,
        varDefsForCaseTarget,
        configData
    );

    const results = kmeans.get_formatted_results();
    console.log("kmeans results", results);

    const errorsString = kmeans.get_all_errors();
    console.log("kmeans errors", errorsString);

    let errors: string[] = [];
    if (errorsString) {
        errors = errorsString
            .split("\n")
            .filter((line: string) => line.trim() !== "");
    }

    const formattedResults = transformKMeansResult(results ?? {}, errors);
    console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    await resultKMeans({
        formattedResult: formattedResults ?? [],
        configData,
        variables,
    });
}
