import {useEffect, useMemo, useState} from "react";
import {TreeContainerProps, TreeMainType, TreeType,} from "@/components/Modals/Analyze/Classify/tree/types/tree";
import {TreeDefault} from "@/components/Modals/Analyze/Classify/tree/constants/tree-default";
import {TreeDialog} from "@/components/Modals/Analyze/Classify/tree/dialogs/dialog";
import {TreeCategories} from "@/components/Modals/Analyze/Classify/tree/dialogs/categories";
import {TreeSave} from "@/components/Modals/Analyze/Classify/tree/dialogs/save";
import {TreeOutput} from "@/components/Modals/Analyze/Classify/tree/dialogs/output";
import {TreeValidation} from "@/components/Modals/Analyze/Classify/tree/dialogs/validation";
import {TreeCriteria} from "@/components/Modals/Analyze/Classify/tree/dialogs/criteria";
import {TreeOptions} from "@/components/Modals/Analyze/Classify/tree/dialogs/options";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {useModal} from "@/hooks/useModal";
import {useVariableStore} from "@/stores/useVariableStore";
import {useDataStore} from "@/stores/useDataStore";
import {analyzeTree} from "@/components/Modals/Analyze/Classify/tree/services/tree-analysis";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";

export const TreeContainer = ({ onClose }: TreeContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<TreeType>({ ...TreeDefault });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isOutputOpen, setIsOutputOpen] = useState(false);
    const [isValidationOpen, setIsValidationOpen] = useState(false);
    const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("Tree");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...TreeDefault });
                }
            } catch (error) {
                console.error("Failed to load form data:", error);
            }
        };

        loadFormData();
    }, []);

    useEffect(() => {
        if (formData.main) {
            const usedVariables = [
                formData.main.DependentTargetVar,
                ...(formData.main.IndependentTargetVar || []),
                formData.main.InfluenceTargetVar,
            ].filter(Boolean);

            const updatedVariables = tempVariables.filter(
                (variable) => !usedVariables.includes(variable)
            );
            setFormData((prev) => ({
                ...prev,
                validation: {
                    ...prev.validation,
                    SrcVar: updatedVariables ? [...updatedVariables] : [],
                },
            }));
        }
    }, [formData.main, tempVariables]);

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

    const executeTree = async (mainData: TreeMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("Tree", newFormData);

            await analyzeTree({
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
            await clearFormData("Tree");
            setFormData({ ...TreeDefault });
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
                <TreeDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsCategoriesOpen={setIsCategoriesOpen}
                    setIsOutputOpen={setIsOutputOpen}
                    setIsValidationOpen={setIsValidationOpen}
                    setIsCriteriaOpen={setIsCriteriaOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeTree(mainData)}
                    onReset={resetFormData}
                />

                {/* Categories */}
                <TreeCategories
                    isCategoriesOpen={isCategoriesOpen}
                    setIsCategoriesOpen={setIsCategoriesOpen}
                    updateFormData={(field, value) =>
                        updateFormData("categories", field, value)
                    }
                    data={formData.categories}
                />

                {/* Output */}
                <TreeOutput
                    isOutputOpen={isOutputOpen}
                    setIsOutputOpen={setIsOutputOpen}
                    updateFormData={(field, value) =>
                        updateFormData("output", field, value)
                    }
                    data={formData.output}
                />

                {/* Validation */}
                <TreeValidation
                    isValidationOpen={isValidationOpen}
                    setIsValidationOpen={setIsValidationOpen}
                    updateFormData={(field, value) =>
                        updateFormData("validation", field, value)
                    }
                    data={formData.validation}
                />

                {/* Criteria */}
                <TreeCriteria
                    isCriteriaOpen={isCriteriaOpen}
                    setIsCriteriaOpen={setIsCriteriaOpen}
                    updateFormData={(field, value) =>
                        updateFormData("criteria", field, value)
                    }
                    data={formData.criteria}
                />

                {/* Save */}
                <TreeSave
                    isSaveOpen={isSaveOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    updateFormData={(field, value) =>
                        updateFormData("save", field, value)
                    }
                    data={formData.save}
                />

                {/* Options */}
                <TreeOptions
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
