import React from 'react';
import { Ruler, Shapes, BarChartHorizontal, FileQuestion } from "lucide-react";
import type { Variable } from "@/types/Variable";

export const getVariableIcon = (variable: Variable) => {
    switch (variable.measure) {
        case "scale":
            return <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "nominal":
            return <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "ordinal":
            return <BarChartHorizontal size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        case "unknown":
            return <FileQuestion size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
        default:
            return variable.type === "STRING"
                ? <Shapes size={14} className="text-muted-foreground mr-1 flex-shrink-0" />
                : <Ruler size={14} className="text-muted-foreground mr-1 flex-shrink-0" />;
    }
};
