import React, {useEffect, useState} from "react";
import {Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup,} from "@/components/ui/resizable";
import {Separator} from "@/components/ui/separator";
import {FactorDialogProps, FactorMainType,} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {ScrollArea} from "@/components/ui/scroll-area";
import {useModal} from "@/hooks/useModal";

export const FactorDialog = ({
    isMainOpen,
    setIsMainOpen,
    setIsValueOpen,
    setIsDescriptivesOpen,
    setIsExtractionOpen,
    setIsRotationOpen,
    setIsScoresOpen,
    setIsOptionsOpen,
    updateFormData,
    data,
    globalVariables,
    onContinue,
    onReset,
    containerType = "dialog",
    onClose,
}: FactorDialogProps & { containerType?: "dialog" | "sidebar", onClose?: () => void }) => {
    const [mainState, setMainState] = useState<FactorMainType>({ ...data });
    const [availableVariables, setAvailableVariables] = useState<string[]>([]);

    const { closeModal } = useModal();

    useEffect(() => {
        setMainState({ ...data });
    }, [data]);

    useEffect(() => {
        const usedVariables = [
            ...(mainState.TargetVar || []),
            mainState.ValueTarget,
        ].filter(Boolean);

        const updatedVariables = globalVariables.filter(
            (variable) => !usedVariables.includes(variable)
        );
        setAvailableVariables(updatedVariables);
    }, [mainState, globalVariables]);

    const handleChange = (
        field: keyof FactorMainType,
        value: number | string | null
    ) => {
        setMainState((prevState) => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleDrop = (target: string, variable: string) => {
        setMainState((prev) => {
            const updatedState = { ...prev };
            if (target === "TargetVar") {
                updatedState.TargetVar = [
                    ...(updatedState.TargetVar || []),
                    variable,
                ];
            } else if (target === "ValueTarget") {
                updatedState.ValueTarget = variable;
            }
            return updatedState;
        });
    };

    const handleRemoveVariable = (target: string, variable?: string) => {
        setMainState((prev) => {
            const updatedState = { ...prev };
            if (target === "TargetVar") {
                updatedState.TargetVar = (updatedState.TargetVar || []).filter(
                    (item) => item !== variable
                );
            } else if (target === "ValueTarget") {
                updatedState.ValueTarget = "";
            }
            return updatedState;
        });
    };

    const handleContinue = () => {
        Object.entries(mainState).forEach(([key, value]) => {
            updateFormData("main", key as keyof FactorMainType, value);
        });

        setIsMainOpen(false);
        onContinue(mainState);
    };

    const openDialog =
        (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
            Object.entries(mainState).forEach(([key, value]) => {
                updateFormData("main", key as keyof FactorMainType, value);
            });
            setter(true);
        };

    const handleDialog = () => {
        setIsMainOpen(false);
        closeModal();
    };

    const renderContent = () => (
        <>
            <div className="flex items-center space-x-2 flex-grow overflow-hidden">
                <ResizablePanelGroup
                    direction="horizontal"
                    className="min-h-[200px] rounded-lg border md:min-w-[200px]"
                >
                    {/* Variable List */}
                    <ResizablePanel defaultSize={25}>
                        <ScrollArea>
                            <div className="flex flex-col gap-1 justify-start items-start h-[275px] w-full p-2">
                                {availableVariables.map(
                                    (
                                        variable: string,
                                        index: number
                                    ) => (
                                        <Badge
                                            key={index}
                                            className="w-full text-start text-sm font-light p-2 cursor-pointer"
                                            variant="outline"
                                            draggable
                                            onDragStart={(e) =>
                                                e.dataTransfer.setData(
                                                    "text",
                                                    variable
                                                )
                                            }
                                        >
                                            {variable}
                                        </Badge>
                                    )
                                )}
                            </div>
                        </ScrollArea>
                    </ResizablePanel>
                    <ResizableHandle withHandle />

                    {/* Defining Variable */}
                    <ResizablePanel defaultSize={55}>
                        <div className="flex flex-col gap-4 p-2">
                            <div className="w-full">
                                <div
                                    onDragOver={(e) =>
                                        e.preventDefault()
                                    }
                                    onDrop={(e) => {
                                        const variable =
                                            e.dataTransfer.getData(
                                                "text"
                                            );
                                        handleDrop(
                                            "TargetVar",
                                            variable
                                        );
                                    }}
                                >
                                    <Label className="font-bold">
                                        Variables:{" "}
                                    </Label>
                                    <div className="w-full h-[100px] p-2 border rounded overflow-hidden">
                                        <ScrollArea>
                                            <div className="w-full h-[80px]">
                                                {mainState.TargetVar &&
                                                mainState.TargetVar
                                                    .length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {mainState.TargetVar.map(
                                                            (
                                                                variable,
                                                                index
                                                            ) => (
                                                                <Badge
                                                                    key={
                                                                        index
                                                                    }
                                                                    className="text-start text-sm font-light p-2 cursor-pointer"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleRemoveVariable(
                                                                            "TargetVar",
                                                                            variable
                                                                        )
                                                                    }
                                                                >
                                                                    {
                                                                        variable
                                                                    }
                                                                </Badge>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-light text-gray-500">
                                                        Drop variables
                                                        here.
                                                    </span>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                    <input
                                        type="hidden"
                                        value={
                                            mainState.TargetVar ?? ""
                                        }
                                        name="Independents"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="w-full">
                                    <Label className="font-bold">
                                        Selection Variable:{" "}
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className="w-full min-h-[40px] p-2 border rounded"
                                            onDrop={(e) => {
                                                handleDrop(
                                                    "ValueTarget",
                                                    e.dataTransfer.getData(
                                                        "text"
                                                    )
                                                );
                                            }}
                                            onDragOver={(e) =>
                                                e.preventDefault()
                                            }
                                        >
                                            {mainState.ValueTarget ? (
                                                <Badge
                                                    className="text-start text-sm font-light p-2 cursor-pointer"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleRemoveVariable(
                                                            "ValueTarget"
                                                        )
                                                    }
                                                >
                                                    {
                                                        mainState.ValueTarget
                                                    }
                                                </Badge>
                                            ) : (
                                                <span className="text-sm font-light text-gray-500">
                                                    Drop variables here.
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="hidden"
                                            value={
                                                mainState.ValueTarget ??
                                                ""
                                            }
                                            name="ValueTarget"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={
                                            !mainState.TargetVar ||
                                            mainState.TargetVar
                                                .length === 0
                                        }
                                        onClick={openDialog(
                                            setIsValueOpen
                                        )}
                                    >
                                        Value...
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>

                    {/* Tools Area */}
                    <ResizablePanel defaultSize={20}>
                        <div className="flex flex-col h-full items-start justify-start gap-1 p-2">
                            <Button
                                className="w-full"
                                type="button"
                                variant="secondary"
                                onClick={openDialog(
                                    setIsDescriptivesOpen
                                )}
                            >
                                Descriptives...
                            </Button>
                            <Button
                                className="w-full"
                                type="button"
                                variant="secondary"
                                onClick={openDialog(
                                    setIsExtractionOpen
                                )}
                            >
                                Extraction...
                            </Button>
                            <Button
                                className="w-full"
                                type="button"
                                variant="secondary"
                                onClick={openDialog(setIsRotationOpen)}
                            >
                                Rotation...
                            </Button>
                            <Button
                                className="w-full"
                                type="button"
                                variant="secondary"
                                onClick={openDialog(setIsScoresOpen)}
                            >
                                Scores...
                            </Button>
                            <Button
                                className="w-full"
                                type="button"
                                variant="secondary"
                                onClick={openDialog(setIsOptionsOpen)}
                            >
                                Options...
                            </Button>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary flex-shrink-0">
                <div className="flex gap-2">
                    <Button type="button" onClick={handleContinue}>
                        OK
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                    >
                        Paste
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onReset}
                    >
                        Reset
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            setIsMainOpen(false);
                            if (onClose) onClose();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button type="button" variant="secondary">
                        Help
                    </Button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {containerType === "sidebar" ? (
                <div className="flex flex-col overflow-hidden w-full h-full">
                    <Separator className="flex-shrink-0" />
                    {renderContent()}
                </div>
            ) : (
                <Dialog open={isMainOpen} onOpenChange={handleDialog}>
                    <DialogContent className="sm:max-w-3xl p-0 flex flex-col h-[85vh]">
                        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                            <DialogTitle>Factor Analysis</DialogTitle>
                        </DialogHeader>
                        <div className="flex-grow overflow-hidden flex flex-col">
                            {renderContent()}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};
