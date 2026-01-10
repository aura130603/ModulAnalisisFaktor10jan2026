import React, { FC } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OptionTabProps{
    arOrder: number,
    diffOrder: number,
    maOrder: number,
    handleArOrder: (value: number) => void,
    handleDiffOrder: (value: number) => void,
    handleMaOrder: (value: number) => void,
}

const OptionTab: FC<OptionTabProps> = ({
    arOrder,
    diffOrder,
    maOrder,
    handleArOrder,
    handleDiffOrder,
    handleMaOrder,
}) => {
    return(
        <div className="border-2 rounded-md w-full flex flex-col gap-4 py-4">
            <div className="ml-4">
                <label className="font-semibold">Parameter Order</label>
            </div>

            <div className="flex sm:flex-row flex-col gap-4 ml-4 mt-2">
                {/* AR Order */}
                <div className="flex flex-row gap-4 ml-4">
                    <div className="flex items-center">
                        <Label>p:</Label>
                    </div>
                    <Input 
                        type="number" 
                        className="w-[80px]" 
                        placeholder="1" 
                        min="0" 
                        max="5" 
                        step="1"
                        value={arOrder}
                        onChange={(e) => handleArOrder(Number(e.target.value))}
                    />
                </div>
                
                {/* Differencing Order */}
                <div className="flex flex-row gap-4 ml-4">
                    <div className="flex items-center">
                        <Label>d:</Label>
                    </div>
                    <Input 
                        type="number" 
                        className="w-[80px]" 
                        placeholder="1" 
                        min="0" 
                        max="2" 
                        step="1"
                        value={diffOrder}
                        onChange={(e) => handleDiffOrder(Number(e.target.value))}
                    />
                </div>
                
                {/* MA Order */}
                <div className="flex flex-row gap-4 ml-4">
                    <div className="flex items-center">
                        <Label>q:</Label>
                    </div>
                    <Input 
                        type="number" 
                        className="w-[80px]" 
                        placeholder="1" 
                        min="0" 
                        max="5" 
                        step="1"
                        value={maOrder}
                        onChange={(e) => handleMaOrder(Number(e.target.value))}
                    />
                </div>
            </div>
            <div className="ml-4 mt-2">
                <label className="w-full text-sm font-semibold">note: Method used is Conditional Least Square with L-BFGS Opmatization</label>
            </div>
        </div>
    )
}

export default OptionTab;