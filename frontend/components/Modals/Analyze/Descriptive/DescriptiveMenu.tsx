// components/Modals/Descriptive/DescriptiveMenu.tsx
"use client";

import React from "react";
import {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "@/components/ui/menubar";
import { ModalType } from "@/types/modalTypes";
import { useModal } from "@/hooks/useModal";

const DescriptiveMenu: React.FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarMenu>
            <MenubarTrigger data-testid="descriptive-menu-trigger">Descriptive</MenubarTrigger>
            <MenubarContent data-testid="descriptive-menu-content">
                <MenubarItem 
                    data-testid="descriptive-menu-descriptives"
                    onClick={() => openModal(ModalType.Descriptives)}
                >
                    Descriptives...
                </MenubarItem>
                <MenubarItem 
                    data-testid="descriptive-menu-explore"
                    onClick={() => openModal(ModalType.Explore)}
                >
                    Explore...
                </MenubarItem>
                <MenubarItem 
                    data-testid="descriptive-menu-frequencies"
                    onClick={() => openModal(ModalType.Frequencies)}
                >
                    Frequencies...
                </MenubarItem>
                <MenubarSeparator />
                {/* <MenubarItem onClick={() => openModal(ModalType.Crosstabs)}>
                    Crosstabs...
                </MenubarItem> */}
            </MenubarContent>
        </MenubarMenu>
    );
};

export default DescriptiveMenu;