import {useEffect, useMemo, useState} from "react";
import {
    CorrespondenceContainerProps,
    CorrespondenceMainType,
    CorrespondenceType,
} from "@/components/Modals/Analyze/dimension-reduction/correspondence-analysis/types/correspondence-analysis";
import {
    CorrespondenceDefault
} from "@/components/Modals/Analyze/dimension-reduction/correspondence-analysis/constants/correspondence-analysis-default";
import {
    CorrespondenceDialog
} from "@/components/Modals/Analyze/dimension-reduction/correspondence-analysis/dialogs/dialog";
import {
    CorrespondenceDefineRangeRow
} from "@/components/Modals/Analyze/dimension-reduction/correspondence-analysis/dialogs/define-range-row";
import {
    CorrespondenceDefineRangeColumn
} from "@/components/Modals/Analyze/dimension-reduction/correspondence-analysis/dialogs/define-range-column";
import {
    CorrespondencePlots
} from "@/components/Modals/Analyze/dimension-reduction/correspondence-analysis/dialogs/plots";
import {
    CorrespondenceModel
} from "@/components/Modals/Analyze/dimension-reduction/correspondence-analysis/dialogs/model";
import {
    CorrespondenceStatistics
} from "@/components/Modals/Analyze/dimension-reduction/correspondence-analysis/dialogs/statistics";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {useModal} from "@/hooks/useModal";
import {useVariableStore} from "@/stores/useVariableStore";
import {useDataStore} from "@/stores/useDataStore";
import {
    analyzeCorrespondence
} from "@/components/Modals/Analyze/dimension-reduction/correspondence-analysis/services/correspondence-analysis-analysis";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";
import {useMetaStore} from "@/stores/useMetaStore";

export const CorrespondenceContainer = ({
    onClose,
}: CorrespondenceContainerProps) => {
    const variables = useVariableStore((state) => state.variables);
    const dataVariables = useDataStore((state) => state.data);
    const tempVariables = useMemo(
        () => variables.map((variable) => variable.name),
        [variables]
    );
    const meta = useMetaStore((state) => state.meta);

    const [formData, setFormData] = useState<CorrespondenceType>({
        ...CorrespondenceDefault,
    });
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isDefineRangeRowOpen, setIsDefineRangeRowOpen] = useState(false);
    const [isDefineRangeColumnOpen, setIsDefineRangeColumnOpen] =
        useState(false);
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
    const [isPlotsOpen, setIsPlotsOpen] = useState(false);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("CorrespondenceAnalysis");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...CorrespondenceDefault });
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

            newState.defineRangeColumn = {
                ...prev.defineRangeColumn,
                DefaultListModel: formData.main.ColTargetVar ?? "",
            };

            newState.defineRangeRow = {
                ...prev.defineRangeRow,
                DefaultListModel: formData.main.RowTargetVar ?? "",
            };

            return newState;
        });
    }, [formData.main.ColTargetVar, formData.main.RowTargetVar]);

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

    const executeCorrespondence = async (mainData: CorrespondenceMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("CorrespondenceAnalysis", newFormData);

            await analyzeCorrespondence({
                configData: newFormData,
                dataVariables: dataVariables,
                variables: variables,
                meta: meta,
            });
        } catch (error) {
            console.error(error);
        }

        closeModal();
        onClose();
    };

    const resetFormData = async () => {
        try {
            await clearFormData("CorrespondenceAnalysis");
            setFormData({ ...CorrespondenceDefault });
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
                <CorrespondenceDialog
                    isMainOpen={isMainOpen}
                    setIsMainOpen={setIsMainOpen}
                    setIsDefineRangeRowOpen={setIsDefineRangeRowOpen}
                    setIsDefineRangeColumnOpen={setIsDefineRangeColumnOpen}
                    setIsModelOpen={setIsModelOpen}
                    setIsStatisticsOpen={setIsStatisticsOpen}
                    setIsPlotsOpen={setIsPlotsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    globalVariables={tempVariables}
                    onContinue={(mainData) => executeCorrespondence(mainData)}
                    onReset={resetFormData}
                />

                {/* Define Range Row */}
                <CorrespondenceDefineRangeRow
                    isDefineRangeRowOpen={isDefineRangeRowOpen}
                    setIsDefineRangeRowOpen={setIsDefineRangeRowOpen}
                    updateFormData={(field, value) =>
                        updateFormData("defineRangeRow", field, value)
                    }
                    data={formData.defineRangeRow}
                />

                {/* Define Range Column */}
                <CorrespondenceDefineRangeColumn
                    isDefineRangeColumnOpen={isDefineRangeColumnOpen}
                    setIsDefineRangeColumnOpen={setIsDefineRangeColumnOpen}
                    updateFormData={(field, value) =>
                        updateFormData("defineRangeColumn", field, value)
                    }
                    data={formData.defineRangeColumn}
                />

                {/* Model */}
                <CorrespondenceModel
                    isModelOpen={isModelOpen}
                    setIsModelOpen={setIsModelOpen}
                    updateFormData={(field, value) =>
                        updateFormData("model", field, value)
                    }
                    data={formData.model}
                />

                {/* Statistics */}
                <CorrespondenceStatistics
                    isStatisticsOpen={isStatisticsOpen}
                    setIsStatisticsOpen={setIsStatisticsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("statistics", field, value)
                    }
                    data={formData.statistics}
                />

                {/* Plots */}
                <CorrespondencePlots
                    isPlotsOpen={isPlotsOpen}
                    setIsPlotsOpen={setIsPlotsOpen}
                    updateFormData={(field, value) =>
                        updateFormData("plots", field, value)
                    }
                    data={formData.plots}
                />
            </DialogContent>
        </Dialog>
    );
};
