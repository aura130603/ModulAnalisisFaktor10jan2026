import React, { FC } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";  
import { Label } from "@/components/ui/label";

interface SmoothingMethod {
    value: string;
    label: string;
}

interface OptionTabProps{
    methods: SmoothingMethod[],
    selectedMethod: [string, string],
    inputParameters: (method: string) => React.ReactNode,
    handleSelectedMethod: (value: string, methods: SmoothingMethod[]) => void
}

const OptionTab: FC<OptionTabProps> = ({
    methods,
    selectedMethod,
    inputParameters,
    handleSelectedMethod,
}) => {
    return(
        <div className="w-full p-4 rounded-md border-2">
            <div>
                <label className="font-semibold">Smoothing Method</label>
            </div>
            <div className="w-3/4 border-0 rounded-t-md flex flex-row gap-4 mt-4">
                <div className="flex items-center">
                    <Label className="font-semibold">method:</Label>
                </div>
                <Select onValueChange={(value) => handleSelectedMethod(value, methods)} defaultValue={selectedMethod[1]}>
                    <SelectTrigger className="mr-2">
                        <SelectValue>{selectedMethod[1]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {methods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                                {method.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="mt-4">
                {inputParameters(selectedMethod[0])}
            </div>
        </div>
    )
};

export default OptionTab;