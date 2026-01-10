import {useEffect, useMemo, useState} from "react";
import {
    VarianceCompsContainerProps,
    VarianceCompsMainType,
    VarianceCompsType,
} from "@/components/Modals/Analyze/general-linear-model/variance-components/types/variance-components";
import {
    VarianceCompsDefault
} from "@/components/Modals/Analyze/general-linear-model/variance-components/constants/variance-components-default";
import {VarianceCompsDialog} from "@/components/Modals/Analyze/general-linear-model/variance-components/dialogs/dialog";
import {VarianceCompsModel} from "@/components/Modals/Analyze/general-linear-model/variance-components/dialogs/model";
import {
    VarianceCompsOptions
} from "@/components/Modals/Analyze/general-linear-model/variance-components/dialogs/options";
import {VarianceCompsSave} from "@/components/Modals/Analyze/general-linear-model/variance-components/dialogs/save";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {useModal} from "@/hooks/useModal";
import {useVariableStore} from "@/stores/useVariableStore";
import {useDataStore} from "@/stores/useDataStore";
import {
    analyzeVarianceComps
} from "@/components/Modals/Analyze/general-linear-model/variance-components/services/variance-components-analysis";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";

export const VarianceCompsContainer = ({
    onClose,
}: VarianceCompsContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<VarianceCompsType>({
        ...VarianceCompsDefault,
    });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isSaveOpen, setIsSaveOpen] = useState(false);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("ROCAnalysis");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...VarianceCompsDefault });
                }
            } catch (error) {
                console.error("Failed to load form data:", error);
            }
        };

        loadFormData();
    }, []);

    useEffect(() => {
        setFormData((prev) => {
            const newState = { ...prev };
            const factorVars = prev.main.FixFactor
                ? [...prev.main.FixFactor]
                : [];
            const randVars = prev.main.RandFactor
                ? [...prev.main.RandFactor]
                : [];
            const covarVars = prev.main.Covar ? [...prev.main.Covar] : [];

            newState.model = {
                ...prev.model,
                FactorsVar: [...factorVars, ...randVars, ...covarVars],
            };

            return newState;
        });
    }, [
        formData.main.DepVar,
        formData.main.FixFactor,
        formData.main.RandFactor,
        formData.main.Covar,
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

    const executeVarianceComps = async (mainData: VarianceCompsMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("ROCAnalysis", newFormData);

            await analyzeVarianceComps({
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
            await clearFormData("ROCAnalysis");
            setFormData({ ...VarianceCompsDefault });
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
                <VarianceCompsDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsModelOpen={setIsModelOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeVarianceComps(mainData)}
                    onReset={resetFormData}
                />

                {/* Model */}
                <VarianceCompsModel
                    isModelOpen={isModelOpen}
                    setIsModelOpen={setIsModelOpen}
                    updateFormData={(field, value) =>
                        updateFormData("model", field, value)
                    }
                    data={formData.model}
                />

                {/* Options */}
                <VarianceCompsOptions
                    isOptionsOpen={isOptionsOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("options", field, value)
                    }
                    data={formData.options}
                />

                {/* Save */}
                <VarianceCompsSave
                    isSaveOpen={isSaveOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    updateFormData={(field, value) =>
                        updateFormData("save", field, value)
                    }
                    data={formData.save}
                />
            </DialogContent>
        </Dialog>
    );
};
