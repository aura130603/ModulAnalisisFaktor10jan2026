import { useEffect, useMemo, useState } from "react";
import { KMeansClusterDefault } from "@/components/Modals/Analyze/Classify/k-means-cluster/constants/k-means-cluster-default";
import {
    KMeansClusterContainerProps,
    KMeansClusterMainType,
    KMeansClusterType,
} from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster";
import { KMeansClusterDialog } from "@/components/Modals/Analyze/Classify/k-means-cluster/dialogs/dialog";
import { KMeansClusterIterate } from "@/components/Modals/Analyze/Classify/k-means-cluster/dialogs/iterate";
import { KMeansClusterSave } from "@/components/Modals/Analyze/Classify/k-means-cluster/dialogs/save";
import { KMeansClusterOptions } from "@/components/Modals/Analyze/Classify/k-means-cluster/dialogs/options";
import { useModal } from "@/hooks/useModal";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { analyzeKMeansCluster } from "@/components/Modals/Analyze/Classify/k-means-cluster/services/k-means-cluster-analysis";
import { clearFormData, getFormData, saveFormData } from "@/hooks/useIndexedDB";
import { toast } from "sonner";

export const KMeansClusterContainer = ({
    onClose,
}: KMeansClusterContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<KMeansClusterType>({
        ...KMeansClusterDefault,
    });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isIterateOpen, setIsIterateOpen] = useState(false);
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            const savedData = await getFormData("KMeansCluster");
            if (savedData) {
                const { id, ...formDataWithoutId } = savedData;
                setFormData(formDataWithoutId);
            } else {
                setFormData({ ...KMeansClusterDefault });
            }
        };

        toast.promise(loadFormData, {
            loading: "Loading K-Means Cluster settings...",
            success: () => {
                return "K-Means Cluster settings loaded successfully.";
            },
            error: (err) => {
                return (
                    <span>
                        An error occurred while loading settings.
                        <br />
                        Error: {String(err)}
                    </span>
                );
            },
        });
    }, []);

    const updateFormData = <T extends keyof typeof formData>(
        section: T,
        field: keyof (typeof formData)[T],
        value: unknown
    ) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const executeKMeansCluster = async (mainData: KMeansClusterMainType) => {
        closeModal();
        onClose();

        const promise = async () => {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("KMeansCluster", newFormData);

            await analyzeKMeansCluster({
                configData: newFormData,
                dataVariables: dataVariables,
                variables: variables,
            });
        };

        toast.promise(promise, {
            loading: "Running K-Means Cluster analysis...",
            success: () => {
                return "K-Means Cluster analysis has been completed successfully.";
            },
            error: (err) => {
                return (
                    <span>
                        An error occurred during K-Means Cluster analysis.
                        <br />
                        Error: {String(err)}
                    </span>
                );
            },
        });
    };

    const resetFormData = async () => {
        try {
            setFormData({ ...KMeansClusterDefault });
            await clearFormData("KMeansCluster");
        } catch (error) {
            toast.error("Failed to clear form data:", error ?? "");
        }
    };

    const openSection = (section: "main" | "iterate" | "save" | "options") => {
        // Close all sections first
        setIsMainOpen(false);
        setIsIterateOpen(false);
        setIsSaveOpen(false);
        setIsOptionsOpen(false);

        // Open the requested section
        switch (section) {
            case "main":
                setIsMainOpen(true);
                break;
            case "iterate":
                setIsIterateOpen(true);
                break;
            case "save":
                setIsSaveOpen(true);
                break;
            case "options":
                setIsOptionsOpen(true);
                break;
        }
    };

    const handleContinue = () => {
        openSection("main");
    };

    return (
        <div className="flex-grow overflow-y-auto flex flex-col h-full">
            {isMainOpen && (
                <KMeansClusterDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={(value) =>
                        value ? openSection("main") : setIsMainOpen(false)
                    }
                    setIsIterateOpen={(value) =>
                        value ? openSection("iterate") : setIsIterateOpen(false)
                    }
                    setIsSaveOpen={(value) =>
                        value ? openSection("save") : setIsSaveOpen(false)
                    }
                    setIsOptionsOpen={(value) =>
                        value ? openSection("options") : setIsOptionsOpen(false)
                    }
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeKMeansCluster(mainData)}
                    onReset={resetFormData}
                />
            )}

            {isIterateOpen && (
                <KMeansClusterIterate
                    isIterateOpen={isIterateOpen}
                    setIsIterateOpen={(value) =>
                        value ? openSection("iterate") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("iterate", field, value)
                    }
                    data={formData.iterate}
                />
            )}

            {isSaveOpen && (
                <KMeansClusterSave
                    isSaveOpen={isSaveOpen}
                    setIsSaveOpen={(value) =>
                        value ? openSection("save") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("save", field, value)
                    }
                    data={formData.save}
                />
            )}

            {isOptionsOpen && (
                <KMeansClusterOptions
                    isOptionsOpen={isOptionsOpen}
                    setIsOptionsOpen={(value) =>
                        value ? openSection("options") : handleContinue()
                    }
                    updateFormData={(field, value) =>
                        updateFormData("options", field, value)
                    }
                    data={formData.options}
                />
            )}
        </div>
    );
};

export default KMeansClusterContainer;
