import {useEffect, useMemo, useState} from "react";
import {KNNDialog} from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/dialog";
import {
    KNNContainerProps,
    KNNMainType,
    KNNType,
} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor";
import {KNNDefault} from "@/components/Modals/Analyze/Classify/nearest-neighbor/constants/nearest-neighbor-default";
import {KNNNeighbors} from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/neighbors";
import {KNNFeatures} from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/features";
import {KNNPartition} from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/partition";
import {KNNSave} from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/save";
import {KNNOutput} from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/output";
import {KNNOptions} from "@/components/Modals/Analyze/Classify/nearest-neighbor/dialogs/options";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {useModal} from "@/hooks/useModal";
import {useVariableStore} from "@/stores/useVariableStore";
import {useDataStore} from "@/stores/useDataStore";
import {useResultStore} from "@/stores/useResultStore";
import {analyzeKNN} from "@/components/Modals/Analyze/Classify/nearest-neighbor/services/nearest-neighbor-analysis";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";

export const KNNContainer = ({ onClose }: KNNContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<KNNType>({ ...KNNDefault });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isNeighborsOpen, setIsNeighborsOpen] = useState(false);
    const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
    const [isPartitionOpen, setIsPartitionOpen] = useState(false);
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isOutputOpen, setIsOutputOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    const { closeModal } = useModal();
    const { addLog, addAnalytic, addStatistic } = useResultStore();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("NearestNeighbor");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...KNNDefault });
                }
            } catch (error) {
                console.error("Failed to load form data:", error);
            }
        };

        loadFormData();
    }, []);

    useEffect(() => {
        if (formData.main.FeatureVar) {
            setFormData((prev) => ({
                ...prev,
                features: {
                    ...prev.features,
                    ForwardSelection: prev.main.FeatureVar
                        ? [...prev.main.FeatureVar]
                        : [],
                },
                partition: {
                    ...prev.partition,
                    SrcVar: prev.main.FeatureVar
                        ? [...prev.main.FeatureVar]
                        : [],
                },
            }));
        }
    }, [formData.main.FeatureVar]);

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

    const executeKNN = async (mainData: KNNMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("NearestNeighbor", newFormData);

            await analyzeKNN({
                configData: newFormData,
                dataVariables: dataVariables,
                variables: variables,
            });
        } catch (error) {
            console.error(error);
        }

        closeModal();
        onClose();
    };

    const resetFormData = async () => {
        try {
            await clearFormData("NearestNeighbor");
            setFormData({ ...KNNDefault });
        } catch (error) {
            console.error("Failed to clear form data:", error);
        }
    };

    const handleClose = () => {
        closeModal();
        onClose();
    };

    return (
        <Dialog open={isMainOpen} onOpenChange={handleClose}>
            <DialogTitle></DialogTitle>
            <DialogContent>
                <KNNDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsNeighborsOpen={setIsNeighborsOpen}
                    setIsFeaturesOpen={setIsFeaturesOpen}
                    setIsPartitionOpen={setIsPartitionOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    setIsOutputOpen={setIsOutputOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeKNN(mainData)}
                    onReset={resetFormData}
                />

                {/* Neighbors */}
                <KNNNeighbors
                    isNeighborsOpen={isNeighborsOpen}
                    setIsNeighborsOpen={setIsNeighborsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("neighbors", field, value)
                    }
                    data={formData.neighbors}
                />

                {/* Features */}
                <KNNFeatures
                    isFeaturesOpen={isFeaturesOpen}
                    setIsFeaturesOpen={setIsFeaturesOpen}
                    updateFormData={(field, value) =>
                        updateFormData("features", field, value)
                    }
                    data={formData.features}
                />

                {/* Partition */}
                <KNNPartition
                    isPartitionOpen={isPartitionOpen}
                    setIsPartitionOpen={setIsPartitionOpen}
                    updateFormData={(field, value) =>
                        updateFormData("partition", field, value)
                    }
                    data={formData.partition}
                />

                {/* Save */}
                <KNNSave
                    isSaveOpen={isSaveOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    updateFormData={(field, value) =>
                        updateFormData("save", field, value)
                    }
                    data={formData.save}
                />

                {/* Output */}
                <KNNOutput
                    isOutputOpen={isOutputOpen}
                    setIsOutputOpen={setIsOutputOpen}
                    updateFormData={(field, value) =>
                        updateFormData("output", field, value)
                    }
                    data={formData.output}
                />

                {/* Options */}
                <KNNOptions
                    isOptionsOpen={isOptionsOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("options", field, value)
                    }
                    data={formData.options}
                />
            </DialogContent>
        </Dialog>
    );
};
