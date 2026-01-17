// "use client";

// import React, { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import {
//     FactorExtractionProps,
//     FactorExtractionType,
// } from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
// import {
//     ResizableHandle,
//     ResizablePanel,
//     ResizablePanelGroup,
// } from "@/components/ui/resizable";
// import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import {
//     Select,
//     SelectContent,
//     SelectGroup,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import { EXTRACTIONMETHOD } from "@/components/Modals/Analyze/dimension-reduction/factor/constants/factor-method";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Input } from "@/components/ui/input";
// import { CheckedState } from "@radix-ui/react-checkbox";

// export const FactorExtraction = ({
//     isExtractionOpen,
//     setIsExtractionOpen,
//     updateFormData,
//     data,
// }: FactorExtractionProps) => {
//     const [extractionState, setExtractionState] =
//         useState<FactorExtractionType>({ ...data });
//     const [isContinueDisabled] = useState(false);

//     useEffect(() => {
//         if (isExtractionOpen) {
//             setExtractionState({ ...data });
//         }
//     }, [isExtractionOpen, data]);

//     const handleChange = (
//         field: keyof FactorExtractionType,
//         value: CheckedState | number | string | null
//     ) => {
//         setExtractionState((prev) => ({
//             ...prev,
//             [field]: value,
//         }));
//     };

//     const handleAnalyzeGrp = (value: string) => {
//         setExtractionState((prev) => ({
//             ...prev,
//             Correlation: value === "Correlation",
//             Covariance: value === "Covariance",
//         }));
//     };

//     const handleExtractGrp = (value: string) => {
//         setExtractionState((prev) => ({
//             ...prev,
//             Eigen: value === "Eigen",
//             Factor: value === "Factor",
//         }));
//     };

//     const handleContinue = () => {
//         Object.entries(extractionState).forEach(([key, value]) => {
//             updateFormData(key as keyof FactorExtractionType, value);
//         });
//         setIsExtractionOpen(false);
//     };

//     if (!isExtractionOpen) return null;

//     return (
//         <div className="h-full flex flex-col bg-popover text-popover-foreground">

//             {/* CONTENT (langsung, tanpa header) */}
//             <div className="flex-grow overflow-auto px-6 py-4 flex flex-col gap-4">
//                 <Separator />

//                 <div className="w-full">
//                     <Label className="font-bold">Growing Method</Label>
//                     <Select
//                         value={extractionState.Method ?? "PrincipalComp"}
//                         onValueChange={(value) =>
//                             handleChange("Method", value)
//                         }
//                     >
//                         <SelectTrigger>
//                             <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectGroup>
//                                 {EXTRACTIONMETHOD.map((method, index) => (
//                                     <SelectItem
//                                         key={index}
//                                         value={method.value}
//                                     >
//                                         {method.name}
//                                     </SelectItem>
//                                 ))}
//                             </SelectGroup>
//                         </SelectContent>
//                     </Select>
//                 </div>

//                 <ResizablePanelGroup
//                     direction="vertical"
//                     className="min-h-[300px] rounded-lg border"
//                 >
//                     <ResizablePanel defaultSize={33}>
//                         <ResizablePanelGroup direction="horizontal">
//                             <ResizablePanel defaultSize={50}>
//                                 <div className="flex flex-col gap-2 p-2">
//                                     <Label className="font-bold">Analyze</Label>
//                                     <RadioGroup
//                                         value={
//                                             extractionState.Correlation
//                                                 ? "Correlation"
//                                                 : "Covariance"
//                                         }
//                                         onValueChange={handleAnalyzeGrp}
//                                     >
//                                         <div className="flex items-center space-x-2">
//                                             <RadioGroupItem
//                                                 value="Correlation"
//                                                 id="Correlation"
//                                             />
//                                             <Label htmlFor="Correlation">
//                                                 Correlation Matrix
//                                             </Label>
//                                         </div>
//                                         <div className="flex items-center space-x-2">
//                                             <RadioGroupItem
//                                                 value="Covariance"
//                                                 id="Covariance"
//                                             />
//                                             <Label htmlFor="Covariance">
//                                                 Covariance Matrix
//                                             </Label>
//                                         </div>
//                                     </RadioGroup>
//                                 </div>
//                             </ResizablePanel>

//                             <ResizableHandle />

//                             <ResizablePanel defaultSize={50}>
//                                 <div className="flex flex-col gap-2 p-2">
//                                     <Label className="font-bold">Display</Label>

//                                     <div className="flex items-center space-x-2">
//                                         <Checkbox
//                                             id="Unrotated"
//                                             checked={extractionState.Unrotated}
//                                             onCheckedChange={(checked) =>
//                                                 handleChange("Unrotated", checked)
//                                             }
//                                         />
//                                         <Label htmlFor="Unrotated">
//                                             Unrotated Factor Solution
//                                         </Label>
//                                     </div>

//                                     <div className="flex items-center space-x-2">
//                                         <Checkbox
//                                             id="Scree"
//                                             checked={extractionState.Scree}
//                                             onCheckedChange={(checked) =>
//                                                 handleChange("Scree", checked)
//                                             }
//                                         />
//                                         <Label htmlFor="Scree">
//                                             Scree Plot
//                                         </Label>
//                                     </div>
//                                 </div>
//                             </ResizablePanel>
//                         </ResizablePanelGroup>
//                     </ResizablePanel>

