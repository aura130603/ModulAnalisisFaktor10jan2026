import { useState } from "react";
import { Variable } from "@/types/Variable";
import { useResultStore } from "@/stores/useResultStore";
import { handleAutocorrelation } from "@/components/Modals/Analyze/TimeSeries/Autocorrelation/analyze/analyze";

export function useAnalyzeHook(
    storeVariable: Variable[],
    data: any[],
    selectedDifference: string[],
    selectedPeriod: string[],
    maximumLag: number,
    seasonally: boolean,
    onClose: () => void
) {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);

    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const validateInputs = () => {
        if (!storeVariable.length) {
            return "Please select at least one variable.";
        }
        if (selectedPeriod[1] === "Not Dated" && seasonally) {
            return "Please select another time specification.";
        }
        if (selectedPeriod[0] === '0' && seasonally) {
            return "Please select a time specification with periodicity.";
        }
        if (maximumLag < 10 || maximumLag > 20) {
            return "Lag length must be between 10 and 20.";
        }
        return null;
    };

    const prepareData = () => {
        const dataVarDef = storeVariable[0];
        if (!dataVarDef) {
            throw new Error("Selected variables not found");
        }
        if (dataVarDef.type !== "NUMERIC") {
            throw new Error("Selected variable is not numeric");
        }

        let maxIndex = -1;
        const selectedVars = [dataVarDef];
        data.forEach((row: any, idx: number) => {
            let hasData = false;
            for (const v of selectedVars) {
                if (row[v.columnIndex] !== null && row[v.columnIndex] !== "") {
                    hasData = true;
                    break;
                }
            }
            if (hasData) maxIndex = idx;
        });
        if (maxIndex < 0) maxIndex = 0;

        const dataValues: number[] = [];
        for (let i = 0; i <= maxIndex; i++) {
            const val = data[i][dataVarDef.columnIndex];
            const num = parseFloat(val);
            if (!isNaN(num)) dataValues.push(num);
        }

        return { dataValues, dataVarDef };
    };

    const processResults = async (
        resultMessage: string,
        descriptionTable: any,
        acfValue: any[],
        acf: any,
        pacf: any,
        acfGraphicJSON: any,
        pacfGraphicJSON: any,
        dataVarDef: Variable,
        selectedDifference: string[],
        seasonally: boolean,
        selectedPeriod: string[],
        maximumLag: number,
        addLog: any,
        addAnalytic: any,
        addStatistic: any
    ) => {
        const logMsg = `AUTOCORRELATION: ${dataVarDef.label || dataVarDef.name} on ${selectedDifference[1]}${seasonally ? ` with periodicity ${selectedPeriod[1]}` : ''} with maximum lag ${maximumLag}`;
        const logId = await addLog({ log: logMsg });

        const analyticId = await addAnalytic(logId, {
            title: `Autocorrelation`,
            note: "",
        });

        if (resultMessage === "error") {
            await addStatistic(analyticId, {
                title: "Error",
                output_data: resultMessage,
                components: "Error",
                description: "An error occurred during autocorrelation analysis.",
            });
            return;
        } else {
            await addStatistic(analyticId, {
                title: "Description Table",
                output_data: descriptionTable,
                components: "Description Table",
                description: "Description of the autocorrelation results",
            });

            await addStatistic(analyticId, {
                title: "Autocorrelation Table",
                output_data: acf,
                components: "Autocorrelation Table",
                description: "Autocorrelation function results",
            });

            await addStatistic(analyticId, {
                title: "Autocorrelation Correlogram",
                output_data: acfGraphicJSON,
                components: "Autocorrelation Correlogram",
                description: "Correlogram of the autocorrelation results",
            });

            await addStatistic(analyticId, {
                title: "Partial Autocorrelation Table",
                output_data: pacf,
                components: "Partial Autocorrelation Table",
                description: "Partial autocorrelation function results",
            });

            await addStatistic(analyticId, {
                title: "Partial Autocorrelation Correlogram",
                output_data: pacfGraphicJSON,
                components: "Partial Autocorrelation Correlogram",
                description: "Correlogram of the partial autocorrelation results",
            });
        }
    };

    const handleAnalyzes = async () => {
        const validationError = validateInputs();
        if (validationError) {
            setErrorMsg(validationError);
            return;
        }

        setErrorMsg(null);
        setIsCalculating(true);

        try {
            const { dataValues, dataVarDef } = prepareData();

            if (dataValues.length === 0) {
                throw new Error("No data available for the selected variable.");
            }

            if (dataValues.length < 20) {
                throw new Error("Data length must be at least 20 observations.");
            }

            const results = await handleAutocorrelation(
                dataValues,
                dataVarDef.name,
                maximumLag,
                selectedDifference[0],
                seasonally,
                Number(selectedPeriod[0])
            );

            await processResults(
                ...results,
                dataVarDef,
                selectedDifference,
                seasonally,
                selectedPeriod,
                maximumLag,
                addLog,
                addAnalytic,
                addStatistic
            );

            setIsCalculating(false);
            onClose();
        } catch (ex) {
            setErrorMsg(ex instanceof Error ? ex.message : "An unknown error occurred.");
            setIsCalculating(false);
        }
    };

    return {
        errorMsg,
        isCalculating,
        handleAnalyzes,
    };
}
