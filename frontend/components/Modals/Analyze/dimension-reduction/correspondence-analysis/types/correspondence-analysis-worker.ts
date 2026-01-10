import {CorrespondenceType} from "./correspondence-analysis";
import {ResultJson} from "@/types/Table";

export type CorrespondenceAnalysisType = {
    configData: CorrespondenceType;
    dataVariables: any[];
    variables: any[];
    meta: any;
};

export type CorrespondenceFinalResultType = {
    formattedResult: ResultJson;
};
