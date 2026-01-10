"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

import type { GoToModalProps } from "./types";
import { GoToMode } from "./types";
import { GoToContent } from './components/GoToContent';

const GoToModal: React.FC<GoToModalProps> = ({
    onClose,
    defaultMode = GoToMode.CASE,
    initialMode,
    containerType = "dialog",
    ...props
}) => {
    const activeMode = initialMode || defaultMode;
    
    if (containerType === "sidebar") {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <GoToContent onClose={onClose} defaultMode={activeMode} initialMode={initialMode} {...props} />
            </div>
        );
    }

    return (
        <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="p-0 gap-0 flex flex-col max-w-sm h-auto max-h-[calc(100vh-2rem)]">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center justify-between">
                        Go To
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Navigate to a specific case number or variable in the dataset.
                    </DialogDescription>
                </DialogHeader>
                <GoToContent
                    onClose={onClose}
                    defaultMode={activeMode}
                    initialMode={initialMode}
                    {...props}
                />
            </DialogContent>
        </Dialog>
    );
};

export { GoToMode };
export default GoToModal; 