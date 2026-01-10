import { useState, useEffect, useCallback } from "react";
import { useMetaStore } from "@/stores/useMetaStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import type { TimeComponent } from "../types";
import {
    getTimeComponentsFromCase,
    formatDateForMetaStore,
    formatCurrentDates,
    getMaxRow
} from "../utils/dateTimeFormatters";
import { prepareDateVariables } from "../services/dateTimeService";

export const useDefineDateTime = (onClose: () => void) => {
    const { setMeta } = useMetaStore();
    const { variables, addVariables, resetVariables } = useVariableStore();
    const { data } = useDataStore();

    const casesAreOptions: string[] = [
        "Years",
        "Years, quarters",
        "Years, months",
        "Years, quarters, months",
        "Days",
        "Weeks, days",
        "Weeks, work days(5)",
        "Weeks, work days(6)",
        "Hours",
        "Days, hours",
        "Days, work hour(8)",
        "Weeks, days, hours",
        "Weeks, work days, hours",
        "Minutes",
        "Hours, minutes",
        "Days, hours, minutes",
        "Seconds",
        "Minutes, seconds",
        "Hours, minutes, seconds",
        "Not dated"
    ];
    const [selectedCase, setSelectedCase] = useState<string>("Not dated");

    const [timeComponents, setTimeComponents] = useState<TimeComponent[]>(() => {
        return getTimeComponentsFromCase("Not dated");
    });

    useEffect(() => {
        const components = getTimeComponentsFromCase(selectedCase);
        setTimeComponents(components);
    }, [selectedCase]);

    const handleInputChange = useCallback((index: number, value: number) => {
        setTimeComponents(prevComponents => {
            const updatedComponents = [...prevComponents];
            updatedComponents[index] = { ...updatedComponents[index], value };
            return updatedComponents;
        });
    }, []);

    const handleOk = useCallback(async () => {
        if (selectedCase === "Not dated") {
            await resetVariables();
            await setMeta({ dates: "" });
            onClose();
            return;
        }

        const dateString = formatDateForMetaStore(selectedCase, timeComponents);
        await setMeta({ dates: dateString });

        const { variablesToCreate, cellUpdates } = prepareDateVariables(
            timeComponents,
            variables,
            getMaxRow(data)
        );
        
        if (variablesToCreate.length > 0) {
            await addVariables(variablesToCreate, cellUpdates);
        }

        onClose();
    }, [selectedCase, timeComponents, variables, addVariables, resetVariables, data, setMeta, onClose]);

    const handleReset = useCallback(() => {
        setSelectedCase("Not dated");
    }, []);

    const currentDatesFormatted = formatCurrentDates(selectedCase, timeComponents);

    return {
        casesAreOptions,
        selectedCase,
        setSelectedCase,
        timeComponents,
        handleInputChange,
        handleOk,
        handleReset,
        currentDatesFormatted
    };
}; 