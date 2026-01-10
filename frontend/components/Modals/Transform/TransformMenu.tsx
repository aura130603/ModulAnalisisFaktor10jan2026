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

const TransformMenu: React.FC = () => {
  const { openModal } = useModal();

  return (
    <MenubarMenu>
      <MenubarTrigger>Transform</MenubarTrigger>
      <MenubarContent>
        <MenubarItem onClick={() => openModal(ModalType.ComputeVariable)}>
          Compute Variable
        </MenubarItem>
        <MenubarItem disabled>Programmability Transformation</MenubarItem>
        <MenubarItem disabled>Count Values within Cases</MenubarItem>
        <MenubarItem disabled>Shift Values</MenubarItem>
        <MenubarSeparator />
        <MenubarItem onClick={() => openModal(ModalType.RecodeSameVariables)}>
          Recode into Same Variables
        </MenubarItem>
        <MenubarItem
          onClick={() => openModal(ModalType.RecodeDifferentVariables)}
        >
          Recode into Different Variables
        </MenubarItem>
        <MenubarItem disabled>Automatic Recode</MenubarItem>
        <MenubarItem disabled>Create Dummy Variables</MenubarItem>
        <MenubarItem disabled>Visual Binning</MenubarItem>
        <MenubarItem disabled>Optimal Binning</MenubarItem>
        <MenubarItem disabled>Prepare Data for Modeling</MenubarItem>
        <MenubarSeparator />
        <MenubarItem onClick={() => openModal(ModalType.RankCases)}>
          Rank Cases
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem disabled>Date and Time Wizard</MenubarItem>
        <MenubarItem disabled>Create Time Series</MenubarItem>
        <MenubarItem disabled>Replace Missing Values</MenubarItem>
        <MenubarItem disabled>Random Number Generators</MenubarItem>
        <MenubarSeparator />
        <MenubarItem disabled>Run Pending Transforms</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  );
};

export default TransformMenu;
