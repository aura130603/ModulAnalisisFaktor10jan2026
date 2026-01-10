import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
import {
    TwoStepClusterAnalysisType
} from "@/components/Modals/Analyze/Classify/two-step-cluster/types/two-step-cluste-worker";

export async function analyzeTwoStepCluster({
    configData,
    dataVariables,
    variables,
}: TwoStepClusterAnalysisType) {
    const CategoricalVariables = configData.main.CategoricalVar || [];
    const ContinousVariables = configData.main.ContinousVar || [];

    const slicedDataForCategorical = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: CategoricalVariables,
    });

    const slicedDataForContinous = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: ContinousVariables,
    });

    const varDefsForCategorical = getVarDefs(variables, CategoricalVariables);
    const varDefsForContinous = getVarDefs(variables, ContinousVariables);

    console.log(configData);

    // await init();
    // const twostep = new TwoStepClusterAnalysis(
    //     slicedDataForCategorical,
    //     slicedDataForContinous,
    //     varDefsForCategorical,
    //     varDefsForContinous,
    //     configData
    // );

    // const results = twostep.get_formatted_results();
    // const error = twostep.get_all_errors();

    // console.log("results", results);
    // console.log("error", error);

    // const formattedResults = transformClusteringResult(results);
    // console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    // await resultTwoStepCluster({
    //     formattedResult: formattedResults ?? [],
    // });
}
