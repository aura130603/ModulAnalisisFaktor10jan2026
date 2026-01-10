"use client";
import React, { FC } from "react";
import {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
} from "@/components/ui/menubar";
import { ModalType } from "@/types/modalTypes";
import { useModal } from "@/hooks/useModal";

const CompareMeansMenu: FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarMenu>
            <MenubarTrigger>
                Compare Means
            </MenubarTrigger>
            <MenubarContent>
                <MenubarItem onClick={() => openModal(ModalType.OneSampleTTest)}>
                    One-Sample T Test...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.IndependentSamplesTTest)}>
                    Independent-Samples T Test...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.PairedSamplesTTest)}>
                    Paired-Samples T Test...
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.OneWayANOVA)}>
                    One-Way ANOVA...
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
};

export default CompareMeansMenu;