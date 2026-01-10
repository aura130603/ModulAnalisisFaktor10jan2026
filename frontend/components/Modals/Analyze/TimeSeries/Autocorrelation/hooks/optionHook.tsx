import { useState, useEffect } from "react";
import { getFormData, saveFormData, clearFormData } from "@/hooks/useIndexedDB";

interface DifferenceOption {
    value: string;
    label: string;
}

const differences: DifferenceOption[] = [
    { value: 'level', label: 'level' },
    { value: 'first-difference', label: 'first difference' },
    { value: 'second-difference', label: 'second difference' },
];

export function useOptionHook(

) {
    const [selectedDifference, setSelectedDifference] = useState<string[]>(['level', 'level']);
    const [maximumLag, setMaximumLag] = useState<number>(16);
    const [seasonally, setSeasonally] = useState<boolean>(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data from IndexedDB on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const saved = await getFormData("UnitRootTest");
                if (saved) {
                    // Load selectedDifference
                    if (saved.selectedDifference) {
                        setSelectedDifference(saved.selectedDifference);
                        const difference = differences.find(d => 
                            d.value === saved.selectedDifference[0] && 
                            d.label === saved.selectedDifference[1]
                        );
                    }
                    // Load maximumLag
                    if (saved.maximumLag !== undefined) {setMaximumLag(saved.maximumLag);}
                    // Load seasonally
                    if (saved.seasonally !== undefined) {setSeasonally(saved.seasonally);}
                } else {
                    // Use store defaults if no saved data
                    setSelectedDifference(['level', 'level']);
                    setMaximumLag(16);
                    setSeasonally(false);
                }
                setIsLoaded(true);
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, [setSelectedDifference, setMaximumLag, setSeasonally]);

    // Save to IndexedDB whenever relevant state changes (but only after initial load)
    useEffect(() => {
        if (!isLoaded) return;
        const dataToSave = {
            selectedDifference,
            maximumLag,
            seasonally,
        };
        saveFormData("UnitRootTest", dataToSave).catch(console.error);
    }, [selectedDifference, maximumLag, seasonally, isLoaded]);

    function handleSelectedDifference (value: string){
        const difference = differences.find(d => d.value === value);
        if (!difference) return;
        setSelectedDifference([difference.value, difference.label]);
    };

    function handleMaximumLag (value: number){
        setMaximumLag(value);
    };

    function handleSeasonally (value: boolean){
        setSeasonally(value);
    };

    const resetOptions = () => {
        // setSelectedDifference(['level', 'level']);
        // setMaximumLag(16);
        // setSeasonally(false);
        clearFormData("Autocorrelation")
        .then(() => {
            setSelectedDifference(['level', 'level']);
            setMaximumLag(16);
            setSeasonally(false);
        })
        .catch((e) => console.error("Failed to clear time data:", e));
    };

    return {
        differences,
        selectedDifference,
        maximumLag,
        seasonally,
        handleSelectedDifference,
        handleMaximumLag,
        handleSeasonally,
        resetOptions,
    };
}
