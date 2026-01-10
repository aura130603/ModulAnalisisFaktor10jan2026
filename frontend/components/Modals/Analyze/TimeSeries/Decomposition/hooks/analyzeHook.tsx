import { useState } from "react";
import { handleDecomposition } from "@/components/Modals/Analyze/TimeSeries/Decomposition/analyze/analyze";
import { Variable } from "@/types/Variable";
import { useResultStore } from "@/stores/useResultStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useTimeSeriesStore } from "@/stores/useTimeSeriesStore";

export function useAnalyzeHook(
    selectedDecompositionMethod: string[],
    selectedTrendedMethod: string[],
    selectedPeriod: string[],
    storeVariables: Variable[],
    data: any[],
    saveDecomposition: boolean,
    onClose: () => void
) {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);

    const { addLog, addAnalytic, addStatistic } = useResultStore();
    const { addVariable, variables } = useVariableStore();
    const { updateCells } = useDataStore();
    const { getTypeDate, getHour, getDay, getMonth, getYear, getDayName } = useTimeSeriesStore();

    const validateInputs = () => {
        if (storeVariables.length === 0) 
            return "Please select at least one variable.";
        if (!selectedTrendedMethod[0]) 
            return "Please select a method.";
        if (selectedPeriod[1] === "Not Dated") 
            return "Please select another time specification.";
        if (selectedPeriod[0] === "0") 
            return "Selected time specification doesn't have periodicity.";
        return null;
    };

    const prepareData = () => {
        const dataVarDef = storeVariables[0];
        if (!dataVarDef) throw new Error("Selected variables not found");
        if (dataVarDef.type !== "NUMERIC") throw new Error("Selected variable is not numeric.");
        
        // Extract numeric data values only
        const dataValues = data
        .map((row: any) => {
            const val = row[dataVarDef.columnIndex];
            const num = parseFloat(val);
            return isNaN(num) ? null : num;
        })
        .filter(v => v !== null);

        return { dataValues, dataVarDef };
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
            // Validate periodicity and data length
            const periodicity = Number(selectedPeriod[0]);
            
            if (dataValues.length < 4 * periodicity) {
                throw new Error("Data length is less than 4 times the periodicity.");
            }

            if (dataValues.length % periodicity !== 0) {
                throw new Error("Data length is not a multiple of the periodicity.");
            }

            const results = await handleDecomposition(
                dataValues,
                dataVarDef.name,
                selectedDecompositionMethod[0],
                selectedTrendedMethod[0],
                Number(selectedPeriod[0]),
                selectedPeriod[1],
                getTypeDate(),
                getHour(),
                getDay(),
                getMonth(),
                getYear()
            );

            // Process and save results - implement similar to your existing logic here
            await processDecompositionResults(results, dataVarDef);

            setIsCalculating(false);
            onClose();
        } catch (ex) {
            setErrorMsg(ex instanceof Error ? ex.message : "An unknown error occurred.");
            setIsCalculating(false);
        }
    };

    const saveDecompositionResults = async (
        seasonal: any[],
        trend: any[],
        irrengular: any[],
        forecasting: any[],
        dataVarDef: Variable
    ) => {
        let nextColumnIndex = variables.length; // Start from the next available column index
        
        // Helper function to add a component as a new variable
        const addComponentAsVariable = async (
            componentValues: any[],
            componentType: string,
            suffix: string
        ) => {
            // Create variable definition
            const variableName = `${dataVarDef.name}-${suffix}`;
            
            const newVariable: Partial<Variable> = {
                name: variableName,
                columnIndex: nextColumnIndex,
                type: "NUMERIC",
                label: `${dataVarDef.label || dataVarDef.name} (${componentType})`,
                values: [],
                missing: null,
                measure: "scale",
                width: 8,
                decimals: 3,
                columns: 100,
                align: "right",
            };
            
            // Add variable
            await addVariable(newVariable);
            
            // Prepare updates array
            const updates = [];
            
            // Add each value to the updates array
            for (let rowIndex = 0; rowIndex < componentValues.length; rowIndex++) {
                if (newVariable.columnIndex !== undefined) {
                    updates.push({
                        row: rowIndex,
                        col: newVariable.columnIndex,
                        value: componentValues[rowIndex].toString()
                    });
                }
            }
            
            // Use bulk update to efficiently add all data
            if (updates.length > 0) {
                await updateCells(updates);
            }
            
            // Increment column index for next variable
            nextColumnIndex++;
        };
        
        // Add each component as a variable
        await addComponentAsVariable(seasonal, "Seasonal Component", "SC");
        await addComponentAsVariable(trend, "Trend Component", "TC");
        await addComponentAsVariable(irrengular, "Irregular Component", "IC");
        await addComponentAsVariable(forecasting, "Forecasting", "Forecasting");
    };
    
    const processDecompositionResults = async (
        results: [any, any, any[], any[], any[], any[], any[], any, any, any, any, any, any, any, any],
        dataVarDef: Variable,
    ) => {
        const [resultMessage, descriptionTable, testing, seasonal, trend, irrengular, forecasting, 
            evaluation, seasonIndices, equation, graphicForecasting, graphicData, graphicTrend, 
            graphicSeasonal, graphicIrregular] = results;

        // Create log entry
        const logMsg = `DECOMPOSITION: ${dataVarDef.label ? dataVarDef.label + ' Using' : dataVarDef.name + ' Using'} ${selectedDecompositionMethod[1]}.`;
        const logId = await addLog({ log: logMsg });

        // Create analytic entry
        const analyticId = await addAnalytic(logId, {
            title: `Decomposition ${selectedDecompositionMethod[1]}`,
            note: "",
        });

        if (resultMessage === "error") {
            await addStatistic(analyticId, {
                title: "Decomposition Error",
                output_data: resultMessage,
                components: "Decomposition Error",
                description: "An error occurred during decomposition analysis.",
            });
        } else {
            // Add seasonal indices statistic
            await addStatistic(analyticId, {
                title: "Description Table",
                output_data: descriptionTable,
                components: "Description Table",
                description: "Description of the decomposition results",
            });

            await addStatistic(analyticId, {
                title: `Graphic ${dataVarDef.name}`,
                output_data: graphicData,
                components: `Graphic ${dataVarDef.name}`,
                description: "Graphic of the original data",
            });
            
            await addStatistic(analyticId, {
                title: "Graphic Trend",
                output_data: graphicTrend,
                components: "Graphic Trend",
                description: "Graphic Trend Component",
            });
            
            await addStatistic(analyticId, {
                title: "Graphic Seasonal",
                output_data: graphicSeasonal,
                components: "Graphic Seasonal",
                description: "Graphic Seasonal Component",
            });
            
            await addStatistic(analyticId, {
                title: "Graphic Irregular",
                output_data: graphicIrregular,
                components: "Graphic Irregular",
                description: "Graphic Irregular Component",
            });
            
            await addStatistic(analyticId, {
                title: "Seasonal Indices",
                output_data: seasonIndices,
                components: "Seasonal Indices",
                description: "Seasonal Indices for the data",
            });

            // Add equation for multiplicative method
            if (selectedDecompositionMethod[0] === 'multiplicative') {
                await addStatistic(analyticId, {
                    title: "Equation",
                    output_data: equation,
                    components: "Equation Trend",
                    description: "Equation for the trend component",
                });
            }
            
            await addStatistic(analyticId, {
                title: "Graphic Forecasting",
                output_data: graphicForecasting,
                components: "Graphic Forecasting",
                description: "Graphic of the forecasting results",
            });

            // Add evaluation statistic
            await addStatistic(analyticId, {
                title: "Evalution",
                output_data: evaluation,
                components: "Forecasting Evaluation",
                description: "Evaluation results for the forecasting",
            });

            // Save as variables if requested
            if (saveDecomposition) {
                await saveDecompositionResults(seasonal, trend, irrengular, forecasting, dataVarDef);
            }
        }
    };

    return {
        errorMsg,
        isCalculating,
        handleAnalyzes,
    };
}
