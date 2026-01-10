import {useEffect, useMemo, useState} from "react";
import {DiscriminantDialog} from "@/components/Modals/Analyze/Classify/discriminant/dialogs/dialog";
import {DiscriminantDefineRange} from "@/components/Modals/Analyze/Classify/discriminant/dialogs/define-range";
import {DiscriminantSetValue} from "@/components/Modals/Analyze/Classify/discriminant/dialogs/set-value";
import {DiscriminantStatistics} from "@/components/Modals/Analyze/Classify/discriminant/dialogs/statistics";
import {DiscriminantMethod} from "@/components/Modals/Analyze/Classify/discriminant/dialogs/method";
import {DiscriminantClassify} from "@/components/Modals/Analyze/Classify/discriminant/dialogs/classify";
import {DiscriminantSave} from "@/components/Modals/Analyze/Classify/discriminant/dialogs/save";
import {DiscriminantBootstrap} from "@/components/Modals/Analyze/Classify/discriminant/dialogs/bootstrap";
import {
    DiscriminantContainerProps,
    DiscriminantMainType,
    DiscriminantType,
} from "@/components/Modals/Analyze/Classify/discriminant/types/discriminant";
import {DiscriminantDefault} from "@/components/Modals/Analyze/Classify/discriminant/constants/discriminant-default";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {useModal} from "@/hooks/useModal";
import {useVariableStore} from "@/stores/useVariableStore";
import {useDataStore} from "@/stores/useDataStore";
import {analyzeDiscriminant} from "@/components/Modals/Analyze/Classify/discriminant/services/discriminant-analysis";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";

export const DiscriminantContainer = ({
    onClose,
}: DiscriminantContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<DiscriminantType>({
        ...DiscriminantDefault,
    });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isDefineRangeOpen, setIsDefineRangeOpen] = useState(false);
    const [isSetValueOpen, setIsSetValueOpen] = useState(false);
    const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
    const [isMethodOpen, setIsMethodOpen] = useState(false);
    const [isClassifyOpen, setIsClassifyOpen] = useState(false);
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isBootstrapOpen, setIsBootstrapOpen] = useState(false);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("Discriminant");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...DiscriminantDefault });
                }
            } catch (error) {
                console.error("Failed to load form data:", error);
            }
        };

        loadFormData();
    }, []);

    useEffect(() => {
        setFormData((prev) => {
            // Create a copy of the previous state to modify
            const newState = { ...prev };

            // Combine AnalysisVars and SuppleVars for QuantifiedVars
            const independentVars = prev.main.IndependentVariables
                ? [...prev.main.IndependentVariables]
                : [];

            const usedVariables = [
                prev.main.GroupingVariable,
                ...independentVars,
                prev.main.SelectionVariable,
            ];

            const updatedVariables = tempVariables.filter(
                (variable) => !usedVariables.includes(variable)
            );

            newState.bootstrap = {
                ...prev.bootstrap,
                Variables: updatedVariables,
            };

            return newState;
        });
    }, [
        formData.main.IndependentVariables,
        formData.main.GroupingVariable,
        formData.main.SelectionVariable,
        tempVariables,
    ]);

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

    const executeDiscriminant = async (mainData: DiscriminantMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("Discriminant", newFormData);

            await analyzeDiscriminant({
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
            await clearFormData("Discriminant");
            setFormData({ ...DiscriminantDefault });
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
                <DiscriminantDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsDefineRangeOpen={setIsDefineRangeOpen}
                    setIsSetValueOpen={setIsSetValueOpen}
                    setIsStatisticsOpen={setIsStatisticsOpen}
                    setIsMethodOpen={setIsMethodOpen}
                    setIsClassifyOpen={setIsClassifyOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    setIsBootstrapOpen={setIsBootstrapOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeDiscriminant(mainData)}
                    onReset={resetFormData}
                />

                {/* Define Range */}
                <DiscriminantDefineRange
                    isDefineRangeOpen={isDefineRangeOpen}
                    setIsDefineRangeOpen={setIsDefineRangeOpen}
                    updateFormData={(field, value) =>
                        updateFormData("defineRange", field, value)
                    }
                    data={formData.defineRange}
                />

                {/* Define Range */}
                <DiscriminantSetValue
                    isSetValueOpen={isSetValueOpen}
                    setIsSetValueOpen={setIsSetValueOpen}
                    updateFormData={(field, value) =>
                        updateFormData("setValue", field, value)
                    }
                    data={formData.setValue}
                />

                {/* Statistics */}
                <DiscriminantStatistics
                    isStatisticsOpen={isStatisticsOpen}
                    setIsStatisticsOpen={setIsStatisticsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("statistics", field, value)
                    }
                    data={formData.statistics}
                />

                {/* Method */}
                <DiscriminantMethod
                    isMethodOpen={isMethodOpen}
                    setIsMethodOpen={setIsMethodOpen}
                    updateFormData={(field, value) =>
                        updateFormData("method", field, value)
                    }
                    data={formData.method}
                />

                {/* Classify */}
                <DiscriminantClassify
                    isClassifyOpen={isClassifyOpen}
                    setIsClassifyOpen={setIsClassifyOpen}
                    updateFormData={(field, value) =>
                        updateFormData("classify", field, value)
                    }
                    data={formData.classify}
                />

                {/* Save */}
                <DiscriminantSave
                    isSaveOpen={isSaveOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    updateFormData={(field, value) =>
                        updateFormData("save", field, value)
                    }
                    data={formData.save}
                />

                {/* Bootstrap */}
                <DiscriminantBootstrap
                    isBootstrapOpen={isBootstrapOpen}
                    setIsBootstrapOpen={setIsBootstrapOpen}
                    updateFormData={(field, value) =>
                        updateFormData("bootstrap", field, value)
                    }
                    data={formData.bootstrap}
                />
            </DialogContent>
        </Dialog>
    );
};
