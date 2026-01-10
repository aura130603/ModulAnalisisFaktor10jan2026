"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, FilePlus, Database } from 'lucide-react';
import { useMetaStore } from '@/stores/useMetaStore';
import { useModal, ModalType } from '@/hooks/useModal';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { DashboardLandingSkeleton } from '@/components/ui/Skeletons';
import type { ResourceItem, DataAction } from '@/app/dashboard/components/landing/DashboardLanding';
import { DashboardLanding } from '@/app/dashboard/components/landing/DashboardLanding';

export default function DashboardPage() {
    const router = useRouter();
    const { meta, isLoading: metaIsLoading, isLoaded: metaIsLoaded, setMeta } = useMetaStore();
    const { openModal } = useModal();
    const { resetData } = useDataStore();
    const { resetVariables } = useVariableStore();

    useEffect(() => {
        if (metaIsLoaded && meta.name) {
            router.push('/dashboard/data');
        }
    }, [metaIsLoaded, meta.name, router]);

    const handleOpenProject = () => {
        openModal(ModalType.OpenData);
    };

    const handleNewProject = async () => {
        await resetData();
        await resetVariables();
        await setMeta({ name: 'New Project', location: '', created: new Date() });
    };

    const dataActions: DataAction[] = [
        {
            id: 'new',
            icon: <FilePlus className="h-12 w-12 text-primary" />,
            title: 'New Project',
            description: 'Start a new data analysis project from scratch',
            action: handleNewProject,
            primary: true
        },
        {
            id: 'open',
            icon: <FolderOpen className="h-12 w-12 text-primary" />,
            title: 'Open Project',
            description: 'Open an SPSS data file (.sav)',
            action: handleOpenProject,
            primary: false
        },
        {
            id: 'example',
            icon: <Database className="h-12 w-12 text-primary" />,
            title: 'Example Datasets',
            description: 'Access various datasets for practice',
            action: () => openModal(ModalType.ExampleDataset),
            primary: false
        }
    ];

    if (metaIsLoading || !metaIsLoaded) {
        return <DashboardLandingSkeleton data-testid="dashboard-loading" />;
    }

    if (meta.name) {
        return <DashboardLandingSkeleton data-testid="dashboard-loading" />;
        // return null;
    }

    const resources: ResourceItem[] = [
        /*
        {
            icon: <BookOpen className="h-6 w-6 text-black" />,
            title: 'Tutorial Analisis',
            description: 'Panduan lengkap untuk berbagai metode statistik',
            link: '/resources/tutorials'
        }
        */
    ];

    return (
        <div data-testid="dashboard-page">
            <DashboardLanding dataActions={dataActions} resources={resources} />
        </div>
    );
}