//                     <ResizableHandle />

//                     <ResizablePanel defaultSize={67}>
//                         <div className="flex flex-col gap-3 p-2">
//                             <Label className="font-bold">Extract</Label>

//                             <RadioGroup
//                                 value={
//                                     extractionState.Eigen
//                                         ? "Eigen"
//                                         : "Factor"
//                                 }
//                                 onValueChange={handleExtractGrp}
//                             >
//                                 <div className="flex flex-col gap-2">
//                                     <div className="flex items-center space-x-2">
//                                         <RadioGroupItem value="Eigen" id="Eigen" />
//                                         <Label htmlFor="Eigen">
//                                             Based on Eigenvalues
//                                         </Label>
//                                     </div>

//                                     <div className="flex items-center space-x-2 pl-6">
//                                         <Label className="w-[160px]">
//                                             Eigenvalues Greater than:
//                                         </Label>
//                                         <Input
//                                             type="number"
//                                             className="w-[80px]"
//                                             value={extractionState.EigenVal ?? ""}
//                                             disabled={!extractionState.Eigen}
//                                             onChange={(e) =>
//                                                 handleChange(
//                                                     "EigenVal",
//                                                     Number(e.target.value)
//                                                 )
//                                             }
//                                         />
//                                     </div>

//                                     <div className="flex items-center space-x-2">
//                                         <RadioGroupItem value="Factor" id="Factor" />
//                                         <Label htmlFor="Factor">
//                                             Fixed Number of Factors
//                                         </Label>
//                                     </div>

//                                     <div className="flex items-center space-x-2 pl-6">
//                                         <Label className="w-[160px]">
//                                             Factors to Extract:
//                                         </Label>
//                                         <Input
//                                             type="number"
//                                             className="w-[80px]"
//                                             value={extractionState.MaxFactors ?? ""}
//                                             disabled={!extractionState.Factor}
//                                             onChange={(e) =>
//                                                 handleChange(
//                                                     "MaxFactors",
//                                                     Number(e.target.value)
//                                                 )
//                                             }
//                                         />
//                                     </div>
//                                 </div>
//                             </RadioGroup>
//                         </div>
//                     </ResizablePanel>
//                 </ResizablePanelGroup>

//                 <div className="flex items-center gap-4">
//                     <Label className="w-[260px]">
//                         Maximum Iterations for Convergence:
//                     </Label>
//                     <Input
//                         type="number"
//                         className="w-[80px]"
//                         value={extractionState.MaxIter ?? ""}
//                         onChange={(e) =>
//                             handleChange("MaxIter", Number(e.target.value))
//                         }
//                     />
//                 </div>
//             </div>

//             {/* FOOTER */}
//             <div className="border-t border-border px-6 py-4 flex gap-2">
//                 <Button disabled={isContinueDisabled} onClick={handleContinue}>
//                     Continue
//                 </Button>
//                 <Button
//                     variant="secondary"
//                     onClick={() => setIsExtractionOpen(false)}
//                 >
//                     Cancel
//                 </Button>
//                 <Button variant="secondary">Help</Button>
//             </div>
//         </div>
//     );
// };














// perbaikan UI 15/1/2026
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    FactorExtractionProps,
    FactorExtractionType,
} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EXTRACTIONMETHOD } from "@/components/Modals/Analyze/dimension-reduction/factor/constants/factor-method";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CheckedState } from "@radix-ui/react-checkbox";

// Pastikan string value ini SAMA PERSIS dengan value yang ada di file constants/factor-method.ts Anda
const RESTRICTED_METHODS = [
    "UnweightLeastSqr",
    "GeneralizedLeastSqr",
    "MaxLikelihood",
];

