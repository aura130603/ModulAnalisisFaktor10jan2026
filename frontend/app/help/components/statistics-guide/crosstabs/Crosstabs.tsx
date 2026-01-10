import React from 'react';
import { BookOpen, Database, Table, Calculator } from 'lucide-react';
import StandardizedGuideLayout from '../shared/StandardizedGuideLayout';
import { OverviewTab } from './tabs/OverviewTab';
import { VariablesTab } from './tabs/VariablesTab';
import { CellsTab } from './tabs/CellsTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { QuickStartGuide } from './tabs/QuickStartGuide';

export const Crosstabs: React.FC = () => {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BookOpen,
      component: OverviewTab
    },
    {
      id: 'variables',
      label: 'Variables',
      icon: Database,
      component: VariablesTab
    },
    {
      id: 'cells',
      label: 'Cells',
      icon: Table,
      component: CellsTab
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: Calculator,
      component: StatisticsTab
    }
  ];

  return (
    <StandardizedGuideLayout
      title="Panduan Analisis Crosstabs"
      description="Pelajari cara menganalisis hubungan antara variabel kategorikal menggunakan tabulasi silang"
      tabs={tabs}
      defaultTab="overview"
    >
      <QuickStartGuide />
    </StandardizedGuideLayout>
  );
};

