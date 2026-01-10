import type { Variable } from "@/types/Variable";
import { Shapes, Ruler, BarChartHorizontal } from "lucide-react";
import React from "react";

/**
 * Returns an appropriate icon based on the variable's measurement level
 */
export const getVariableIcon = (variable: Variable) => {
    switch (variable.measure) {
        case "scale":
            return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "nominal":
            return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "ordinal":
            return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        default:
            return variable.type === "STRING"
                ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
    }
};

/**
 * Returns a display name for a variable, using label if available
 */
export const getDisplayName = (variable: Variable): string => {
    if (variable.label) {
        return `${variable.label} [${variable.name}]`;
    }
    return variable.name;
}; 