export const FactorExtraction = ({
    isExtractionOpen,
    setIsExtractionOpen,
    updateFormData,
    data,
}: FactorExtractionProps) => {
    const [extractionState, setExtractionState] =
        useState<FactorExtractionType>({ ...data });
    const [isContinueDisabled] = useState(false);

    // Cek apakah metode saat ini termasuk metode yang membatasi Correlation/Covariance
    const isRestrictedMethod = RESTRICTED_METHODS.includes(
        extractionState.Method ?? ""
    );

    useEffect(() => {
        if (isExtractionOpen) {
            setExtractionState({ ...data });
        }
    }, [isExtractionOpen, data]);

    const handleChange = (
        field: keyof FactorExtractionType,
        value: CheckedState | number | string | null
    ) => {
        setExtractionState((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handler khusus saat Method berubah
    const handleMethodChange = (value: string) => {
        const shouldRestrict = RESTRICTED_METHODS.includes(value);

        setExtractionState((prev) => ({
            ...prev,
            Method: value,
            // Jika restricted, paksa Correlation=True dan Covariance=False
            Correlation: shouldRestrict ? true : prev.Correlation,
            Covariance: shouldRestrict ? false : prev.Covariance,
        }));
    };

    const handleAnalyzeGrp = (value: string) => {
        setExtractionState((prev) => ({
            ...prev,
            Correlation: value === "Correlation",
            Covariance: value === "Covariance",
        }));
    };

    const handleExtractGrp = (value: string) => {
        setExtractionState((prev) => ({
            ...prev,
            Eigen: value === "Eigen",
            Factor: value === "Factor",
        }));
    };

    const handleContinue = () => {
        Object.entries(extractionState).forEach(([key, value]) => {
            updateFormData(key as keyof FactorExtractionType, value);
        });
        setIsExtractionOpen(false);
    };

    if (!isExtractionOpen) return null;

    return (
        <div className="h-full flex flex-col bg-popover text-popover-foreground">

            {/* CONTENT (langsung, tanpa header) */}
            <div className="flex-grow overflow-auto px-6 py-4 flex flex-col gap-4">
                <Separator />

                <div className="w-full">
                    <Label className="font-bold">Growing Method</Label>
                    <Select
                        value={extractionState.Method ?? "PrincipalComp"}
                        onValueChange={handleMethodChange} // Gunakan handler baru di sini
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {EXTRACTIONMETHOD.map((method, index) => (
                                    <SelectItem
                                        key={index}
                                        value={method.value}
                                    >
                                        {method.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <ResizablePanelGroup
                    direction="vertical"
                    className="min-h-[300px] rounded-lg border"
                >
                    <ResizablePanel defaultSize={33}>
                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel defaultSize={50}>
                                <div className="flex flex-col gap-2 p-2">
                                    <Label className="font-bold">Analyze</Label>
                                    <RadioGroup
                                        value={
                                            extractionState.Correlation
                                                ? "Correlation"
                                                : "Covariance"
                                        }
                                        onValueChange={handleAnalyzeGrp}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                value="Correlation"
                                                id="Correlation"
                                                // Opsional: Disable correlation juga jika ingin user tidak bisa klik sama sekali
                                                // disabled={isRestrictedMethod} 
                                            />
                                            <Label htmlFor="Correlation">
                                                Correlation Matrix
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                value="Covariance"
                                                id="Covariance"
                                                disabled={isRestrictedMethod} // Disable saat restricted method terpilih
                                            />
                                            <Label 
                                                htmlFor="Covariance"
                                                className={isRestrictedMethod ? "text-muted-foreground" : ""}
                                            >
                                                Covariance Matrix
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </ResizablePanel>

                            <ResizableHandle />

                            <ResizablePanel defaultSize={50}>
                                <div className="flex flex-col gap-2 p-2">
                                    <Label className="font-bold">Display</Label>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="Unrotated"
                                            checked={extractionState.Unrotated}
                                            onCheckedChange={(checked) =>
                                                handleChange("Unrotated", checked)
                                            }
                                        />
                                        <Label htmlFor="Unrotated">
                                            Unrotated Factor Solution
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="Scree"
                                            checked={extractionState.Scree}
                                            onCheckedChange={(checked) =>
                                                handleChange("Scree", checked)
                                            }
                                        />
                                        <Label htmlFor="Scree">
                                            Scree Plot
                                        </Label>
                                    </div>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel defaultSize={67}>
                        <div className="flex flex-col gap-3 p-2">
                            <Label className="font-bold">Extract</Label>

                            <RadioGroup
                                value={
                                    extractionState.Eigen
                                        ? "Eigen"
                                        : "Factor"
                                }
                                onValueChange={handleExtractGrp}
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Eigen" id="Eigen" />
                                        <Label htmlFor="Eigen">
                                            Based on Eigenvalues
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2 pl-6">
                                        <Label className="w-[160px]">
                                            Eigenvalues Greater than:
                                        </Label>
                                        <Input
                                            type="number"
                                            className="w-[80px]"
                                            value={extractionState.EigenVal ?? ""}
                                            disabled={!extractionState.Eigen}
                                            onChange={(e) =>
                                                handleChange(
                                                    "EigenVal",
                                                    Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Factor" id="Factor" />
                                        <Label htmlFor="Factor">
                                            Fixed Number of Factors
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2 pl-6">
                                        <Label className="w-[160px]">
                                            Factors to Extract:
                                        </Label>
                                        <Input
                                            type="number"
                                            className="w-[80px]"
                                            value={extractionState.MaxFactors ?? ""}
                                            disabled={!extractionState.Factor}
                                            onChange={(e) =>
                                                handleChange(
                                                    "MaxFactors",
                                                    Number(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>

                <div className="flex items-center gap-4">
                    <Label className="w-[260px]">
                        Maximum Iterations for Convergence:
                    </Label>
                    <Input
                        type="number"
                        className="w-[80px]"
                        value={extractionState.MaxIter ?? ""}
                        onChange={(e) =>
                            handleChange("MaxIter", Number(e.target.value))
                        }
                    />
                </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-border px-6 py-4 flex gap-2">
                <Button disabled={isContinueDisabled} onClick={handleContinue}>
                    Continue
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => setIsExtractionOpen(false)}
                >
                    Cancel
                </Button>
                <Button variant="secondary">Help</Button>
            </div>
        </div>
    );
};