"use client"

import type { FC} from "react";
import React, { useEffect, useRef, useCallback } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Dialog,
} from "@/components/ui/dialog";
import {
    Shapes,
    Ruler,
    BarChartHorizontal,
    ChevronDown,
    AlertCircle,
    Info,
    HelpCircle
} from "lucide-react";
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';
import Handsontable from 'handsontable';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { PropertiesEditorProps } from "./types";
import { usePropertiesEditor } from "./hooks/usePropertiesEditor";
import type { Variable } from "@/types/Variable";
import { DATE_FORMAT_SPECS, isDateType } from "./constants/dateSpecs";
import { getFormattedTypeName, formatDropdownText } from "./utils/typeFormatters";

// Register all Handsontable modules
registerAllModules();

// Dropdown options
const ROLE_OPTIONS = ["input", "target", "both", "none", "partition", "split"];
const MEASURE_OPTIONS = ["scale", "ordinal", "nominal"];
const TYPE_OPTIONS = [
    "NUMERIC", "COMMA", "DOT", "SCIENTIFIC", "DATE", "DOLLAR",
    "CCA", "CCB", "CCC", "CCD", "CCE", "PERCENT", "STRING", "RESTRICTED_NUMERIC"
];

const getVariableIcon = (variable: Variable | null) => {
    if (!variable) return <Ruler size={12} className="text-muted-foreground mr-1 flex-shrink-0" />;
    switch (variable.measure) {
        case "scale": return <Ruler size={12} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "nominal": return <Shapes size={12} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "ordinal": return <BarChartHorizontal size={12} className="text-muted-foreground mr-1 flex-shrink-0" />;
        default:
            return variable.type === "STRING"
                ? <Shapes size={12} className="text-muted-foreground mr-1 flex-shrink-0" />
                : <Ruler size={12} className="text-muted-foreground mr-1 flex-shrink-0" />;
    }
};

