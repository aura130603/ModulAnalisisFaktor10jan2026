import React from 'react';
import { BookOpen, Database, Calculator } from 'lucide-react';
import StandardizedGuideLayout from '../shared/StandardizedGuideLayout';
import { OverviewTab } from './tabs/OverviewTab';
import { VariablesTab } from './tabs/VariablesTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { QuickStartGuide } from './tabs/QuickStartGuide';

export const DescriptiveAnalysis = () => {
  const tabs = [
    {
      id: 'overview',
      label: 'Ringkasan',
      icon: BookOpen,
      component: OverviewTab
    },
    {
      id: 'variables',
      label: 'Variabel',
      icon: Database,
      component: VariablesTab
    },
    {
      id: 'statistics',
      label: 'Statistik',
      icon: Calculator,
      component: StatisticsTab
    }
  ];

  return (
    <StandardizedGuideLayout
      title="Panduan Analisis Deskriptif"
      description="Pelajari cara melakukan analisis statistik deskriptif untuk memahami karakteristik data Anda"
      tabs={tabs}
      defaultTab="overview"
    >
      <QuickStartGuide />
    </StandardizedGuideLayout>
  );
};

export default DescriptiveAnalysis;
