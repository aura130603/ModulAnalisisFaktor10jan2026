import { useState, useEffect } from "react";
import { getFormData, saveFormData, clearFormData } from "@/hooks/useIndexedDB";

export function useOptionHook(
) {

    const [arOrder, setArOrder] = useState<number>(0);
    const [diffOrder, setDiffOrder] = useState<number>(0);
    const [maOrder, setMaOrder] = useState<number>(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data from IndexedDB on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const saved = await getFormData("BoxJenkinsModel");
                if (saved) {
                    // Load AR order
                    if (saved.arOrder !== undefined) {
                        setArOrder(saved.arOrder);
                    }
                    // Load differencing order
                    if (saved.diffOrder !== undefined) {
                        setDiffOrder(saved.diffOrder);
                    }
                    // Load MA order
                    if (saved.maOrder !== undefined) {
                        setMaOrder(saved.maOrder);
                    }
                } else {
                    // Use store defaults if no saved data
                    setArOrder(0);
                    setDiffOrder(0);
                    setMaOrder(0);
                }
                setIsLoaded(true);
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, [setArOrder, setDiffOrder, setMaOrder]);

    // Save to IndexedDB whenever relevant state changes (but only after initial load)
    useEffect(() => {
        if (!isLoaded) return;
        const dataToSave = {
            arOrder,
            diffOrder,
            maOrder,
        };
        saveFormData("BoxJenkinsModel", dataToSave).catch(console.error);
    }, [arOrder, diffOrder, maOrder, isLoaded]);

    function handleArOrder(value: number) {
        setArOrder(value);
    }

    function handleDiffOrder(value: number) {
        setDiffOrder(value);
    }

    function handleMaOrder(value: number) {
        setMaOrder(value);
    }

    function resetOptions() {
        // setArOrder(0);
        // setDiffOrder(0);
        // setMaOrder(0);
        clearFormData("BoxJenkinsModel")
        .then(() => {
            setArOrder(0);
            setDiffOrder(0);
            setMaOrder(0);
        })
        .catch((e) => console.error("Failed to clear time data:", e));
    }

    return {
        arOrder,
        diffOrder,
        maOrder,
        handleArOrder,
        handleDiffOrder,
        handleMaOrder,
        resetOptions,
    };
}
