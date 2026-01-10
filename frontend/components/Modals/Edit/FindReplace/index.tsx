"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

import type { FindAndReplaceModalProps } from "./types";
import { FindReplaceMode } from "./types";
import { FindReplaceContent } from "./components/FindReplaceContent";

export const FindAndReplaceModal: React.FC<FindAndReplaceModalProps> = ({
    onClose,
    defaultTab = FindReplaceMode.FIND,
    initialTab,
    containerType = "dialog",
    ...props
}) => {
    const activeTab = initialTab || defaultTab;
    const contentProps = { defaultTab: activeTab, ...props };

    if (containerType === "sidebar") {
        return (
            <div className="flex flex-col h-full bg-background text-foreground">
                <FindReplaceContent onClose={onClose} {...contentProps} />
            </div>
        );
    }

    return (
        <Dialog open={props.isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent
                className="p-0 gap-0 flex flex-col max-w-md h-auto max-h-[calc(100vh-2rem)]"
                aria-label="Find and Replace"
            >
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle role="heading" aria-level={2} className="flex items-center justify-between">
                        Find and Replace
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                            <X className="h-4 w-4" /><span className="sr-only">Close</span>
                        </Button>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Find and replace text within the selected column.
                    </DialogDescription>
                </DialogHeader>
                <FindReplaceContent onClose={onClose} {...contentProps} />
            </DialogContent>
        </Dialog>
    );
};

export const isFindReplaceModalType = (type: string): boolean => {
    return type === FindReplaceMode.FIND || type === FindReplaceMode.REPLACE;
};
