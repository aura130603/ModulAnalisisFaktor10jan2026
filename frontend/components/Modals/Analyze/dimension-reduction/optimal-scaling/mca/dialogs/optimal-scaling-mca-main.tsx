import {useEffect, useMemo, useRef, useState} from "react";
import {
    DialogHandlers,
    OptScaMCAContainerProps,
    OptScaMCADefineVariableType,
    OptScaMCAMainType,
    OptScaMCAType,
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/types/optimal-scaling-mca";
import {
    OptScaMCADefault
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/constants/optimal-scaling-mca-default";
import {OptScaMCADialog} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/dialogs/dialog";
import {
    OptScaMCADefineVariable
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/dialogs/define-variable";
import {
    OptScaMCAVariablePlots
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/dialogs/variable-plots";
import {
    OptScaMCADiscretize
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/dialogs/discretize";
import {OptScaMCAMissing} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/dialogs/missing";
import {OptScaMCAOptions} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/dialogs/options";
import {OptScaMCAOutput} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/dialogs/output";
import {OptScaMCASave} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/dialogs/save";
import {
    OptScaMCAObjectPlots
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/dialogs/object-plots";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {useModal} from "@/hooks/useModal";
import {useVariableStore} from "@/stores/useVariableStore";
import {useDataStore} from "@/stores/useDataStore";
import {
    analyzeOptScaMCA
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/services/optimal-scaling-mca-analysis";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";

export const OptScaMCAContainer = ({ onClose }: OptScaMCAContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );

    const [formData, setFormData] = useState<OptScaMCAType>({
        ...OptScaMCADefault,
    });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isDefineVariableOpen, setIsDefineVariableOpen] = useState(false);
    const [isDiscretizeOpen, setIsDiscretizeOpen] = useState(false);
    const [isMissingOpen, setIsMissingOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isOutputOpen, setIsOutputOpen] = useState(false);
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isObjectPlotsOpen, setIsObjectPlotsOpen] = useState(false);
    const [isVariablePlotsOpen, setIsVariablePlotsOpen] = useState(false);

    // Ref for accessing dialog functions
    const dialogRef = useRef<DialogHandlers>(null);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("MCA");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...OptScaMCADefault });
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

            // Update discretize based on AnalysisVars (if it exists)
            if (prev.main.AnalysisVars) {
                newState.discretize = {
                    ...prev.discretize,
                    VariablesList: [...prev.main.AnalysisVars],
                };

                newState.missing = {
                    ...prev.missing,
                    AnalysisVariables: [...prev.main.AnalysisVars],
                };
            }

            // Update missing.SupplementaryVariables based on SuppleVars (if it exists)
            if (prev.main.SuppleVars) {
                newState.missing = {
                    ...(newState.missing || prev.missing),
                    SupplementaryVariables: [...prev.main.SuppleVars],
                };
            }

            // Combine AnalysisVars and SuppleVars for any output variables
            const analysisVars = prev.main.AnalysisVars
                ? [...prev.main.AnalysisVars]
                : [];
            const suppleVars = prev.main.SuppleVars
                ? [...prev.main.SuppleVars]
                : [];

            newState.output = {
                ...prev.output,
                QuantifiedVars: [...analysisVars, ...suppleVars],
            };

            newState.objectPlots = {
                ...prev.objectPlots,
                BTAvailableVars: [...analysisVars, ...suppleVars],
            };

            newState.variablePlots = {
                ...prev.variablePlots,
                SourceVar: [...analysisVars, ...suppleVars],
            };

            // Update based on LabelingVars (if it exists)
            if (prev.main.LabelingVars) {
                newState.output = {
                    ...newState.output,
                    LabelingVars: [...prev.main.LabelingVars],
                };
                newState.objectPlots = {
                    ...newState.objectPlots,
                    LabelObjAvailableVars: [...prev.main.LabelingVars],
                };
            }

            return newState;
        });
    }, [
        formData.main.AnalysisVars,
        formData.main.SuppleVars,
        formData.main.LabelingVars,
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

    // Callback for handling variable weight updates
    const handleDefineVariableUpdate = (data: OptScaMCADefineVariableType) => {
        // Call the function in the dialog component to update the variable
        if (dialogRef.current) {
            dialogRef.current.handleDefineVariableContinue(data);
        }
    };

    const executeOptScaMCA = async (mainData: OptScaMCAMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("MCA", newFormData);

            await analyzeOptScaMCA({
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
            await clearFormData("MCA");
            setFormData({ ...OptScaMCADefault });
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
                <OptScaMCADialog
                    ref={dialogRef}
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsDefineVariableOpen={setIsDefineVariableOpen}
                    setIsDiscretizeOpen={setIsDiscretizeOpen}
                    setIsMissingOpen={setIsMissingOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    setIsOutputOpen={setIsOutputOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    setIsObjectPlotsOpen={setIsObjectPlotsOpen}
                    setIsVariablePlotsOpen={setIsVariablePlotsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeOptScaMCA(mainData)}
                    onReset={resetFormData}
                />

                {/* Define Variable */}
                <OptScaMCADefineVariable
                    isDefineVariableOpen={isDefineVariableOpen}
                    setIsDefineVariableOpen={setIsDefineVariableOpen}
                    updateFormData={(field, value) =>
                        updateFormData("defineVariable", field, value)
                    }
                    data={formData.defineVariable}
                    onContinue={handleDefineVariableUpdate}
                />

                {/* Discretize */}
                <OptScaMCADiscretize
                    isDiscretizeOpen={isDiscretizeOpen}
                    setIsDiscretizeOpen={setIsDiscretizeOpen}
                    updateFormData={(field, value) =>
                        updateFormData("discretize", field, value)
                    }
                    data={formData.discretize}
                />

                {/* Missing */}
                <OptScaMCAMissing
                    isMissingOpen={isMissingOpen}
                    setIsMissingOpen={setIsMissingOpen}
                    updateFormData={(field, value) =>
                        updateFormData("missing", field, value)
                    }
                    data={formData.missing}
                />

                {/* Options */}
                <OptScaMCAOptions
                    isOptionsOpen={isOptionsOpen}
                    setIsOptionsOpen={setIsOptionsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("options", field, value)
                    }
                    data={formData.options}
                />

                {/* Output */}
                <OptScaMCAOutput
                    isOutputOpen={isOutputOpen}
                    setIsOutputOpen={setIsOutputOpen}
                    updateFormData={(field, value) =>
                        updateFormData("output", field, value)
                    }
                    data={formData.output}
                />

                {/* Save */}
                <OptScaMCASave
                    isSaveOpen={isSaveOpen}
                    setIsSaveOpen={setIsSaveOpen}
                    updateFormData={(field, value) =>
                        updateFormData("save", field, value)
                    }
                    data={formData.save}
                />

                {/* Object Plots */}
                <OptScaMCAObjectPlots
                    isObjectPlotsOpen={isObjectPlotsOpen}
                    setIsObjectPlotsOpen={setIsObjectPlotsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("objectPlots", field, value)
                    }
                    data={formData.objectPlots}
                />

                {/* Variable Plots */}
                <OptScaMCAVariablePlots
                    isVariablePlotsOpen={isVariablePlotsOpen}
                    setIsVariablePlotsOpen={setIsVariablePlotsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("variablePlots", field, value)
                    }
                    data={formData.variablePlots}
                />
            </DialogContent>
        </Dialog>
    );
};
