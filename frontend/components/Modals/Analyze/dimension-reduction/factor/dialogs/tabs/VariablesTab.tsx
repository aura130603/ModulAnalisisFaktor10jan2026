"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FactorMainType } from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";

interface VariablesTabProps {
    mainState: FactorMainType;
    availableVariables: string[];
    onDrop: (target: string, variable: string) => void;
    onRemove: (target: string, variable?: string) => void;
    onOpenValue: () => void;
}

export const VariablesTab: React.FC<VariablesTabProps> = ({
    mainState,
    availableVariables,
    onDrop,
    onRemove,
    onOpenValue,
}) => {
    return (
        <div className="flex flex-col gap-4 py-4">
            <ResizablePanelGroup
                direction="horizontal"
                className="min-h-[300px] rounded-lg border"
            >
                {/* Variable List */}
                <ResizablePanel defaultSize={30}>
                    <div className="p-3">
                        <Label className="font-bold text-sm">Variables:</Label>
                        <ScrollArea className="h-[260px] mt-2">
                            <div className="flex flex-col gap-1">
                                {availableVariables.map((variable: string, index: number) => (
                                    <Badge
                                        key={index}
                                        className="w-full text-start text-sm font-light p-2 cursor-pointer hover:bg-accent"
                                        variant="outline"
                                        draggable
                                        onDragStart={(e) =>
                                            e.dataTransfer.setData("text", variable)
                                        }
                                    >
                                        {variable}
                                    </Badge>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Target Variables Area */}
                <ResizablePanel defaultSize={70}>
                    <div className="flex flex-col gap-4 p-3">
                        {/* Variables (Target) */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                const variable = e.dataTransfer.getData("text");
                                onDrop("TargetVar", variable);
                            }}
                        >
                            <Label className="font-bold text-sm">Variables:</Label>
                            <div className="w-full h-[120px] p-2 border rounded mt-2 overflow-hidden">
                                <ScrollArea className="h-[100px]">
                                    {mainState.TargetVar && mainState.TargetVar.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                            {mainState.TargetVar.map((variable, index) => (
                                                <Badge
                                                    key={index}
                                                    className="text-start text-sm font-light p-2 cursor-pointer hover:bg-destructive/10"
                                                    variant="outline"
                                                    onClick={() => onRemove("TargetVar", variable)}
                                                >
                                                    {variable}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-sm font-light text-muted-foreground">
                                            Drop variables here.
                                        </span>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>

                        {/* Selection Variable */}
                        <div className="flex flex-col gap-2">
                            <div>
                                <Label className="font-bold text-sm">Selection Variable:</Label>
                                <div
                                    className="w-full min-h-[40px] p-2 border rounded mt-2"
                                    onDrop={(e) => {
                                        onDrop("ValueTarget", e.dataTransfer.getData("text"));
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    {mainState.ValueTarget ? (
                                        <Badge
                                            className="text-start text-sm font-light p-2 cursor-pointer hover:bg-destructive/10"
                                            variant="outline"
                                            onClick={() => onRemove("ValueTarget")}
                                        >
                                            {mainState.ValueTarget}
                                        </Badge>
                                    ) : (
                                        <span className="text-sm font-light text-muted-foreground">
                                            Drop variable here.
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={!mainState.ValueTarget}
                                    onClick={onOpenValue}
                                >
                                    Value...
                                </Button>
                            </div>
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};
