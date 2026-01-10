import {getSlicedData, getVarDefs} from "@/hooks/useVariable";
import {RocCurveAnalysisType} from "@/components/Modals/Analyze/Classify/roc-curve/types/roc-curve-worker";

export async function analyzeRocCurve({
    configData,
    dataVariables,
    variables,
}: RocCurveAnalysisType) {
    const TestVariables = configData.main.TestTargetVariable || [];
    const StateVariable = configData.main.StateTargetVariable
        ? [configData.main.StateTargetVariable]
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

    const varDefsForTest = getVarDefs(variables, TestVariables);
    const varDefsForState = getVarDefs(variables, StateVariable);

    console.log(configData);

    // await init();
    // const rocCurve = new RocCurve(
    //     slicedDataForTest,
    //     slicedDataForState,
    //     varDefsForTest,
    //     varDefsForState,
    //     configData
    // );

    // const results = rocCurve.get_formatted_results();
    // const error = rocCurve.get_all_errors();

    // console.log("results", results);
    // console.log("error", error);

    // const formattedResults = transformROCCurveResult(results);
    // console.log("formattedResults", formattedResults);

    /*
     * 🎉 Final Result Process 🎯
     * */
    // await resultROCCurve({
    //     formattedResult: formattedResults ?? [],
    // });
}