const PropertiesEditorContent: FC<PropertiesEditorProps> = ({
    onClose,
    variables: initialVariables, 
    caseLimit,
    valueLimit,
    onSave,
    containerType = "dialog"
}) => {
    const {
        modifiedVariables,
        selectedVariableIndex,
        currentVariable,
        gridData, setGridData, 
        showTypeDropdown, setShowTypeDropdown,
        showRoleDropdown, setShowRoleDropdown,
        showMeasureDropdown, setShowMeasureDropdown,
        showDateFormatDropdown, setShowDateFormatDropdown,
        errorMessage, errorDialogOpen, setErrorDialogOpen,
        suggestDialogOpen, setSuggestDialogOpen, suggestedMeasure, measurementExplanation, 
        unlabeledValuesCount,   
        activeTab, setActiveTab, 
        handleVariableChange,   
        handleVariableFieldChange, 
        handleGridDataChange,   
        handleAutoLabel,        
        handleSuggestMeasurement, 
        handleAcceptSuggestion, 
        handleSave,             
    } = usePropertiesEditor({
        initialVariables,
        caseLimit,
        valueLimit,
        onSave,
        onClose
    });

    const hotTableRef = useRef<any>(null);
    const valueLabelsGridContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        
        if (activeTab === 'labels' && hotTableRef.current) {
            const hotInstance = hotTableRef.current.hotInstance;
            if (hotInstance) {
                // Use a timeout to ensure the table is properly mounted
                timeoutId = setTimeout(() => {
                    // Check if instance is still valid before rendering
                    if (hotTableRef.current?.hotInstance && !hotTableRef.current.hotInstance.isDestroyed) {
                        hotTableRef.current.hotInstance.render();
                    }
                }, 50);
            }
        }
        
        // Clean up timeout on unmount or when dependencies change
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [activeTab, gridData]);

    const checkboxRenderer = useCallback((instance: Handsontable, td: HTMLTableCellElement, row: number, col: number, prop: string | number, value: any, cellProperties: Handsontable.CellProperties) => {
        Handsontable.renderers.CheckboxRenderer.apply(this, [instance, td, row, col, prop, value, cellProperties]);
        td.style.textAlign = 'center';
        if (cellProperties.readOnly) return td;

        const checkbox = td.firstChild as HTMLInputElement;
        if (!checkbox) return td;

        const originalOnChange = checkbox.onchange;
        checkbox.onchange = (event) => {
            if (originalOnChange) {
                originalOnChange.call(checkbox, event);
            }
            const currentChecked = checkbox.checked;
            const newData = gridData.map(r => [...r]);
            if (newData[row]) {
                newData[row][col] = currentChecked;
                if (col === 2) { // If "Missing" column (index 2) changed
                    newData[row][1] = true; // Mark row as changed (index 1)
                }
            }
            setGridData(newData);
        };
        return td;
    }, [gridData, setGridData]);

    const handleCopyFromVariable = () => {
        setErrorDialogOpen(true);
        console.warn("handleCopyFromVariable: Feature not fully implemented. Error dialog shown.");
    };

    const handleCopyToVariables = () => {
        setErrorDialogOpen(true);
        console.warn("handleCopyToVariables: Feature not fully implemented. Error dialog shown.");
    };

    const renderDropdown = (options: string[], currentValue: string, onChange: (value: string) => void, onCloseDropdown: () => void) => {
        return (
            <div className="absolute top-full left-0 z-50 mt-1 w-full bg-popover border border-border rounded shadow-lg max-h-40 overflow-y-auto">
                {options.map((option) => (
                    <div
                        key={option}
                        className="text-sm p-1 hover:bg-accent cursor-pointer text-popover-foreground"
                        onClick={() => { onChange(option); onCloseDropdown(); }}
                        title={formatDropdownText(option)}
                    >
                        {formatDropdownText(option)}
                    </div>
                ))}
            </div>
        );
    };

    const renderDateFormatDropdown = (currentVar: Variable | null, handleVarFieldChangeFn: (field: keyof Variable, value: any) => void, setShowDd: (show: boolean) => void) => {
        if (!currentVar) return null;
        return (
            <div className="absolute top-full right-0 z-50 mt-1 w-60 bg-popover border border-border rounded shadow-lg max-h-40 overflow-y-auto">
                {DATE_FORMAT_SPECS.map((format, index) => (
                    <div
                        key={index}
                        className="text-sm p-1 hover:bg-accent cursor-pointer text-popover-foreground"
                        onClick={() => {
                            handleVarFieldChangeFn('type', format.type);
                            handleVarFieldChangeFn('width', format.width);
                            setShowDd(false);
                        }}
                        title={format.format}
                    >
                        {format.format}
                    </div>
                ))}
            </div>
        );
    };
    
    return (
        <div className="flex flex-col flex-grow h-full">
            <div className="grid grid-cols-12 gap-4 p-4 flex-grow overflow-y-auto">
                <div className="col-span-4 flex flex-col">
                    <div className="text-sm font-semibold mb-1 text-foreground">Scanned Variable List</div>
                    <div className="border border-border rounded flex-grow overflow-y-auto bg-card">
                        <div className="bg-muted border-b border-border">
                            <div className="grid grid-cols-12 text-sm font-semibold text-muted-foreground">
                                <div className="col-span-2 p-1 text-center border-r border-border overflow-hidden" title="Labeled"><span className="block truncate">Labeled</span></div>
                                <div className="col-span-4 p-1 text-center border-r border-border overflow-hidden" title="Measurement"><span className="block truncate">Measurement</span></div>
                                <div className="col-span-2 p-1 text-center border-r border-border overflow-hidden" title="Role"><span className="block truncate">Role</span></div>
                                <div className="col-span-4 p-1 text-center overflow-hidden" title="Variable"><span className="block truncate">Variable</span></div>
                            </div>
                        </div>
                        <div className="overflow-y-auto">
                            {modifiedVariables.map((variable, index) => (
                                <div
                                    key={variable.tempId || variable.columnIndex}
                                    className={`grid grid-cols-12 text-sm cursor-pointer border-b border-border ${selectedVariableIndex === index ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-card-foreground hover:bg-accent'}`}
                                    onClick={() => handleVariableChange(index)}
                                >
                                    <div className="col-span-2 p-1 text-center border-r border-border">
                                        <input type="checkbox" className="w-3 h-3 accent-primary" checked={Array.isArray(variable.values) && variable.values.length > 0} readOnly />
                                    </div>
                                    <div className="col-span-4 p-1 text-center border-r border-border flex items-center justify-center" title={formatDropdownText(variable.measure)}>
                                        {getVariableIcon(variable)}
                                        <span className="truncate">{formatDropdownText(variable.measure)}</span>
                                    </div>
                                    <div className="col-span-2 p-1 text-center border-r border-border truncate" title={formatDropdownText(variable.role)}>{formatDropdownText(variable.role)}</div>
                                    <div className="col-span-4 p-1 text-center truncate" title={variable.name}>{variable.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                        <div>Cases scanned: <Input value={caseLimit} className="w-10 h-8 text-sm border border-input rounded px-2 bg-muted text-muted-foreground" readOnly /></div>
                <div>Value list limit: <Input value={valueLimit} className="w-10 h-8 text-sm border border-input rounded px-2 bg-muted text-muted-foreground" readOnly /></div>
                    </div>
                </div>
                <div className="col-span-8 flex flex-col">
                    {currentVariable ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow">
                            <TabsList className="grid w-full grid-cols-2 mb-2">
                                <TabsTrigger value="properties">Properties</TabsTrigger>
                                <TabsTrigger value="labels">Value Labels</TabsTrigger>
                            </TabsList>
                            <TabsContent value="properties" className="flex-grow p-1">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-sm font-semibold text-foreground text-left">Current Variable:</div>
                                        <div className="col-span-8"><Input value={currentVariable.name} onChange={(e) => handleVariableFieldChange('name', e.target.value)} className="h-8 w-full text-sm" /></div>
                                    </div>
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-sm font-semibold text-foreground text-left">Label:</div>
                                        <div className="col-span-8"><Input value={currentVariable.label || ''} onChange={(e) => handleVariableFieldChange('label', e.target.value)} className="h-8 w-full text-sm" /></div>
                                    </div>
                                    {/* Baris Type disembunyikan sementara */}
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-sm font-semibold text-foreground text-left">Width:</div>
                                        <div className="col-span-4"><Input type="number" value={currentVariable.width} onChange={(e) => handleVariableFieldChange('width', parseInt(e.target.value, 10))} className="h-8 w-full text-sm" /></div>
                                    </div>
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-sm font-semibold text-foreground text-left">Decimals:</div>
                                        <div className="col-span-4"><Input type="number" value={currentVariable.decimals} onChange={(e) => handleVariableFieldChange('decimals', parseInt(e.target.value, 10))} className="h-8 w-full text-sm" /></div>
                                    </div>
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-sm font-semibold text-foreground text-left">Missing Values:</div>
                                        <div className="col-span-8"><Button variant="outline" className="h-8 w-full text-sm">Define...</Button></div>
                                    </div>
                                    <hr />
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-sm font-semibold text-foreground text-left">Role:</div>
                                        <div className="col-span-8 relative">
                                            <Button variant="outline" className="h-8 w-full text-sm justify-between" onClick={() => setShowRoleDropdown(!showRoleDropdown)}>
                                                {formatDropdownText(currentVariable.role)} <ChevronDown className="h-3 w-3" />
                                            </Button>
                                            {showRoleDropdown && renderDropdown(ROLE_OPTIONS, currentVariable.role || '', (value) => handleVariableFieldChange('role', value), () => setShowRoleDropdown(false))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-12 items-center gap-x-2">
                                        <div className="col-span-4 text-sm font-semibold text-foreground text-left">Measurement:</div>
                                        <div className="col-span-8 relative">
                                            <Button variant="outline" className="h-8 w-full text-sm justify-between" onClick={() => setShowMeasureDropdown(!showMeasureDropdown)}>
                                                {formatDropdownText(currentVariable.measure)} <ChevronDown className="h-3 w-3" />
                                            </Button>
                                            {showMeasureDropdown && renderDropdown(MEASURE_OPTIONS, currentVariable.measure || '', (value) => handleVariableFieldChange('measure', value), () => setShowMeasureDropdown(false))}
                                        </div>
                                        {/* <div className="col-span-2">
                                            <Button variant="outline" size="sm" className="h-8 w-full text-sm" onClick={handleSuggestMeasurement}>Suggest</Button>
                                        </div> */}
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="labels" className="flex-grow overflow-y-auto p-1 flex flex-col">
                                <div className="">
                                    <div className="flex items-center mb-1">
                                        <div className="text-xs font-semibold text-foreground mr-1">Value Labels for {currentVariable.name}:</div>
                                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Info size={12} className="text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top"><p className="text-xs">Enter or paste values and their labels. Changed rows are indicated.<br />Use the checkbox to mark values as missing.</p></TooltipContent></Tooltip></TooltipProvider>
                                        <span className="ml-auto text-xs text-muted-foreground">Unlabeled Values: {unlabeledValuesCount}</span>
                                    </div>
                                    <div ref={valueLabelsGridContainerRef} style={{ height: '200px', overflow: 'hidden' }} className="border border-border rounded">
                                        <HotTable
                                            ref={hotTableRef}
                                            data={gridData}
                                            columns={[
                                                { data: 0, title: '#', readOnly: true, width: 30, className: 'htCenter htMiddle text-xs text-muted-foreground bg-muted border-r-border' },
                                                { data: 1, title: '<span class="text-destructive">*</span>', renderer: checkboxRenderer, readOnly: true, width: 30, className: 'htCenter htMiddle text-xs bg-muted border-r-border' },
                                                { data: 2, title: 'Missing', renderer: checkboxRenderer, width: 50, className: 'htCenter htMiddle text-xs bg-muted border-r-border' },
                                                { data: 3, title: 'Count', type: 'numeric', readOnly: true, width: 50, className: 'htRight htMiddle text-xs text-muted-foreground bg-muted border-r-border' },
                                                { data: 4, title: 'Value', width: 100, className: 'htLeft htMiddle text-xs text-foreground' },
                                                { data: 5, title: 'Label', width: 150, className: 'htLeft htMiddle text-xs text-foreground' },
                                            ]}
                                            rowHeaders={false}
                                            colHeaders={true}
                                            manualColumnResize={true}
                                            manualRowResize={true}
                                            height="100%"
                                            selectionMode="single"
                                            className="htXSmall htCustomTheme"
                                            licenseKey="non-commercial-and-evaluation"
                                            afterChange={handleGridDataChange}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex gap-1">
                                            <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={handleAutoLabel}>Auto Label</Button>
                                            {/* Copy buttons removed */}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    ) : (<div className="text-center text-sm text-muted-foreground py-10">Select a variable from the list to view and edit its properties.</div>)}
                </div>
            </div>
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                {/* Left: Help icon */}
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <HelpCircle size={18} className="mr-1" />
                </div>
                {/* Right: Buttons */}
                <div>
                    <Button 
                        variant="outline" 
                        className="mr-2"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        OK
                    </Button>
                </div>
            </div>
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-popover border-border">
                    <DialogHeader><DialogTitle className="text-destructive">Error</DialogTitle></DialogHeader>
                    <div className="flex items-start space-x-3 py-4">
                        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-popover-foreground">{errorMessage}</p>
                    </div>
                    <DialogFooter><Button onClick={() => setErrorDialogOpen(false)}>OK</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-popover border-border">
                    <DialogHeader><DialogTitle className="text-foreground">Suggested Measurement Level</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-2">
                        <p className="text-sm text-popover-foreground">Based on the data, we suggest setting the measurement level to <strong className="text-primary">{suggestedMeasure}</strong>.</p>
                        <p className="text-sm text-muted-foreground">Explanation: {measurementExplanation}</p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSuggestDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAcceptSuggestion}>Accept Suggestion</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const PropertiesEditor: FC<PropertiesEditorProps> = ({ 
    onClose, 
    variables, 
    caseLimit, 
    valueLimit, 
    onSave,
    containerType = "dialog" 
}) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <PropertiesEditorContent 
                        onClose={onClose} 
                        variables={variables} 
                        caseLimit={caseLimit} 
                        valueLimit={valueLimit}
                        onSave={onSave}
                        containerType={containerType}
                    />
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-[880px] max-h-[90vh] p-0 bg-background">
                <DialogHeader className="px-4 py-3 border-b border-border">
                    <DialogTitle className="flex items-center text-sm font-semibold text-foreground">
                        Define Variable Properties
                    </DialogTitle>
                </DialogHeader>

                <PropertiesEditorContent 
                    onClose={onClose} 
                    variables={variables} 
                    caseLimit={caseLimit} 
                    valueLimit={valueLimit}
                    onSave={onSave}
                    containerType={containerType}
                />
            </DialogContent>
        </Dialog>
    );
};

export default PropertiesEditor;