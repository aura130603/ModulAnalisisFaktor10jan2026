import {FactorType} from "./factor";
import {ResultJson} from "@/types/Table";

export type FactorAnalysisType = {
    configData: FactorType;
    dataVariables: any[];
    variables: any[];
};

export type FactorFinalResultType = {
    formattedResult: ResultJson;
};
