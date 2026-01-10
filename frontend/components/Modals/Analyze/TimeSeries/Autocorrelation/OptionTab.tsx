import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface DifferenceOption {
    value: string;
    label: string;
}

interface OptionTabProps {
    differences: DifferenceOption[];
    selectedDifference: string[];
    maximumLag: number;
    seasonally: boolean;
    handleSelectedDifference: (value: string) => void;
    handleMaximumLag: (value: number) => void;
    handleSeasonally: (value: boolean) => void;
}

const OptionTab: FC<OptionTabProps> = ({
    differences,
    selectedDifference,
    maximumLag,
    seasonally,
    handleSelectedDifference,
    handleMaximumLag,
    handleSeasonally,
}) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="border-2 rounded-md w-full pb-4">
                <div className="mt-4 ml-4">
                    <label className="font-semibold">Autocorrelation Options:</label>
                </div>
                
                {/* Maximum Lag */}
                <div className="w-full pl-4 border-0 rounded-t-md flex flex-row gap-4 mt-4">
                    <div className="flex items-center">
                        <Label>maximum lag:</Label>
                    </div>
                    <Input 
                        type="number" 
                        className="w-[60px]" 
                        placeholder="10" 
                        min="10" 
                        max="20" 
                        step="1"
                        value={maximumLag}
                        onChange={(e) => handleMaximumLag(Number(e.target.value))}
                    />
                </div>
                
                {/* Seasonally Checkbox */}
                <div className="w-full pl-4 border-0 rounded-t-md flex flex-row gap-4 mt-4">
                    <div className="flex flex-row gap-2">
                        <Checkbox 
                            checked={seasonally} 
                            onCheckedChange={(isChecked) => handleSeasonally(Boolean(isChecked))}
                        />
                        <Label>seasonally difference</Label>
                    </div>
                </div>
                
                {/* Difference Selection */}
                <div className="w-full pl-4 pr-4 border-0 rounded-t-md flex flex-col gap-4 mt-5">
                    <Label className="w-[200px]">autocorrelate on:</Label>
                    <RadioGroup
                        value={selectedDifference[0]}
                        onValueChange={handleSelectedDifference}
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
                <div className="ml-4 mt-2">
                    <label className="w-full text-sm font-semibold">note: Standard error are calculate with Bartlet Approximation</label>
                </div>
            </div>
        </div>
    );
}

export default OptionTab;