import {useEffect, useMemo, useState} from "react";
import {
    RocCurveContainerProps,
    RocCurveMainType,
    RocCurveType,
} from "@/components/Modals/Analyze/Classify/roc-curve/types/roc-curve";
import {RocCurveDefault} from "@/components/Modals/Analyze/Classify/roc-curve/constants/roc-curve-default";
import {RocCurveDialog} from "@/components/Modals/Analyze/Classify/roc-curve/dialogs/dialog";
import {RocCurveOptions} from "@/components/Modals/Analyze/Classify/roc-curve/dialogs/options";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {useModal} from "@/hooks/useModal";
import {useVariableStore} from "@/stores/useVariableStore";
import {useDataStore} from "@/stores/useDataStore";
import {analyzeRocCurve} from "@/components/Modals/Analyze/Classify/roc-curve/services/roc-curve-analysis";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";

export const RocCurveContainer = ({ onClose }: RocCurveContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<RocCurveType>({
        ...RocCurveDefault,
    });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("ROCCurve");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...RocCurveDefault });
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
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const executeRocCurve = async (mainData: RocCurveMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("ROCCurve", newFormData);

            await analyzeRocCurve({
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
            await clearFormData("ROCCurve");
            setFormData({ ...RocCurveDefault });
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
                <RocCurveDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeRocCurve(mainData)}
                    onReset={resetFormData}
                />

                {/* Define Range */}
                <RocCurveOptions
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
