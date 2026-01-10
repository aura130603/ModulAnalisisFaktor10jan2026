import {RocCurveType} from "./roc-curve";
import {ResultJson} from "@/types/Table";

export type RocCurveAnalysisType = {
    configData: RocCurveType;
    dataVariables: any[];
    variables: any[];
};

export type RocCurveFinalResultType = {
    formattedResult: ResultJson;
};
