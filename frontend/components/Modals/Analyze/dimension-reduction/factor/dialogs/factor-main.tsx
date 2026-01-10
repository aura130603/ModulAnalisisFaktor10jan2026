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
import {FactorScores} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/scores";
import {FactorRotation} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/rotation";
import {FactorExtraction} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/extraction";
import {FactorDescriptives} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/descriptives";
import {FactorOptions} from "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/options";
import {Dialog, DialogContent, DialogTitle, DialogHeader} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
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
    isDescriptivesOpen: boolean;
    setIsDescriptivesOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isExtractionOpen: boolean;
    setIsExtractionOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isRotationOpen: boolean;
    setIsRotationOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isScoresOpen: boolean;
    setIsScoresOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isOptionsOpen: boolean;
    setIsOptionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
    isDescriptivesOpen,
    setIsDescriptivesOpen,
    isExtractionOpen,
    setIsExtractionOpen,
    isRotationOpen,
    setIsRotationOpen,
    isScoresOpen,
    setIsScoresOpen,
    isOptionsOpen,
    setIsOptionsOpen,
    updateFormData,
    formData,
    tempVariables,
    onContinue,
    onReset,
    onClose,
    containerType = "dialog"
}: FactorContentProps) => {
    
    // LOGIKA TAMBAHAN: Cek apakah ada sub-menu yang terbuka
    const isSubMenuOpen = isValueOpen || isDescriptivesOpen || isExtractionOpen || isRotationOpen || isScoresOpen || isOptionsOpen;

    return (
        <>
            {/* WRAPPER UTAMA:
                Jika sub-menu terbuka, sembunyikan (hidden) Main Dialog.
                Ini mencegah tombol OK/Paste muncul di belakang/atas sidebar sub-menu.
            */}
            <div className={isSubMenuOpen ? "hidden" : "block h-full"}>
                <FactorDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsValueOpen={setIsValueOpen}
                    setIsDescriptivesOpen={setIsDescriptivesOpen}
                    setIsExtractionOpen={setIsExtractionOpen}
                    setIsRotationOpen={setIsRotationOpen}
                    setIsScoresOpen={setIsScoresOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={updateFormData}
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={onContinue}
                    onReset={onReset}
                    containerType={containerType}
                    onClose={onClose}
                />
            </div>

            {/* --- SUB MENUS --- */}
            {/* Mereka akan merender diri mereka sendiri jika prop isOpen=true */}

            {/* Value */}
            <FactorValue
                isValueOpen={isValueOpen}
                setIsValueOpen={setIsValueOpen}
                updateFormData={(field, value) =>
                    updateFormData("value", field, value)
                }
                data={formData.value}
            />

            {/* Descriptives */}
            <FactorDescriptives
                isDescriptivesOpen={isDescriptivesOpen}
                setIsDescriptivesOpen={setIsDescriptivesOpen}
                updateFormData={(field, value) =>
                    updateFormData("descriptives", field, value)
                }
                data={formData.descriptives}
            />

            {/* Extraction */}
            <FactorExtraction
                isExtractionOpen={isExtractionOpen}
                setIsExtractionOpen={setIsExtractionOpen}
                updateFormData={(field, value) =>
                    updateFormData("extraction", field, value)
                }
                data={formData.extraction}
            />

            {/* Rotation */}
            <FactorRotation
                isRotationOpen={isRotationOpen}
                setIsRotationOpen={setIsRotationOpen}
                updateFormData={(field, value) =>
                    updateFormData("rotation", field, value)
                }
                data={formData.rotation}
            />

            {/* Scores */}
            <FactorScores
                isScoresOpen={isScoresOpen}
                setIsScoresOpen={setIsScoresOpen}
                updateFormData={(field, value) =>
                    updateFormData("scores", field, value)
                }
                data={formData.scores}
            />

            {/* Options */}
            <FactorOptions
                isOptionsOpen={isOptionsOpen}
                setIsOptionsOpen={setIsOptionsOpen}
                updateFormData={(field, value) =>
                    updateFormData("options", field, value)
                }
                data={formData.options}
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
    const [isDescriptivesOpen, setIsDescriptivesOpen] = useState(false);
    const [isExtractionOpen, setIsExtractionOpen] = useState(false);
    const [isRotationOpen, setIsRotationOpen] = useState(false);
    const [isScoresOpen, setIsScoresOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

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
                {/* Header dihapus atau dikondisikan sesuai kebutuhan layout sidebar Anda */}
                {false && (
                    <div className="px-6 py-4 border-b border-border flex-shrink-0">
                        <h2 className="text-[22px] font-semibold">Factor Analysis</h2>
                    </div>
                )}
                
                <div className="flex-grow flex flex-col overflow-hidden">
                    <FactorContent
                        isMainOpen={isMainOpen}
                        setIsMainOpen={setIsMainOpen}
                        isValueOpen={isValueOpen}
                        setIsValueOpen={setIsValueOpen}
                        isDescriptivesOpen={isDescriptivesOpen}
                        setIsDescriptivesOpen={setIsDescriptivesOpen}
                        isExtractionOpen={isExtractionOpen}
                        setIsExtractionOpen={setIsExtractionOpen}
                        isRotationOpen={isRotationOpen}
                        setIsRotationOpen={setIsRotationOpen}
                        isScoresOpen={isScoresOpen}
                        setIsScoresOpen={setIsScoresOpen}
                        isOptionsOpen={isOptionsOpen}
                        setIsOptionsOpen={setIsOptionsOpen}
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
                
                {/* Header di sini hanya ditampilkan jika FactorDialog (Main) aktif.
                   Kita bisa menggunakan logika yang sama, tapi karena Header "Factor Analysis 2" 
                   ini terikat dengan wrapper DialogContent, lebih aman kita biarkan.
                   Namun, jika sub-menu terbuka, FactorContent akan menyembunyikan isinya sendiri.
                   Jika Anda ingin Header DIALOG ini juga hilang saat sub-menu buka,
                   Anda perlu memindahkan state isSubMenuOpen ke FactorContainer, 
                   tapi untuk saat ini biarkan seperti ini agar konsisten.
                */}
                
                <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-[22px] font-semibold">Factor Analysis2</DialogTitle>
                </DialogHeader>
                
                <div className="flex-grow flex flex-col overflow-hidden">
                    <FactorContent
                        isMainOpen={isMainOpen}
                        setIsMainOpen={setIsMainOpen}
                        isValueOpen={isValueOpen}
                        setIsValueOpen={setIsValueOpen}
                        isDescriptivesOpen={isDescriptivesOpen}
                        setIsDescriptivesOpen={setIsDescriptivesOpen}
                        isExtractionOpen={isExtractionOpen}
                        setIsExtractionOpen={setIsExtractionOpen}
                        isRotationOpen={isRotationOpen}
                        setIsRotationOpen={setIsRotationOpen}
                        isScoresOpen={isScoresOpen}
                        setIsScoresOpen={setIsScoresOpen}
                        isOptionsOpen={isOptionsOpen}
                        setIsOptionsOpen={setIsOptionsOpen}
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