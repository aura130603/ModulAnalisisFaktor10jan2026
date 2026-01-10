import {KMeansClusterType} from "./k-means-cluster";
import {ResultJson} from "@/types/Table";
import {Variable} from "@/types/Variable";

export type KMeansClusterAnalysisType = {
    configData: KMeansClusterType;
    dataVariables: any[];
    variables: any[];
};

export type KMeansClusterFinalResultType = {
    formattedResult: ResultJson;
    configData: KMeansClusterType;
    variables: Variable[];
};
