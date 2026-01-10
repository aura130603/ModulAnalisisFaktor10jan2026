"use client";
import React, { FC } from "react";
import {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
} from "@/components/ui/menubar";
import { ModalType } from "@/types/modalTypes";
import { useModal } from "@/hooks/useModal";

const NonparametricTestsMenu: FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarMenu>
            <MenubarTrigger>Nonparametric Test</MenubarTrigger>
            <MenubarContent>
                <MenubarItem disabled>
                    One Sample... 
                </MenubarItem>
                <MenubarItem disabled>
                    Independent Samples...
                </MenubarItem>
                <MenubarItem disabled>
                    Related Samples...
                </MenubarItem>
                <MenubarSub>
                      <MenubarSubTrigger>Legacy Dialogs</MenubarSubTrigger>
                      <MenubarSubContent>
                        <MenubarItem onClick={() => openModal(ModalType.ChiSquare)}>
                            Chi-square...
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.Runs)}>
                            Runs...
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.TwoIndependentSamples)}>
                            2 Independent Samples...
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.KIndependentSamples)}>
                            K Independent Samples...
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.TwoRelatedSamples)}>
                            2 Related Samples...
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.KRelatedSamples)}>
                            K Related Samples...
                        </MenubarItem>
                      </MenubarSubContent>
                    </MenubarSub>
            </MenubarContent>
        </MenubarMenu>
    );
};

export default NonparametricTestsMenu;