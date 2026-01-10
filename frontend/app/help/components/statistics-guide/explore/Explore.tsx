import React from 'react';
import { Calculator, BarChart3, Table } from 'lucide-react';
import StandardizedGuideLayout from '../shared/StandardizedGuideLayout';
import { VariablesTab } from './tabs/VariablesTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { PlotsTab } from './tabs/PlotsTab';
import { QuickStartGuide } from './tabs/QuickStartGuide';

const Explore = () => {
  const tabs = [
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
      id: 'plots',
      label: 'Grafik',
      icon: BarChart3,
      component: PlotsTab
    }
  ];

  return (
    <StandardizedGuideLayout
      title="Panduan Eksplorasi Data"
      description="Analisis statistik komprehensif dengan metode robust dan deteksi outlier"
      tabs={tabs}
      defaultTab="variables"
    >
      <QuickStartGuide />
    </StandardizedGuideLayout>
  );
};

export default Explore;
