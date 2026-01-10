import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
import {RocAnalysisAnalysisType} from "@/components/Modals/Analyze/Classify/roc-analysis/types/roc-analysis-worker";

export async function analyzeRocAnalysis({
    configData,
    dataVariables,
    variables,
}: RocAnalysisAnalysisType) {
    const TestVariables = configData.main.TestTargetVariable || [];
    const StateVariable = configData.main.StateTargetVariable
        ? [configData.main.StateTargetVariable]
        : [];
    const TargetGroupVariable = configData.main.TargetGroupVar
        ? [configData.main.TargetGroupVar]
        : [];

    const slicedDataForTest = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: TestVariables,
    });

    const slicedDataForState = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: StateVariable,
    });

    const slicedDataForTargetGroup = getSlicedData({
        dataVariables: dataVariables,
        variables: variables,
        selectedVariables: TargetGroupVariable,
    });

    const varDefsForTest = getVarDefs(variables, TestVariables);
    const varDefsForState = getVarDefs(variables, StateVariable);
    const varDefsForTargetGroup = getVarDefs(variables, TargetGroupVariable);

    console.log(configData);

    // await init();
    // const rocAnalysis = new RocAnalysis(
    //     slicedDataForTest,
    //     slicedDataForState,
    //     slicedDataForTargetGroup,
    //     varDefsForTest,
    //     varDefsForState,
    //     varDefsForTargetGroup,
    //     configData
    // );

    // const results = rocAnalysis.get_formatted_results();
    // const error = rocAnalysis.get_all_errors();

    // console.log("result", results);
    // console.log("error", error);

    // const formattedResults = transformROCAnalysisResult(results);
    // console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    // await resultROCAnalysis({
    //     formattedResult: formattedResults ?? [],
    // });
}
