"use client";

import React from "react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertTriangle, HelpCircle } from "lucide-react";
import { Variable } from "@/types/Variable";
import type { TargetListConfig } from "@/components/Common/VariableListManager";
import VariableListManager from "@/components/Common/VariableListManager";
import { RestructureMethod } from "./types";
import type { UseRestructureReturn } from "./hooks/useRestructure";

interface RestructureUIProps {
    hook: UseRestructureReturn;
    onClose: () => void;
}

export const RestructureUI: React.FC<RestructureUIProps> = ({ hook, onClose }) => {
    const {
        currentStep,
        activeTab,
        method,
        availableVariables,
        selectedVariables,
        indexVariables,
        identifierVariables,
        highlightedVariable,
        createCount,
        createIndex,
        dropEmptyVariables,
        validationErrors,
        setActiveTab,
        setMethod,
        setHighlightedVariable,
        setCreateCount,
        setCreateIndex,
        setDropEmptyVariables,
        handleNext,
        handleBack,
        handleFinish,
        handleMoveVariable,
        handleReorderVariable,
    } = hook;

    // Get step configuration based on current step
    const getStepConfig = () => {
        return {
            canProceed: currentStep < 3,
            canGoBack: currentStep > 1,
            showFinish: currentStep === 3,
            stepTitle: currentStep === 1 ? "Select Restructure Method" :
                      currentStep === 2 ? "Configure Variables" : "Set Options"
        };
    };

    const stepConfig = getStepConfig();    // Get target list configurations based on selected method
    const getTargetListConfigs = (): TargetListConfig[] => {
        const configs: TargetListConfig[] = [{
            id: 'selected',
            title: 'Variables to Restructure',
            variables: selectedVariables,
            height: method === RestructureMethod.CasesToVariables ? '110px' : '150px',
            maxItems: undefined, // Allow multiple items
            droppable: true,
            draggableItems: true
        }];

        if (method === RestructureMethod.VariablesToCases) {
            configs.push({
                id: 'index',
                title: 'Index Variables (Variables that identify groups, e.g., Time, ID)',
                variables: indexVariables,
                height: '120px',
                droppable: true,
                draggableItems: true
            });
        } else if (method === RestructureMethod.CasesToVariables) {
            configs.push({
                id: 'index',
                title: 'Index Variables (e.g., Subject ID)',
                variables: indexVariables,
                height: '90px',
                droppable: true,
                draggableItems: true
            });
            configs.push({
                id: 'identifier',
                title: 'Identifier Variables (e.g., Time)',
                variables: identifierVariables,
                height: '90px',
                maxItems: 1,
                droppable: true,
                draggableItems: true
            });
        }

        return configs;
    };

    const targetLists = getTargetListConfigs();

    // Calculate the total height of the right column to sync the left column's height
    const rightColumnHeight = targetLists.reduce((total, list) => {
        // Extract numeric value from height string (e.g., "110px" -> 110)
        const heightValue = parseInt(list.height, 10) || 0;
        return total + heightValue;
    }, 0) + (targetLists.length - 1) * 8; // Add space between lists (e.g., space-y-2 -> 8px)

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b p-4">
                <p className="text-sm text-muted-foreground">
                    {stepConfig.stepTitle} (Step {currentStep} of 3)
                </p>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="p-4 pb-0">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-1">
                                {validationErrors.map((error, index) => (
                                    <div key={index}>{error}</div>
                                ))}
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger 
                            value="type" 
                            disabled={currentStep !== 1}
                            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                        >
                            Method
                        </TabsTrigger>
                        <TabsTrigger 
                            value="variables" 
                            disabled={currentStep !== 2}
                            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                        >
                            Variables
                        </TabsTrigger>
                        <TabsTrigger 
                            value="options" 
                            disabled={currentStep !== 3}
                            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                        >
                            Options
                        </TabsTrigger>
                    </TabsList>

                    {/* Step 1: Method Selection */}
                    <TabsContent value="type" className="mt-4 space-y-4">
                        <div className="space-y-3">
                            <div 
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                    method === RestructureMethod.VariablesToCases 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setMethod(RestructureMethod.VariablesToCases)}
                            >
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="radio"
                                        checked={method === RestructureMethod.VariablesToCases}
                                        onChange={() => setMethod(RestructureMethod.VariablesToCases)}
                                        className="mt-1 accent-primary"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">Variables to Cases</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Convert multiple variables into cases. Each variable becomes a row with 
                                            an index variable identifying the original variable.
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2 italic">
                                            Example: Convert Test1, Test2, Test3 columns into a single Test column with values,
                                            and a TestType column indicating which test.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div 
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                    method === RestructureMethod.CasesToVariables 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setMethod(RestructureMethod.CasesToVariables)}
                            >
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="radio"
                                        checked={method === RestructureMethod.CasesToVariables}
                                        onChange={() => setMethod(RestructureMethod.CasesToVariables)}
                                        className="mt-1 accent-primary"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">Cases to Variables</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Convert multiple cases (rows) into variables (columns). Each unique value 
                                            in the identifier becomes a separate variable.
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2 italic">
                                            Example: Convert rows of Time1, Time2, Time3 into separate columns 
                                            Time1_Score, Time2_Score, Time3_Score.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div 
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                    method === RestructureMethod.TransposeAllData 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setMethod(RestructureMethod.TransposeAllData)}
                            >
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="radio"
                                        checked={method === RestructureMethod.TransposeAllData}
                                        onChange={() => setMethod(RestructureMethod.TransposeAllData)}
                                        className="mt-1 accent-primary"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">Transpose All Data</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Swap rows and columns for the entire dataset. Rows become columns 
                                            and columns become rows.
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2 italic">
                                            Example: Transpose a 10x5 dataset to a 5x10 dataset.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Step 2: Variable Configuration */}
                    <TabsContent value="variables" className="mt-4 h-[500px]">
                        <div className="h-full">
                            <div className="mb-4">
                                <Label className="text-base font-medium">
                                    Configure Variables for {
                                        method === RestructureMethod.VariablesToCases ? 'Variables to Cases' :
                                        method === RestructureMethod.CasesToVariables ? 'Cases to Variables' :
                                        'Transpose All Data'
                                    }
                                </Label>
                                {method !== RestructureMethod.TransposeAllData && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {method === RestructureMethod.VariablesToCases 
                                            ? 'Select variables to convert to cases and specify index variables.'
                                            : 'Select variables to restructure, and specify index and identifier variables.'
                                        }
                                    </p>
                                )}
                            </div>

                            {method === RestructureMethod.TransposeAllData ? (
                                <div className="space-y-4">
                                    <Alert>
                                        <InfoIcon className="h-4 w-4" />
                                        <AlertDescription>
                                            Transpose All Data will swap all rows and columns. No variable selection is needed.
                                            The current dataset dimensions will be reversed.
                                        </AlertDescription>
                                    </Alert>
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <div className="text-sm">
                                            <div><strong>Current Dataset:</strong> {availableVariables.length} variables (columns)</div>
                                            <div><strong>After Transpose:</strong> Dataset will have {availableVariables.length} rows</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (                                <div className="h-[400px]">
                                    <VariableListManager
                                        availableVariables={availableVariables}
                                        targetLists={targetLists}
                                        availableListHeight={`${rightColumnHeight}px`}
                                        variableIdKey="tempId"
                                        onMoveVariable={handleMoveVariable}
                                        onReorderVariable={handleReorderVariable}
                                        highlightedVariable={highlightedVariable}
                                        setHighlightedVariable={setHighlightedVariable}
                                        showArrowButtons={true}
                                    />
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Step 3: Options */}
                    <TabsContent value="options" className="mt-4 space-y-4">
                        <div className="space-y-4">
                            <Label className="text-base font-medium">Restructuring Options:</Label>
                            
                            <div className="space-y-4">
                                {method === RestructureMethod.VariablesToCases && (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="createCount"
                                                checked={createCount}
                                                onChange={(e) => setCreateCount(e.target.checked)}
                                                className="rounded accent-primary"
                                            />
                                            <Label htmlFor="createCount" className="text-sm">
                                                Create count variable
                                            </Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground ml-6">
                                            Creates a variable counting the number of non-missing values for each case.
                                        </p>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="createIndex"
                                                checked={createIndex}
                                                onChange={(e) => setCreateIndex(e.target.checked)}
                                                className="rounded accent-primary"
                                            />
                                            <Label htmlFor="createIndex" className="text-sm">
                                                Create index variable
                                            </Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground ml-6">
                                            Creates a variable that identifies which original variable each case came from.
                                        </p>
                                    </>
                                )}

                                {method === RestructureMethod.CasesToVariables && (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="dropEmptyVariables"
                                                checked={dropEmptyVariables}
                                                onChange={(e) => setDropEmptyVariables(e.target.checked)}
                                                className="rounded accent-primary"
                                            />
                                            <Label htmlFor="dropEmptyVariables" className="text-sm">
                                                Drop empty variables
                                            </Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground ml-6">
                                            Remove variables that contain only missing values after restructuring.
                                        </p>
                                    </>
                                )}

                                {method === RestructureMethod.TransposeAllData && (
                                    <Alert>
                                        <InfoIcon className="h-4 w-4" />
                                        <AlertDescription>
                                            No additional options are available for transpose operation. 
                                            All data will be transposed as-is.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Summary:</Label>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <div>
                                        <strong>Method:</strong> {
                                            method === RestructureMethod.VariablesToCases ? 'Variables to Cases' :
                                            method === RestructureMethod.CasesToVariables ? 'Cases to Variables' :
                                            'Transpose All Data'
                                        }
                                    </div>
                                    {method !== RestructureMethod.TransposeAllData && (
                                        <div><strong>Variables selected:</strong> {selectedVariables.length}</div>
                                    )}
                                    {method === RestructureMethod.CasesToVariables && identifierVariables.length > 0 && (
                                        <div><strong>Identifier variables:</strong> {identifierVariables.length}</div>
                                    )}
                                    {method === RestructureMethod.CasesToVariables && indexVariables.length > 0 && (
                                        <div><strong>Index variables:</strong> {indexVariables.length}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help icon */}
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <HelpCircle size={18} className="mr-1" />
                </div>
                {/* Right: Buttons */}
                <div className="flex justify-between">
                    <Button 
                        variant="outline" 
                        onClick={handleBack}
                        disabled={!stepConfig.canGoBack}
                        className="mr-2"
                        data-testid="restructure-back-button"
                    >
                        Back
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="mr-2" data-testid="restructure-cancel-button">
                            Cancel
                        </Button>
                        {stepConfig.showFinish ? (
                            <Button 
                                onClick={() => handleFinish(onClose)}
                                data-testid="restructure-finish-button"
                            >
                                Finish
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleNext}
                                disabled={!stepConfig.canProceed}
                                data-testid="restructure-next-button"
                            >
                                Next
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
