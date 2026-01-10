"use client";

import React from "react";
import type { SetMeasurementLevelProps } from "./types";
import { useSetMeasurementLevel } from "./hooks/useSetMeasurementLevel";
import { SetMeasurementLevelUI } from "./SetMeasurementLevelUI";

// Main component
// interface SetMeasurementLevelProps {
//     onClose: () => void;
//     containerType?: "dialog" | "sidebar";
// }

const SetMeasurementLevel: React.FC<SetMeasurementLevelProps> = ({ 
    onClose,
    containerType = "dialog" 
}) => {
    const hook = useSetMeasurementLevel({ onClose });

    return (
        <SetMeasurementLevelUI 
            {...hook}
            onClose={onClose}
            containerType={containerType}
        />
    );
};

export default SetMeasurementLevel;