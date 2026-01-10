import React from 'react';
import { Calculator, BarChart3, Table, BookOpen } from 'lucide-react';
import StandardizedGuideLayout from '../shared/StandardizedGuideLayout';
import { OverviewTab } from './tabs/OverviewTab';
import { VariablesTab } from './tabs/VariablesTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { ChartsTab } from './tabs/ChartsTab';
import { QuickStartGuide } from './tabs/QuickStartGuide';

export const Frequencies: React.FC = () => {
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
      icon: Table,
      component: VariablesTab
    },
    {
      id: 'statistics',
      label: 'Statistik',
      icon: Calculator,
      component: StatisticsTab
    },
    {
      id: 'charts',
      label: 'Grafik',
      icon: BarChart3,
      component: ChartsTab
    }
  ];

  return (
    <StandardizedGuideLayout
      title="Panduan Analisis Frekuensi"
      description="Pelajari cara membuat dan menginterpretasi tabel frekuensi untuk data Anda"
      tabs={tabs}
      defaultTab="overview"
    >
      <QuickStartGuide />
    </StandardizedGuideLayout>
  );
};

