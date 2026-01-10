import { UnivariateType } from "./univariate";
import { ResultJson } from "@/types/Table";
import { Variable } from "@/types/Variable";

export type UnivariateAnalysisType = {
    configData: UnivariateType;
    dataVariables: any[];
    variables: Variable[];
};

export type UnivariateFinalResultType = {
    formattedResult: ResultJson;
    configData: UnivariateType;
    variables: Variable[];
};
