"use client"

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';
import { Separator } from "@/components/ui/separator";
// Help icon and tooltip imports removed
import type { VariableType } from '@/types/Variable';

interface DateFormatOption {
    value: string;
    label: string;
    type: VariableType;
    width: number;
}

interface DollarFormatOption {
    value: string;
    label: string;
    width: number;
    decimals: number;
}

interface VariableTypeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (type: VariableType, width: number, decimals: number) => void;
    initialType?: VariableType;
    initialWidth: number;
    initialDecimals: number;
}

export const VariableTypeDialog: React.FC<VariableTypeDialogProps> = ({
    open,
    onOpenChange,
    onSave,
    initialType = "NUMERIC",
    initialWidth,
    initialDecimals
}) => {
    const { isMobile } = useMobile();
    const [selectedType, setSelectedType] = useState<VariableType | "CUSTOM_CURRENCY">(initialType);
    const [width, setWidth] = useState<number>(initialWidth);
    const [decimals, setDecimals] = useState<number>(initialDecimals);
    const [dateFormat, setDateFormat] = useState<string>("dd-mm-yyyy");
    const [dollarFormat, setDollarFormat] = useState<string>("$### ###,###.##");

    const dateFormats = React.useMemo<DateFormatOption[]>(() => [
        { value: "dd-mm-yyyy", label: "dd-mm-yyyy", type: "DATE", width: 10 },
    ], []);

    // Dollar format options
    const dollarFormats = React.useMemo<DollarFormatOption[]>(() => [
        { value: "$# ###", label: "$# ###", width: 6, decimals: 0 },
        { value: "$# ###.##", label: "$# ###.##", width: 9, decimals: 2 },
        { value: "$###,###", label: "$###,###", width: 8, decimals: 0 },
        { value: "$###,###.##", label: "$###,###.##", width: 11, decimals: 2 },
        { value: "$### ###", label: "$### ###", width: 8, decimals: 0 },
        { value: "$### ###.##", label: "$### ###.##", width: 11, decimals: 2 },
        { value: "$### ###,###", label: "$### ###,###", width: 12, decimals: 0 },
        { value: "$### ###,###.##", label: "$### ###,###.##", width: 15, decimals: 2 }
    ], []);

    useEffect(() => {
        setDateFormat(initialType);
        setDollarFormat(initialType === 'DOLLAR' ? "$### ###,###.##" : initialType);
    }, [initialType]);

    // Set default values based on type
    useEffect(() => {
        if (selectedType === "STRING") {
            setWidth(8);
            setDecimals(0);
        } else if (["NUMERIC", "COMMA", "DOT", "SCIENTIFIC"].includes(selectedType)) {
            if (initialType !== selectedType) {
                setWidth(8);
                setDecimals(2);
            }
        } else if (selectedType === "RESTRICTED_NUMERIC") {
            setWidth(8);
            setDecimals(0);
        } else if (selectedType === "DATE") {
            const format = dateFormats.find(f => f.value === dateFormat);
            if (format) {
                setWidth(format.width);
                setDecimals(0);
            }
        } else if (selectedType === "DOLLAR") {
            const format = dollarFormats.find(f => f.value === dollarFormat);
            if (format) {
                setWidth(format.width);
                setDecimals(format.decimals);
            } else {
                // Fallback for DOLLAR if format not found (e.g., during initial load)
                const defaultFormat = dollarFormats.find(f => f.value === "$### ###,###.##");
                if(defaultFormat){
                    setWidth(defaultFormat.width);
                    setDecimals(defaultFormat.decimals);
                } else {
                    setWidth(8);
                    setDecimals(2);
                }
            }
        } else if (selectedType === "CUSTOM_CURRENCY") {
            setWidth(8);
            setDecimals(2);
        } else if (["CCA", "CCB", "CCC", "CCD", "CCE"].includes(selectedType)) {
            if (initialType !== selectedType) {
                setWidth(8);
                setDecimals(2);
            }
        }
    }, [selectedType, dateFormat, dollarFormat, initialType, dateFormats, dollarFormats]);

    // Handle date format change
    const handleDateFormatChange = (value: string) => {
        setDateFormat(value);
        const format = dateFormats.find(f => f.value === value);
        if (format) {
            // Hanya update width berdasarkan format yang dipilih
            setWidth(format.width);
        }
    };

    // Handle dollar format selection
    // (removed) dollar/currency selection handlers not used

    // Handle save
    const handleSave = () => {
        let finalType = selectedType;
        const finalWidth = width;
        const finalDecimals = decimals;

        // For date types, get the correct type based on format
        if (selectedType === "DATE") {
            const format = dateFormats.find(f => f.value === dateFormat);
            if (format) {
                finalType = format.type as VariableType;
            }
        }

        onSave(finalType as VariableType, finalWidth, finalDecimals);
        onOpenChange(false);
    };

    const isNumericType = ["NUMERIC", "COMMA", "DOT", "SCIENTIFIC", "RESTRICTED_NUMERIC"].includes(selectedType);
    const isDateType = ["DATE", "ADATE", "EDATE", "SDATE", "JDATE", "QYR", "MOYR", "WKYR", "DATETIME", "TIME", "DTIME", "WKDAY", "MONTH"].includes(selectedType);

    // Group date formats by type for SelectContent
    // (removed) groupedDateFormats not used

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full p-0 border border-border rounded-md shadow-lg"
                style={{ 
                    maxWidth: isMobile ? "95vw" : "480px",
                    width: "100%",
                    maxHeight: isMobile ? "100vh" : "65vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                <div className="px-4 py-2 flex-shrink-0 bg-muted/30">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-base font-semibold">
                            Variable Type
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <Separator className="flex-shrink-0" />

                <div className="flex-grow overflow-y-auto p-3">
                    <div className={cn("gap-3", isMobile ? "grid grid-cols-1" : "grid grid-cols-2")}>
                        <div className="space-y-1">
                            <RadioGroup value={selectedType} onValueChange={(v) => setSelectedType(v as VariableType | "CUSTOM_CURRENCY")}>
                                {[
                                    { id: "NUMERIC", label: "Numeric" },
                                    { id: "STRING", label: "String" },
                                    { id: "DATE", label: "dd-mm-yyyy" }
                                ].map((type) => (
                                    <div key={type.id} className="flex items-center space-x-2 py-1">
                                        <RadioGroupItem value={type.id} id={type.id} />
                                        <Label htmlFor={type.id} className="text-sm">
                                            {type.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="h-52 overflow-y-auto border border-border rounded-md p-2.5 bg-card/50">
                            <div className="space-y-3">
                                {isNumericType && (
                                    <div className="space-y-2.5">
                                        <div className="space-y-1">
                                            <Label htmlFor="width" className="text-sm">
                                                Width:
                                            </Label>
                                            <Input
                                                id="width"
                                                type="number"
                                                value={width}
                                                onChange={(e) => setWidth(Number(e.target.value))}
                                                min={1}
                                                max={64}
                                                className="h-7 text-sm"
                                            />
                                        </div>
                                        {selectedType !== "RESTRICTED_NUMERIC" && (
                                            <div className="space-y-1">
                                                <Label htmlFor="decimals" className="text-sm">
                                                    Decimal Places:
                                                </Label>
                                                <Input
                                                    id="decimals"
                                                    type="number"
                                                    value={decimals}
                                                    onChange={(e) => setDecimals(Number(e.target.value))}
                                                    min={0}
                                                    max={16}
                                                    className="h-7 text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isDateType && (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-sm">Format:</Label>
                                            <Select value={dateFormat} onValueChange={handleDateFormatChange}>
                                                <SelectTrigger className="h-7 text-sm">
                                                    <SelectValue placeholder="Select format" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-60">
                                                    {dateFormats.map(format => (
                                                        <SelectItem key={format.value} value={format.value} className="text-sm">
                                                            {format.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="dateWidth" className="text-sm">
                                                Width:
                                            </Label>
                                            <Input
                                                id="dateWidth"
                                                type="number"
                                                value={width}
                                                readOnly
                                                className="h-7 text-sm bg-muted"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedType === "STRING" && (
                                    <div className="space-y-1">
                                        <Label htmlFor="characters" className="text-sm">
                                            Characters:
                                        </Label>
                                        <Input
                                            id="characters"
                                            type="number"
                                            value={width}
                                            onChange={(e) => setWidth(Number(e.target.value))}
                                            min={1}
                                            max={64}
                                            className="h-7 text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 text-sm bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md border-l-2 border-blue-500">
                        The Numeric type honors the digit grouping setting, while the Restricted Numeric never uses digit grouping.
                    </div>
                </div>

                <Separator className="flex-shrink-0" />
                <DialogFooter className="px-4 py-2 flex-shrink-0 bg-muted/30">
                    <div className="flex gap-2 ml-auto">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-sm" 
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            size="sm" 
                            className="h-7 text-sm bg-primary hover:bg-primary/90" 
                            onClick={handleSave}
                        >
                            OK
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};