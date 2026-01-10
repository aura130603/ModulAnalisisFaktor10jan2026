"use client";

import React from "react";
import {
    MenubarItem,
    MenubarSeparator,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
} from "@/components/ui/menubar";
import {ModalType, useModal} from "@/hooks/useModal";

const ClassifyMenu: React.FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarSub>
            <MenubarSubTrigger>Classify</MenubarSubTrigger>
            <MenubarSubContent>
                <MenubarItem
                    disabled={true}
                    onClick={() => openModal(ModalType.ModalTwoStepCluster)}
                >
                    TwoStep Cluster
                </MenubarItem>
                <MenubarItem
                    onClick={() => openModal(ModalType.ModalKMeansCluster)}
                >
                    K-Means Cluster
                </MenubarItem>
                <MenubarItem
                    disabled={true}
                    onClick={() =>
                        openModal(ModalType.ModalHierarchicalCluster)
                    }
                >
                    Hierarchical Cluster
                </MenubarItem>
                <MenubarItem
                    disabled={true}
                    onClick={() => openModal(ModalType.ModalClusterSilhouettes)}
                >
                    Cluster Silhouettes
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                    disabled={true}
                    onClick={() => openModal(ModalType.ModalTree)}
                >
                    Tree
                </MenubarItem>
                <MenubarItem
                    disabled={true}
                    onClick={() => openModal(ModalType.ModalDiscriminant)}
                >
                    Discriminant
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                    disabled={true}
                    onClick={() => openModal(ModalType.ModalNearestNeighbor)}
                >
                    Nearest Neighbor
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                    disabled={true}
                    onClick={() => openModal(ModalType.ModalROCCurve)}
                >
                    ROC Curve
                </MenubarItem>
                <MenubarItem
                    disabled={true}
                    onClick={() => openModal(ModalType.ModalROCAnalysis)}
                >
                    ROC Analysis
                </MenubarItem>
            </MenubarSubContent>
        </MenubarSub>
    );
};

export default ClassifyMenu;
