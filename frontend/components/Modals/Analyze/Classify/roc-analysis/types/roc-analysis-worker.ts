import {RocAnalysisType} from "./roc-analysis";
import {ResultJson} from "@/types/Table";

export type RocAnalysisAnalysisType = {
    configData: RocAnalysisType;
    dataVariables: any[];
    variables: any[];
};

export type RocAnalysisFinalResultType = {
    formattedResult: ResultJson;
};
