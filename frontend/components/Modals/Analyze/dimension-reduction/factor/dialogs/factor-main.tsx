"use client";

import {useEffect, useMemo, useState} from "react";
import {FactorDialog} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/dialog";
import {
    FactorContainerProps,
    FactorMainType,
    FactorType,
} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";
import {FactorDefault} from "@/components/Modals/Analyze/dimension-reduction/factor/constants/factor-default";
import {FactorValue} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/value";
import {Dialog, DialogContent, DialogTitle, DialogHeader} from "@/components/ui/dialog";
import {BaseModalProps} from "@/types/modalTypes";
import {useModal} from "@/hooks/useModal";
import {useVariableStore} from "@/stores/useVariableStore";
import {useDataStore} from "@/stores/useDataStore";
import {analyzeFactor} from "@/components/Modals/Analyze/dimension-reduction/factor/services/factor-analysis";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";
import {toast} from "sonner";

interface FactorContentProps {
    isMainOpen: boolean;
    setIsMainOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isValueOpen: boolean;
    setIsValueOpen: React.Dispatch<React.SetStateAction<boolean>>;
    updateFormData: <T extends keyof FactorType>(
        section: T,
        field: keyof FactorType[T],
        value: unknown
    ) => void;
    formData: FactorType;
    tempVariables: string[];
    onContinue: (mainData: FactorMainType) => void;
    onReset: () => void;
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
}

const FactorContent = ({
    isMainOpen,
    setIsMainOpen,
    isValueOpen,
    setIsValueOpen,
    updateFormData,
    formData,
    tempVariables,
    onContinue,
    onReset,
    onClose,
    containerType = "dialog"
}: FactorContentProps) => {
    
    return (
        <>
            {/* Main Dialog with Tabs - only hide when Value dialog is open */}
            <div className={isValueOpen ? "hidden" : "block h-full"}>
                <FactorDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsValueOpen={setIsValueOpen}
                    updateFormData={updateFormData}
                    data={formData.main}
                    formData={formData}
                    globalVariables={tempVariables}
                    onContinue={onContinue}
                    onReset={onReset}
                    containerType={containerType}
                    onClose={onClose}
                />
            </div>

            {/* Value Dialog - only sub-dialog that remains separate */}
            <FactorValue
                isValueOpen={isValueOpen}
                setIsValueOpen={setIsValueOpen}
                updateFormData={(field, value) =>
                    updateFormData("value", field, value)
                }
                data={formData.value}
            />
        </>
    );
};

export const FactorContainer = ({ onClose, containerType = "dialog" }: FactorContainerProps & Partial<BaseModalProps>) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<FactorType>({ ...FactorDefault });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isValueOpen, setIsValueOpen] = useState(false);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("Factor");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...FactorDefault });
                }
            } catch (error) {
                console.error("Failed to load form data:", error);
            }
        };

        loadFormData();
    }, []);

    const updateFormData = <T extends keyof typeof formData>(
        section: T,
        field: keyof (typeof formData)[T],
        value: unknown
    ) => {
        setFormData((prev) => {
            const updated = {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value,
                },
            };

            // Auto-enable Inverse when Covariance is selected in Extraction
            if (section === "extraction" && field === "Covariance" && value === true) {
                updated.descriptives = {
                    ...updated.descriptives,
                    Inverse: true,
                };
            }

            return updated;
        });
    };

    const executeFactor = async (mainData: FactorMainType) => {
        const promise = async () => {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("Factor", newFormData);

            await analyzeFactor({
                configData: newFormData,
                dataVariables: dataVariables,
                variables: variables,
            });
        };

        toast.promise(promise, {
            loading: "Running Factor Analysis...",
            success: () => {
                closeModal();
                onClose();
                return "Factor Analysis completed successfully!";
            },
            error: (err) => {
                return (
                    <span>
                        An error occurred during Factor Analysis.
                        <br />
                        Error: {String(err)}
                    </span>
                );
            },
        });
    };

    const resetFormData = async () => {
        try {
            await clearFormData("Factor");
            setFormData({ ...FactorDefault });
        } catch (error) {
            console.error("Failed to clear form data:", error);
        }
    };

    const handleClose = () => {
        closeModal();
        onClose();
    };

    if (containerType === "sidebar") {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-popover text-popover-foreground">
                <div className="flex-grow flex flex-col overflow-hidden">
                    <FactorContent
                        isMainOpen={isMainOpen}
                        setIsMainOpen={setIsMainOpen}
                        isValueOpen={isValueOpen}
                        setIsValueOpen={setIsValueOpen}
                        updateFormData={updateFormData}
                        formData={formData}
                        tempVariables={tempVariables}
                        onContinue={(mainData: FactorMainType) => executeFactor(mainData)}
                        onReset={resetFormData}
                        onClose={onClose}
                        containerType={containerType}
                    />
                </div>
            </div>
        );
    }

    return (
        <Dialog open={isMainOpen} onOpenChange={handleClose}>
            <DialogTitle></DialogTitle>
            <DialogContent className="max-w-4xl p-0 bg-popover text-popover-foreground border border-border shadow-md rounded-md flex flex-col max-h-[85vh]">
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold">Factor Analysis</DialogTitle>
                </DialogHeader>
                
                <div className="flex-grow flex flex-col overflow-hidden">
                    <FactorContent
                        isMainOpen={isMainOpen}
                        setIsMainOpen={setIsMainOpen}
                        isValueOpen={isValueOpen}
                        setIsValueOpen={setIsValueOpen}
                        updateFormData={updateFormData}
                        formData={formData}
                        tempVariables={tempVariables}
                        onContinue={(mainData: FactorMainType) => executeFactor(mainData)}
                        onReset={resetFormData}
                        onClose={onClose}
                        containerType={containerType}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};