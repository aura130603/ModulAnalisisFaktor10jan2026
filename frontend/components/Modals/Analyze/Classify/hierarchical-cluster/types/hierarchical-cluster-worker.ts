import {HierClusType} from "./hierarchical-cluster";
import {ResultJson} from "@/types/Table";

export type HierClusAnalysisType = {
    configData: HierClusType;
    dataVariables: any[];
    variables: any[];
};

export type HierClusFinalResultType = {
    formattedResult: ResultJson;
};
