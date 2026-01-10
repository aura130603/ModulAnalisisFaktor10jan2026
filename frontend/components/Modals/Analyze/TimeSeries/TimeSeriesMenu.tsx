"use client";

import React from "react";
import {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "@/components/ui/menubar";
import { ModalType, useModal } from "@/hooks/useModal";

const TimeSeriesMenu: React.FC = () => {
    const { openModal } = useModal();
    return (
        <MenubarMenu>
            <MenubarTrigger>Time Series</MenubarTrigger>
            <MenubarContent>
                <MenubarItem onClick={() => openModal(ModalType.Smoothing)}>
                    Smoothing...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.Decomposition)}>
                    Decomposition...
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => openModal(ModalType.Autocorrelation)}>
                    Autocorrelation...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.UnitRootTest)}>
                    Unit Root Test...
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => openModal(ModalType.BoxJenkinsModel)}>
                    Box-Jenkins Model...
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
};

export default TimeSeriesMenu;