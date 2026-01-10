import { useState } from "react";
import { Variable } from "@/types/Variable";
import { useResultStore } from "@/stores/useResultStore";
import { handleUnitRootTest } from "@/components/Modals/Analyze/TimeSeries/UnitRootTest/analyze/analyze";

export function useAnalyzeHook(
    storeVariables: Variable[],
    data: any[],
    selectedMethod: string[],
    selectedEquation: string[],
    selectedDifference: string[],
    lengthLag: number,
    onClose: () => void
) {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);

    const { addLog, addAnalytic, addStatistic } = useResultStore();

    const validateInputs = () => {
        if (!storeVariables.length) return "Please select at least one variable.";
        if (lengthLag < 1 || lengthLag > 10) return "Lag length must be between 1 and 10.";
        return null;
    };

    const prepareData = () => {
        const dataVarDef = storeVariables[0];
        if (!dataVarDef) throw new Error("Selected variable not found");
        if (dataVarDef.type !== "NUMERIC") throw new Error("Selected variable is not numeric");

        let maxIndex = -1;
        data.forEach((row: any, idx: number) => {
            const rawValue = row[dataVarDef.columnIndex];
            if (rawValue !== null && rawValue !== "") maxIndex = idx;
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
        df_stat: any,
        coef_stat: any,
        sel_crit: any,
        methodName: string,
        dataVarDef: Variable
    ) => {
        const logMsg = `UNIT ROOT TEST: ${dataVarDef.label || dataVarDef.name} on ${selectedDifference[1]} ${selectedEquation[1]} ${selectedMethod[1] === 'augmented dickey-fuller' ? `with lag length ${lengthLag}` : ''}`;
        const logId = await addLog({ log: logMsg });

        const analyticId = await addAnalytic(logId, {
            title: `Unit Root Test: ${methodName}`,
            note: "",
        });

        if (resultMessage === "error") {
            await addStatistic(analyticId, {
                title: "Unit Root Test Error",
                output_data: resultMessage,
                components: "Unit Root Test Error",
                description: "An error occurred during the unit root test.",
            });
            return;
        } else {
            await addStatistic(analyticId, {
                title: `Description Table`,
                output_data: descriptionTable,
                components: `Description Table`,
                description: "Description of the unit root test results",
            });

            await addStatistic(analyticId, {
                title: `${methodName} Test Statistic`,
                output_data: df_stat,
                components: `${methodName} Test Statistic`,
                description: "Unit root test statistic results",
            });

            await addStatistic(analyticId, {
                title: `Coeficient Regression Test`,
                output_data: coef_stat,
                components: `Coeficient Regression Test`,
                description: "Coefficients of the regression used in the unit root test",
            });

            await addStatistic(analyticId, {
                title: `Selection Criterion`,
                output_data: sel_crit,
                components: `Selection Criterion`,
                description: "Selection criterion results",
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
                throw new Error("Data length is less than 20 observations.");
            }

            const [resultMessage, descriptionTable, testing, df_stat, coef_stat, sel_crit, methodName] = await handleUnitRootTest(
                dataValues,
                dataVarDef.name,
                selectedMethod[0],
                lengthLag,
                selectedEquation[0],
                selectedDifference[0]
            );

            console.log(dataValues)

            console.log("handleUnitRootTest result:", {
                descriptionTable,
                testing,
                df_stat,
                coef_stat,
                sel_crit,
                methodName,
            });

            await processResults(resultMessage, descriptionTable, df_stat, coef_stat, sel_crit, methodName, dataVarDef);

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
