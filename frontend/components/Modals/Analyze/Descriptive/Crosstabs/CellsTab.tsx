import React, { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CellsTabProps } from "./types";
import { ActiveElementHighlight } from "@/components/Common/TourComponents";
import { useMetaStore } from "@/stores/useMetaStore";

const CellsTab: FC<CellsTabProps> = ({
    options,
    setOptions,
    rowVariables,
    columnVariables,
    tourActive = false,
    currentStep = 0,
    tourSteps = [],
}) => {
    const { meta } = useMetaStore();
    const isWeightActive = !!meta.weight;

    const getStepIndex = (targetId: string) => tourSteps.findIndex(step => step.targetId === targetId);
    
    const countsStep = getStepIndex('crosstabs-counts-section');
    const percentagesStep = getStepIndex('crosstabs-percentages-section');
    const residualsStep = getStepIndex('crosstabs-residuals-section');
    // const nonintegerWeightsStep = getStepIndex('crosstabs-noninteger-weights-section'); // Removed as Noninteger Weights section is eliminated

    // Use generic labels instead of specific variable names when multiple variables are present
    const rowVarName = rowVariables.length === 1 ? rowVariables[0].name : "Row Variable";
    const colVarName = columnVariables.length === 1 ? columnVariables[0].name : "Column Variable";

    const handleCellChange = (key: keyof typeof options.cells, value: boolean) => {
        setOptions(prev => ({
            ...prev,
            cells: {
                ...prev.cells,
                [key]: value,
            }
        }));
    };

    const handleThresholdChange = (value: number) => {
        if (isNaN(value)) return;
        setOptions(prev => ({
            ...prev,
            cells: {
                ...prev.cells,
                hideSmallCountsThreshold: value,
            },
        }));
    };

    const handleResidualChange = (key: keyof typeof options.residuals, value: boolean) => {
        setOptions(prev => ({
            ...prev,
            residuals: {
                ...prev.residuals,
                [key]: value,
            }
        }));
    };

    // Removed as Noninteger Weights section is eliminated

    return (
        <div className="p-6 space-y-6" data-testid="crosstabs-cells-tab-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="crosstabs-cells-options-grid">
                <div id="crosstabs-counts-section" className="bg-card border border-border rounded-md p-4 relative" data-testid="crosstabs-counts-section">
                    <div className="text-sm font-medium mb-3">Counts</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="observedCounts"
                                checked={options.cells.observed}
                                onCheckedChange={(checked) => handleCellChange('observed', !!checked)}
                                className="mr-2"
                                data-testid="crosstabs-observed-checkbox"
                            />
                            <Label htmlFor="observedCounts" className="text-sm cursor-pointer">
                                Observed
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox
                                id="expectedCounts"
                                checked={options.cells.expected}
                                onCheckedChange={(checked) => handleCellChange('expected', !!checked)}
                                className="mr-2"
                                data-testid="crosstabs-expected-checkbox"
                            />
                            <Label htmlFor="expectedCounts" className="text-sm cursor-pointer">
                                Expected
                            </Label>
                        </div>
                        <div className="flex items-start mt-2">
                            <Checkbox
                                id="hideSmallCounts"
                                checked={options.cells.hideSmallCounts}
                                onCheckedChange={(checked) => handleCellChange('hideSmallCounts', !!checked)}
                                className="mr-2 mt-1"
                                data-testid="crosstabs-hide-small-counts-checkbox"
                            />
                            <div className="flex flex-wrap items-center">
                                <Label htmlFor="hideSmallCounts" className="text-sm mr-2 cursor-pointer">
                                    Hide small counts &lt;
                                </Label>
                                <Input
                                    type="number"
                                    id="hideSmallCountsThreshold"
                                    value={options.cells.hideSmallCountsThreshold}
                                    onChange={(e) => handleThresholdChange(Number(e.target.value))}
                                    className="w-16 h-8 mr-2 px-1 text-center"
                                    disabled={!options.cells.hideSmallCounts}
                                    data-testid="crosstabs-hide-small-counts-threshold"
                                />
                            </div>
                        </div>
                    </div>
                    <ActiveElementHighlight active={tourActive && currentStep === countsStep} />
                </div>

                <div id="crosstabs-percentages-section" className="bg-card border border-border rounded-md p-4 relative" data-testid="crosstabs-percentages-section">
                    <div className="text-sm font-medium mb-3">Percentages</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox id="rowPercentages" checked={options.cells.row} onCheckedChange={(checked) => handleCellChange('row', !!checked)} className="mr-2" data-testid="crosstabs-row-percentages-checkbox" />
                            <Label htmlFor="rowPercentages" className="text-sm cursor-pointer">{`% within ${rowVarName}`}</Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox id="columnPercentages" checked={options.cells.column} onCheckedChange={(checked) => handleCellChange('column', !!checked)} className="mr-2" data-testid="crosstabs-column-percentages-checkbox" />
                            <Label htmlFor="columnPercentages" className="text-sm cursor-pointer">{`% within ${colVarName}`}</Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox id="totalPercentages" checked={options.cells.total} onCheckedChange={(checked) => handleCellChange('total', !!checked)} className="mr-2" data-testid="crosstabs-total-percentages-checkbox" />
                            <Label htmlFor="totalPercentages" className="text-sm cursor-pointer">% of Total</Label>
                        </div>
                    </div>
                    <ActiveElementHighlight active={tourActive && currentStep === percentagesStep} />
                </div>

                <div id="crosstabs-residuals-section" className="bg-card border border-border rounded-md p-4 relative" data-testid="crosstabs-residuals-section">
                    <div className="text-sm font-medium mb-3">Residuals</div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox id="unstandardizedResiduals" checked={options.residuals.unstandardized} onCheckedChange={(checked) => handleResidualChange('unstandardized', !!checked)} className="mr-2" data-testid="crosstabs-unstandardized-residuals-checkbox" />
                            <Label htmlFor="unstandardizedResiduals" className="text-sm cursor-pointer">Unstandardized</Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox id="standardizedResiduals" checked={options.residuals.standardized} onCheckedChange={(checked) => handleResidualChange('standardized', !!checked)} className="mr-2" data-testid="crosstabs-standardized-residuals-checkbox" />
                            <Label htmlFor="standardizedResiduals" className="text-sm cursor-pointer">Standardized Residual</Label>
                        </div>
                        <div className="flex items-center">
                            <Checkbox id="adjStandardizedResiduals" checked={options.residuals.adjustedStandardized} onCheckedChange={(checked) => handleResidualChange('adjustedStandardized', !!checked)} className="mr-2" data-testid="crosstabs-adjusted-residuals-checkbox" />
                            <Label htmlFor="adjStandardizedResiduals" className="text-sm cursor-pointer">Adjusted Residual</Label>
                        </div>
                    </div>
                    <ActiveElementHighlight active={tourActive && currentStep === residualsStep} />
                </div>

                {/* Noninteger Weights section removed as per requirements */}
            </div>
        </div>
    );
};

export default CellsTab;