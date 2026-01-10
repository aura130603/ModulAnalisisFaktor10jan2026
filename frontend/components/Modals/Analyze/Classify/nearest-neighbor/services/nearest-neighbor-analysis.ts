import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
import {KNNAnalysisType} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor-worker";

export async function analyzeKNN({
    configData,
    dataVariables,
    variables,
}: KNNAnalysisType) {
    const TargetVariable = configData.main.DepVar
        ? [configData.main.DepVar]
        : [];
    const FeaturesVariables = configData.main.FeatureVar || [];
    const FocalCaseIdentifierVariable = configData.main.FocalCaseIdenVar
        ? [configData.main.FocalCaseIdenVar]
        : [];
    const CaseIdentifierVariable = configData.main.CaseIdenVar
        ? [configData.main.CaseIdenVar]
        : [];

    const slicedDataForTarget = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: TargetVariable,
    });

    const slicedDataForFeatures = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: FeaturesVariables,
    });

    const slicedDataForFocalCaseIdentifier = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: FocalCaseIdentifierVariable,
    });

    const slicedDataForCaseIdentifier = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: CaseIdentifierVariable,
    });

    const varDefsForTarget = getVarDefs(variables, TargetVariable);
    const varDefsForFeatures = getVarDefs(variables, FeaturesVariables);
    const varDefsForFocalCaseIdentifier = getVarDefs(
        variables,
        FocalCaseIdentifierVariable
    );
    const varDefsForCaseIdentifier = getVarDefs(
        variables,
        CaseIdentifierVariable
    );

    console.log("configData", configData);

    // await init();
    // const knn = new KNNAnalysis(
    //     slicedDataForTarget,
    //     slicedDataForFeatures,
    //     slicedDataForFocalCaseIdentifier,
    //     slicedDataForCaseIdentifier,
    //     varDefsForTarget,
    //     varDefsForFeatures,
    //     varDefsForFocalCaseIdentifier,
    //     varDefsForCaseIdentifier,
    //     configData
    // );

    // const results = knn.get_formatted_results();
    // const error = knn.get_all_errors();
    // const executed = knn.get_executed_functions();

    // console.log("knn results", results);
    // console.log("error", error);
    // console.log("executed", executed);

    // const formattedResults = transformNearestNeighborResult(results);
    // console.log("formattedResults", formattedResults);

    // /*
    //  * 🎉 Final Result Process 🎯
    //  * */
    // await resultNearestNeighbor({
    //     formattedResult: formattedResults ?? [],
    // });
}
