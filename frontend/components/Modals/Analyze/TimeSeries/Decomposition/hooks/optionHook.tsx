import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getFormData, saveFormData, clearFormData } from "@/hooks/useIndexedDB";

interface DecompositionMethod {
    value: string;
    label: string;
}

interface TrendedMethod {
    value: string;
    label: string;
}

const decompositionMethods: DecompositionMethod[] = [
    { value: 'additive', label: 'Additive' },
    { value: 'multiplicative', label: 'Multiplicative' },
];

const trendedMethods: TrendedMethod[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'exponential', label: 'Exponential' },
];

export function useOptionHook(
) {
    const [selectedDecompositionMethod, setSelectedDecompositionMethod] = useState<string[]>([
        'additive',
        'Additive',
    ]);
    const [selectedTrendedMethod, setSelectedTrendedMethod] = useState<string[]>([
        'linear',
        'Linear'
    ]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data from IndexedDB on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const saved = await getFormData("Decomposition");
                if (saved) {
                    // Load selectedPeriod
                    if (saved.selectedDecompositionMethod) {
                        setSelectedDecompositionMethod(saved.selectedDecompositionMethod);
                        const method = decompositionMethods.find(p => 
                            p.value === saved.selectedDecompositionMethod[0] && 
                            p.label === saved.selectedDecompositionMethod[1]
                        );
                    }
                    if (saved.selectedTrendedMethod) {
                        setSelectedTrendedMethod(saved.selectedTrendedMethod);
                        const method = trendedMethods.find(p => 
                            p.value === saved.selectedTrendedMethod[0] && 
                            p.label === saved.selectedTrendedMethod[1]
                        );
                    }
                } else {
                    // Use store defaults if no saved data
                    setSelectedDecompositionMethod(['additive', 'Additive']);
                    setSelectedTrendedMethod(['linear', 'Linear']);
                }
            } catch (err) {
                console.error("Failed to load time data:", err);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, [setSelectedDecompositionMethod, setSelectedTrendedMethod]);

    // Save to IndexedDB whenever relevant state changes (but only after initial load)
    useEffect(() => {
        if (!isLoaded) return;
        const dataToSave = {
            selectedDecompositionMethod,
            selectedTrendedMethod,
        };
        saveFormData("Decomposition", dataToSave).catch(console.error);
    }, [selectedDecompositionMethod, selectedTrendedMethod, isLoaded]);

    function handleSelectedDecompositionMethod(method: string) {
        setSelectedDecompositionMethod([
            method,
            decompositionMethods.find(m => m.value === method)?.label || ''
        ]);
    }

    function handleSelectedTrendedMethod(method: string) {
        setSelectedTrendedMethod([
            method,
            trendedMethods.find(m => m.value === method)?.label || ''
        ]);
    }

    function inputSelectedDecompositionMethod(method: string) {
        switch (method) {
        case 'multiplicative':
            return (
                <div className="flex flex-col gap-4">
                    <Label className="w-[120px]">trend: </Label>
                    <RadioGroup
                        value={selectedTrendedMethod[0]}
                        onValueChange={(value) => handleSelectedTrendedMethod(value)}
                        className="flex flex-row gap-4"
                    >
                        {trendedMethods.map((method) => (
                            <div key={method.value} className="flex flex-row items-center space-x-2">
                                <RadioGroupItem
                                    value={method.value}
                                    id={method.value}
                                    className="w-4 h-4"
                                />
                                <label htmlFor={method.value} className="text-sm font-medium text-gray-700">
                                    {method.label}
                                </label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            );
        default:
            return (<div></div>);
        }
    }

    function resetOptions() {
        // setSelectedDecompositionMethod(['additive', 'additive']);
        // setSelectedTrendedMethod(['linear', 'Linear']);
        clearFormData("Decomposition")
        .then(() => {
            setSelectedDecompositionMethod(['additive', 'Additive']);
            setSelectedTrendedMethod(['linear', 'Linear']);
        })
        .catch((e) => console.error("Failed to clear time data:", e));
    }

    return {
        selectedDecompositionMethod,
        selectedTrendedMethod,
        decompositionMethods,
        trendedMethods,
        handleSelectedDecompositionMethod,
        inputSelectedDecompositionMethod,
        resetOptions
    };
}
