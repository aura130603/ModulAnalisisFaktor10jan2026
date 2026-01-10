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

const CorrelateMenu: FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarMenu>
            <MenubarTrigger>
                Correlate
            </MenubarTrigger>
            <MenubarContent>
                <MenubarItem onClick={() => openModal(ModalType.Bivariate)}>
                    Bivariate...
                </MenubarItem>
                {/* <MenubarItem onClick={() => openModal(ModalType.Bivariate)}>
                    Bivariate...
                </MenubarItem> */}
            </MenubarContent>
        </MenubarMenu>
    );
};

export default CorrelateMenu;