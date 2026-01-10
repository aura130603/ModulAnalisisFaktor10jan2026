import React, { FC } from "react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface UnitRootMethod {
    value: string;
    label: string;
}

interface DifferenceOption {
    value: string;
    label: string;
}

interface EquationOption {
    value: string;
    label: string;
}

interface OptionTabProps {
    methods: UnitRootMethod[];
    differences: DifferenceOption[];
    equations: EquationOption[];
    selectedMethod: string[];
    selectedEquation: string[];
    selectedDifference: string[];
    lengthLag: number;
    handleMethodChange: (value: string) => void;
    handleEquationChange: (value: string) => void;
    handleDifferenceChange: (value: string) => void;
    handleLengthLag: (value: number) => void;
}

const OptionTab: FC<OptionTabProps> = ({
    methods,
    differences,
    equations,
    selectedMethod,
    selectedEquation,
    selectedDifference,
    lengthLag,
    handleMethodChange,
    handleEquationChange,
    handleDifferenceChange,
    handleLengthLag,
}) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 border-2 p-4 rounded-md w-full">
                <label className="w-[100px] font-semibold">Method:</label>
                <RadioGroup
                    value={selectedMethod[0]}
                    onValueChange={handleMethodChange}
                    className="flex flex-col gap-4"
                >
                    {methods.map((method) => (
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

            <div className="border-2 rounded-md w-full pb-2">
                <div className="mt-4 ml-4">
                    <label className="font-semibold">Unit Root Test Options:</label>
                </div>
                
                {/* Difference Selection */}
                <div className="w-full pl-4 pr-4 border-0 rounded-t-md flex flex-col gap-4 mt-4">
                    <Label className="w-[200px]">calculate on:</Label>
                    <RadioGroup
                        value={selectedDifference[0]}
                        onValueChange={handleDifferenceChange}
                        className="flex sm:flex-row flex-col gap-4"
                    >
                        {differences.map((difference) => (
                            <div key={difference.value} className="flex flex-row items-center space-x-2">
                                <RadioGroupItem
                                    value={difference.value}
                                    id={difference.value}
                                    className="w-4 h-4"
                                />
                                <label htmlFor={difference.value} className="text-sm font-medium text-gray-700">
                                    {difference.label}
                                </label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                
                {/* Equation Selection */}
                <div className="w-full pl-4 pr-4 border-0 rounded-t-md flex flex-col gap-4 mt-4">
                    <Label className="w-[120px]">equation: </Label>
                    <RadioGroup
                        value={selectedEquation[0]}
                        onValueChange={handleEquationChange}
                        className="flex sm:flex-row flex-col gap-4"
                    >
                        {equations.map((equation) => (
                            <div key={equation.value} className="flex flex-row items-center space-x-2">
                                <RadioGroupItem
                                    value={equation.value}
                                    id={equation.value}
                                    className="w-4 h-4"
                                />
                                <label htmlFor={equation.value} className="text-sm font-medium text-gray-700">
                                    {equation.label}
                                </label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                
                {/* Lag Length (shown only for augmented Dickey-Fuller) */}
                {selectedMethod[0] === 'augmented-dickey-fuller' && (
                    <div className="flex flex-row gap-4 ml-4 mt-4">
                        <div className="flex items-center">
                            <Label>lag length:</Label>
                        </div>
                        <Input 
                            type="number" 
                            className="w-[60px]" 
                            placeholder="1" 
                            min="1" 
                            max="10" 
                            step="1"
                            value={lengthLag}
                            onChange={(e) => handleLengthLag(Number(e.target.value))}
                        /> 
                    </div>
                )}
            </div>
        </div>
    );
}

export default OptionTab;