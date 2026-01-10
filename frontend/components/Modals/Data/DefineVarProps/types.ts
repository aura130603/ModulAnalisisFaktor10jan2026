import type { Variable} from "@/types/Variable";
import { ValueLabel, MissingValuesSpec } from "@/types/Variable";

export interface DefineVariablePropsProps {
    onClose: () => void;
    variables?: Variable[];
    caseLimit?: string;
    valueLimit?: string;
    containerType?: "dialog" | "sidebar";
}

export interface VariablesToScanProps {
    onClose: () => void;
    onContinue: (variables: Variable[], caseLimit: string | null, valueLimit: string | null) => void;
    containerType?: "dialog" | "sidebar";
}

export interface PropertiesEditorProps {
    onClose: () => void;
    variables: Variable[];
    caseLimit: string;
    valueLimit: string;
    onSave?: (variables: Variable[]) => void;
    containerType?: "dialog" | "sidebar";
}

// PropertiesEditorProps will be added here later when refactoring that component 