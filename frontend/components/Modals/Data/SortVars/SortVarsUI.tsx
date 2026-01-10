"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { SortVarsUIProps } from "./types";
import { HelpCircle } from "lucide-react";

const SortVarsUIContent: React.FC<SortVarsUIProps> = ({ 
    onClose,
    columns,
    selectedColumn,
    sortOrder,
    handleSelectColumn,
    setSortOrder,
    handleOk,
    handleReset,
}) => {
    return (
        <>
            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                <div>
                    <p className="font-semibold mb-2">Variable View Columns</p>
                    <ScrollArea className="border border-border rounded-md h-40">
                        <ul className="p-1 space-y-0.5">
                            {columns.map((col: string) => {
                                const isSelected = selectedColumn === col;
                                return (
                                    <li
                                        key={col}
                                        className={`px-2 py-1 rounded cursor-pointer truncate transition-colors select-none ${
                                            isSelected
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "hover:bg-accent"
                                        }`}
                                        onClick={() => handleSelectColumn(col)}
                                    >
                                        {col}
                                    </li>
                                );
                            })}
                        </ul>
                    </ScrollArea>
                </div>

                <div>
                    <p className="font-semibold mb-2">Sort Order</p>
                    <RadioGroup
                        value={sortOrder}
                        onValueChange={(val) => setSortOrder(val as "asc" | "desc")}
                        className="flex items-center gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="asc" id="sort-asc" />
                            <Label htmlFor="sort-asc">Ascending</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="desc" id="sort-desc" />
                            <Label htmlFor="sort-desc">Descending</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                    <HelpCircle size={18} className="mr-1" />
                </div>
                <div>
                    <Button variant="outline" className="mr-2" onClick={handleReset} data-testid="sortvars-reset-button">Reset</Button>
                    <Button variant="outline" className="mr-2" onClick={onClose} data-testid="sortvars-cancel-button">Cancel</Button>
                    <Button onClick={handleOk} data-testid="sortvars-ok-button">OK</Button>
                </div>
            </div>
        </>
    );
};


export const SortVarsUI: React.FC<SortVarsUIProps> = ({ 
    onClose,
    containerType = "dialog",
    ...props
}) => {
    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <SortVarsUIContent onClose={onClose} {...props} />
                </div>
            </div>
        );
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]" data-testid="sortvars-dialog-content">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold" data-testid="sortvars-dialog-title">Sort Variables</DialogTitle>
                </DialogHeader>
                <div className="flex-grow flex flex-col overflow-hidden">
                    <SortVarsUIContent onClose={onClose} {...props} />
                </div>
            </DialogContent>
        </Dialog>
    );
}; 