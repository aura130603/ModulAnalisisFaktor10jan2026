"use client"

import React from "react";
import { ModalType } from "@/hooks/useModal";
import Smoothing from "@/components/Modals/Analyze/TimeSeries/Smoothing";
import Decomposition from "@/components/Modals/Analyze/TimeSeries/Decomposition";
import Autocorrelation from "@/components/Modals/Analyze/TimeSeries/Autocorrelation";
import UnitRootTest from "@/components/Modals/Analyze/TimeSeries/UnitRootTest";
import BoxJenkinsModel from "@/components/Modals/Analyze/TimeSeries/BoxJenkinsModel";

interface TimeSeriesModalProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const TimeSeriesModal: React.FC<TimeSeriesModalProps> = ({ modalType, onClose, props }) => {
    switch (modalType) {
        case ModalType.Smoothing:
            return <Smoothing onClose={onClose} {...props} />;
        case ModalType.Decomposition:
            return <Decomposition onClose={onClose} {...props} />;
        case ModalType.Autocorrelation:
            return <Autocorrelation onClose={onClose} {...props} />;
        case ModalType.UnitRootTest:
            return <UnitRootTest onClose={onClose} {...props} />;
        case ModalType.BoxJenkinsModel:
            return <BoxJenkinsModel onClose={onClose} {...props} />;
        default:
            return null;
    }
};

/**
 * Helper function to check if a modal type belongs to the Time Series category
 * 
 * @param type - The modal type to check
 * @returns Whether the modal is a Time Series modal
 */
export const isTimeSeriesModal = (type: ModalType): boolean => {
    return [
        ModalType.Smoothing,
        ModalType.Decomposition,
        ModalType.Autocorrelation,
        ModalType.UnitRootTest,
        ModalType.BoxJenkinsModel
    ].includes(type);
};