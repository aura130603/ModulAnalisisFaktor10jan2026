import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
import {
    HierClusAnalysisType
} from "@/components/Modals/Analyze/Classify/hierarchical-cluster/types/hierarchical-cluster-worker";

export async function analyzeHierClus({
    configData,
    dataVariables,
    variables,
}: HierClusAnalysisType) {
    const ClusterVariables = configData.main.Variables || [];

    const LabelCasesVariable = configData.main.LabelCases
        ? [configData.main.LabelCases]
        : [];

    const slicedDataForCluster = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: ClusterVariables,
    });

    const slicedDataForLabelCases = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: LabelCasesVariable,
    });

    const varDefsForCluster = getVarDefs(variables, ClusterVariables);
    const varDefsForLabelCases = getVarDefs(variables, LabelCasesVariable);

    console.log(configData);

    // await init();
    // const hc = new HierarchicalCluster(
    //     slicedDataForCluster,
    //     slicedDataForLabelCases,
    //     varDefsForCluster,
    //     varDefsForLabelCases,
    //     configData
    // );

    // const results = hc.get_formatted_results();
    // const results_original = hc.get_results();
    // const error = hc.get_all_errors();

    // console.log("Results:", results);
    // console.log("Original Results: ", results_original);
    // console.log("Errors:", error);

    // const formattedResults = transformHierClusResult(results);
    // console.log("formattedResults", formattedResults);

    // /*
    //  * 🎉 Final Result Process 🎯
    //  * */
    // await resultHierarchicalCluster({
    //     formattedResult: formattedResults ?? [],
    // });
}
