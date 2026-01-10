import {KNNType} from "./nearest-neighbor";
import {ResultJson} from "@/types/Table";

export type KNNAnalysisType = {
    configData: KNNType;
    dataVariables: any[];
    variables: any[];
};

export type KNNFinalResultType = {
    formattedResult: ResultJson;
};
