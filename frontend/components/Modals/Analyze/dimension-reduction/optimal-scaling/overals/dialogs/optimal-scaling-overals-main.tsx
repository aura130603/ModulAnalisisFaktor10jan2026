import {useEffect, useMemo, useRef, useState} from "react";
import {
    OptScaOveralsDefineRange
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/overals/dialogs/define-range";
import {
    OptScaOveralsDefineRangeScale
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/overals/dialogs/define-range-scale";
import {
    OptScaOveralsDialog
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/overals/dialogs/dialog";
import {
    OptScaOveralsOptions
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/overals/dialogs/options";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {
    OptScaOveralsDefault
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/overals/constants/optimal-scaling-overals-default";
import {useModal} from "@/hooks/useModal";
import {
    DialogHandlers,
    OptScaOveralsContainerProps,
    OptScaOveralsDefineRangeScaleType,
    OptScaOveralsDefineRangeType,
    OptScaOveralsMainType,
    OptScaOveralsType,
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/overals/types/optimal-scaling-overals";
import {
    analyzeOptScaOverals
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/overals/services/optimal-scaling-overals-analysis";
import {useDataStore} from "@/stores/useDataStore";
import {useVariableStore} from "@/stores/useVariableStore";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";

export const OptScaOveralsContainer = ({
    onClose,
}: OptScaOveralsContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<OptScaOveralsType>({
        ...OptScaOveralsDefault,
    });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isDefineRangeScaleOpen, setIsDefineRangeScaleOpen] = useState(false);
    const [isDefineRangeOpen, setIsDefineRangeOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

    // Ref to access dialog functions
    const dialogRef = useRef<DialogHandlers>(null);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("OVERALS");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...OptScaOveralsDefault });
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

    // Callback for Define Range Scale updates
    const handleDefineRangeScaleUpdate = (
        data: OptScaOveralsDefineRangeScaleType
    ) => {
        if (dialogRef.current) {
            dialogRef.current.handleDefineRangeScaleContinue(data);
        }
    };

    // Callback for Define Range updates
    const handleDefineRangeUpdate = (data: OptScaOveralsDefineRangeType) => {
        if (dialogRef.current) {
            dialogRef.current.handleDefineRangeContinue(data);
        }
    };

    const executeOptScaOverals = async (mainData: OptScaOveralsMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("OVERALS", newFormData);

            await analyzeOptScaOverals({
                configData: newFormData,
                dataVariables: dataVariables,
                variables: variables,
            });
        } catch (error) {
            console.error(error);
        }

        closeModal();
    };

    const resetFormData = async () => {
        try {
            await clearFormData("OVERALS");
            setFormData({ ...OptScaOveralsDefault });
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
                <OptScaOveralsDialog
                    ref={dialogRef}
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsDefineRangeScaleOpen={setIsDefineRangeScaleOpen}
                    setIsDefineRangeOpen={setIsDefineRangeOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeOptScaOverals(mainData)}
                    onReset={resetFormData}
                />

                {/* Define Range Scale */}
                <OptScaOveralsDefineRangeScale
                    isDefineRangeScaleOpen={isDefineRangeScaleOpen}
                    setIsDefineRangeScaleOpen={setIsDefineRangeScaleOpen}
                    updateFormData={(field, value) =>
                        updateFormData("defineRangeScale", field, value)
                    }
                    data={formData.defineRangeScale}
                    onContinue={handleDefineRangeScaleUpdate}
                />

                {/* Define Range */}
                <OptScaOveralsDefineRange
                    isDefineRangeOpen={isDefineRangeOpen}
                    setIsDefineRangeOpen={setIsDefineRangeOpen}
                    updateFormData={(field, value) =>
                        updateFormData("defineRange", field, value)
                    }
                    data={formData.defineRange}
                    onContinue={handleDefineRangeUpdate}
                />

                {/* Options */}
                <OptScaOveralsOptions
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
