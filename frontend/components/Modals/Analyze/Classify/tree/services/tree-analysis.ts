import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
import {TreeAnalysisType} from "@/components/Modals/Analyze/Classify/tree/types/tree-worker";

export async function analyzeTree({
    configData,
    dataVariables,
    variables,
}: TreeAnalysisType) {
    const DependentVariable = configData.main.DependentTargetVar
        ? [configData.main.DependentTargetVar]
        : [];
    const IndependentVariables = configData.main.IndependentTargetVar || [];
    const InfluenceVariable = configData.main.InfluenceTargetVar
        ? [configData.main.InfluenceTargetVar]
        : [];
    const slicedDataForDependent = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: DependentVariable,
    });

    const slicedDataForIndependent = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: IndependentVariables,
    });

    const slicedDataForInfluence = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: InfluenceVariable,
    });

    const varDefsForDependent = getVarDefs(variables, DependentVariable);
    const varDefsForIndependent = getVarDefs(variables, IndependentVariables);
    const varDefsForInfluence = getVarDefs(variables, InfluenceVariable);

    console.log(configData);
}
