"use client";

import React, { useState, useEffect } from "react";
import { InputRow } from "@/components/Modals/Analyze/TimeSeries/TimeSeriesInput";
import { getFormData, saveFormData, clearFormData } from "@/hooks/useIndexedDB";

type MethodParameters = {
    [key: string]: number[];
};

interface SmoothingMethod {
    value: string;
    label: string;
}

const defaultParameters: MethodParameters = {
    sma: [2, 0, 0],
    dma: [2, 0, 0],
    ses: [0.1, 0, 0],
    des: [0.1, 0, 0],
    holt: [0.1, 0.1, 0],
    winter: [0.1, 0.1, 0.1],
};

const methods: SmoothingMethod[] = [
    { value: 'sma', label: 'Simple Moving Average' },
    { value: 'dma', label: 'Double Moving Average' },
    { value: 'ses', label: 'Simple Exponential Smoothing' },
    { value: 'des', label: 'Double Exponential Smoothing' },
    { value: 'holt', label: 'Holt\'s Method Exponential Smoothing' },
    { value: 'winter', label: 'Winter\'s Method Exponential Smoothing' },
];

export function useOptionHook(
    ) {
    const initialMethod = methods[0]; // Default to the first method
    const [selectedMethod, setSelectedMethod] = useState<[string, string]>([
        initialMethod.value,
        initialMethod.label,
    ]);
    const [parameters, setParameters] = useState<number[]>(defaultParameters[initialMethod.value]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data from IndexedDB on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const saved = await getFormData("Smoothing");
                if (saved) {
                    // Load selectedPeriod
                    if (saved.selectedMethod) {
                        setSelectedMethod(saved.selectedMethod);
                        const method = methods.find(p => 
                            p.value === saved.selectedMethod[0] && 
                            p.label === saved.selectedMethod[1]
                        );
                    }
                    if (saved.parameter1 !== undefined || saved.parameter2 !== undefined || saved.parameter3 !== undefined) {
                        // Load dari individual parameters
                        const loadedParams = [
                            saved.parameter1 ?? 0,
                            saved.parameter2 ?? 0,
                            saved.parameter3 ?? 0
                        ];
                        setParameters(loadedParams);
                    }
                } else {
                    // Use store defaults if no saved data
                    setSelectedMethod([methods[0].value, methods[0].label]);
                    setParameters(defaultParameters[methods[0].value]);
                }
            } catch (err) {
                console.error("Failed to load time data:", err);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, [setSelectedMethod, setParameters]);

    // Save to IndexedDB whenever relevant state changes (but only after initial load)
    useEffect(() => {
        if (!isLoaded) return;
        const dataToSave = {
            selectedMethod,
            parameter1: parameters[0],
            parameter2: parameters[1],
            parameter3: parameters[2], // Default to 0 if not used
        };
        saveFormData("Smoothing", dataToSave).catch(console.error);
    }, [selectedMethod, parameters, isLoaded]);

    function handleSelectedMethod(value: string, methods: SmoothingMethod[]) {
        const methodLabel = methods.find((m) => m.value === value)?.label || "";
        setSelectedMethod([value, methodLabel]);
        
        // Set parameters sesuai method yang dipilih
        if (defaultParameters[value]) {
            setParameters([...defaultParameters[value]]);
        } else {
            setParameters([0, 0, 0]);
        }
    }

    // Prepare input parameters UI based on selected method
    function inputParameters(method: string) {
        switch (method) {
            case 'sma': case 'dma':
                return (
                    <InputRow 
                        label="distance" 
                        id="par1" 
                        value={parameters[0]} 
                        min={'2'} 
                        max={'11'} 
                        step={'1'} 
                        onChange={(value) => handleInputChange(0, value)} 
                    />
                );
            case 'ses': case 'des':
                return (
                    <InputRow 
                        label="alpha" 
                        id="par1" 
                        value={parameters[0]} 
                        min={'0.1'} 
                        max={'0.9'} 
                        step={'0.1'} 
                        onChange={(value) => handleInputChange(0, value)} 
                    />
                );
            case 'holt':
                return (
                    <div className="flex flex-col gap-4">
                        <InputRow 
                            label="alpha" 
                            id="par1" 
                            value={parameters[0]} 
                            min={'0.1'} 
                            max={'0.9'} 
                            step={'0.1'} 
                            onChange={(value) => handleInputChange(0, value)} 
                        />
                        <InputRow 
                            label="beta" 
                            id="par2" 
                            value={parameters[1]} 
                            min={'0.1'} 
                            max={'0.9'} 
                            step={'0.1'} 
                            onChange={(value) => handleInputChange(1, value)} 
                        />
                    </div>
                );
            case 'winter':
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-4">
                            <InputRow 
                                label="alpha" 
                                id="par1" 
                                value={parameters[0]} 
                                min={'0.1'} 
                                max={'0.9'} 
                                step={'0.1'} 
                                onChange={(value) => handleInputChange(0, value)} 
                            />
                            <InputRow 
                                label="beta" 
                                id="par2" 
                                value={parameters[1]} 
                                min={'0.1'} 
                                max={'0.9'} 
                                step={'0.1'} 
                                onChange={(value) => handleInputChange(1, value)} 
                            />
                            <InputRow 
                                label="gamma" 
                                id="par3" 
                                value={parameters[2]} 
                                min={'0.1'} 
                                max={'0.9'} 
                                step={'0.1'} 
                                onChange={(value) => handleInputChange(2, value)} 
                            />
                        </div>
                        <div className="flex flex-col mt-2 gap-2">
                            <label className="w-full text-sm font-semibold">note: winters method need time spesification with periodicity</label>
                            {/* <label className="w-full text-sm font-semibold"></label> */}
                        </div>
                    </div>
                );
            default:
                return (<div></div>);
        }
    };

    function handleInputChange(index: number, value: number) {
        setParameters((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const copy = [...prev];
        copy[index] = value;
        return copy;
        });
    }

    function resetOptions() {
        // setSelectedMethod(["sma", "Simple Moving Average"]);
        // setParameters(defaultParameters["sma"]);
        clearFormData("Smoothing")
        .then(() => {
            setSelectedMethod(["sma", "Simple Moving Average"]);
            setParameters(defaultParameters["sma"]);
        })
        .catch((e) => console.error("Failed to clear time data:", e));
    }

    return {
        selectedMethod,
        parameters,
        methods,
        inputParameters,
        setSelectedMethod,
        handleSelectedMethod,
        resetOptions,
    };
}