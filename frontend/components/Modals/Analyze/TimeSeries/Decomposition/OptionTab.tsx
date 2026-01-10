import React, { FC } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DecompositionMethod {
    value: string;
    label: string;
}

interface TrendedMethod {
    value: string;
    label: string;
}

interface OptionTabProps{
    decompositionMethods: DecompositionMethod[],
    selectedDecompositionMethod: string[],
    trendedMethods: TrendedMethod[],
    selectedTrendedMethod: string[],
    handleSelectedDecompositionMethod: (method: string) => void,
    inputSelectedDecompositionMethod: (method: string) => React.ReactNode
}

const OptionTab: FC<OptionTabProps> = ({
    decompositionMethods,
    selectedDecompositionMethod,
    trendedMethods,
    selectedTrendedMethod,
    handleSelectedDecompositionMethod,
    inputSelectedDecompositionMethod,
}) => {
    return(
        <div className="border-2 rounded-md w-full p-4 flex flex-col gap-4">
            <label className="font-semibold">Decomposition Method</label>
            
            <RadioGroup
                value={selectedDecompositionMethod[0]}
                onValueChange={(value) => handleSelectedDecompositionMethod(value)}
                className="flex flex-row gap-4"
            >
                {decompositionMethods.map((method) => (
                    <div key={method.value} className="flex items-center space-x-2">
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
            {inputSelectedDecompositionMethod(selectedDecompositionMethod[0])}
        </div>
    )
}

export default OptionTab;