import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
import {
    OptScaCatpcaAnalysisType
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/catpca/types/optimal-scaling-captca-worker";

export async function analyzeOptScaCatpca({
    configData,
    dataVariables,
    variables,
}: OptScaCatpcaAnalysisType) {
    const AnalysisVariables = configData.main.AnalysisVars || [];
    const SupplementVariables = configData.main.SuppleVars || [];
    const LabelingVariables = configData.main.LabelingVars || [];

    const slicedDataForAnalysis = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: AnalysisVariables,
    });

    const slicedDataForSupplement = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: SupplementVariables,
    });

    const slicedDataForLabeling = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: LabelingVariables,
    });

    const varDefsForAnalysis = getVarDefs(variables, AnalysisVariables);
    const varDefsForSupplement = getVarDefs(variables, SupplementVariables);
    const varDefsForLabeling = getVarDefs(variables, LabelingVariables);

    console.log(configData);

    // await init();
    // const catpca = new OptScaAnalysis(
    //     slicedDataForAnalysis,
    //     slicedDataForSupplement,
    //     slicedDataForLabeling,
    //     varDefsForAnalysis,
    //     varDefsForSupplement,
    //     varDefsForLabeling,
    //     configData
    // );

    // const result = catpca.get_results();
    // const error = catpca.get_all_errors();

    // console.log(result);
    // console.log(error);
}
