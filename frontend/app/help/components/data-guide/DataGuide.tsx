import React from 'react';
import StandardizedGuideLayout from '../statistics-guide/shared/StandardizedGuideLayout';
import { Database, Settings, Filter, BarChart3 } from 'lucide-react';
import { DataManagementTab, DataTransformationTab, DataQualityTab, QuickStartGuide } from './tabs';
import {
  AggregateGuide,
  DefineDateTimeGuide,
  DefineVarPropsGuide,
  DuplicateCasesGuide,
  RestructureGuide,
  SelectCasesGuide,
  SetMeasurementLevelGuide,
  SortCasesGuide,
  SortVarsGuide,
  TransposeGuide,
  WeightCasesGuide,
  UnusualCasesGuide,
} from './index';

interface DataGuideProps {
  section?: string;
}

const DataGuide: React.FC<DataGuideProps> = ({ section }) => {
  // If section is provided, render the specific component for backward compatibility
  if (section) {

    switch (section) {
      case "aggregate":
        return <AggregateGuide />;
      case "define-datetime":
        return <DefineDateTimeGuide />;
      case "define-var-props":
        return <DefineVarPropsGuide />;
      case "duplicate-cases":
        return <DuplicateCasesGuide />;
      case "restructure":
        return <RestructureGuide />;
      case "select-cases":
        return <SelectCasesGuide />;
      case "set-measurement-level":
        return <SetMeasurementLevelGuide />;
      case "sort-cases":
        return <SortCasesGuide />;
      case "sort-vars":
        return <SortVarsGuide />;
      case "transpose":
        return <TransposeGuide />;
      case "weight-cases":
        return <WeightCasesGuide />;
      case "unusual-cases":
        return <UnusualCasesGuide />;
      default:
        return <AggregateGuide />;
    }
  }

  const tabs = [
    {
      id: 'quick-start',
      label: 'Panduan Cepat',
      icon: BarChart3,
      component: QuickStartGuide
    },
    {
      id: 'data-management',
      label: 'Kelola Data',
      icon: Database,
      component: DataManagementTab
    },
    {
      id: 'data-transformation',
      label: 'Transformasi Data',
      icon: Settings,
      component: DataTransformationTab
    },
    {
      id: 'data-quality',
      label: 'Kualitas Data',
      icon: Filter,
      component: DataQualityTab
    }
  ];

  return (
    <StandardizedGuideLayout
      title="Panduan Manajemen Data"
      description="Pelajari cara mengelola, mentransformasi, dan memastikan kualitas data Anda di Statify"
      tabs={tabs}
      defaultTab="quick-start"
    />
  );
};

export default DataGuide;