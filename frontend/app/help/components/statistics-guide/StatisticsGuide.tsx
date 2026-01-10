import React from "react";
import {
  BookOpen,
  TrendingUp,
  Zap,
  Target,
} from "lucide-react";
import StandardizedGuideLayout from "./shared/StandardizedGuideLayout";
import { BasicGuideTab, AdvancedTab, TipsTab, QuickStartGuide } from "./tabs";
import { Frequencies } from "./frequencies";
import { DescriptiveAnalysis } from "./descriptive/DescriptiveAnalysis";
import { Explore } from "./explore";
import { Crosstabs } from "./crosstabs";
import { LinearRegression } from "./linear";
import { UnivariateGuide } from "./univariate/UnivariateGuide";
import { KMeansClustering } from "./k-means/KMeansClustering";
import {
  SumOfSquares,
  EMMeans,
  ParameterEstimates,
  LevenesTest,
  DesignMatrix,
  ContrastFactors,
  HeteroscedasticityTests,
  LackOfFitTests,
} from "./univariate";



import {
  Autocorrelation,
  BoxJenkinsModel,
  Decomposition,
  Smoothing,
  UnitRootTest,
} from "./time-series";

interface StatisticsGuideProps {
  section?: string;
}

export const StatisticsGuide: React.FC<StatisticsGuideProps> = ({ section }) => {
  // If section is provided, render the specific component
  if (section) {
    switch (section) {
      case "frequencies":
        return <Frequencies />;
      case "descriptives":
        return <DescriptiveAnalysis />;
      case "explore":
        return <Explore />;
      case "crosstabs":
        return <Crosstabs />;
      case 'autocorrelation':
        return <Autocorrelation />;
      case 'box-jenkins-model':
        return <BoxJenkinsModel />;
      case 'decomposition':
        return <Decomposition />;
      case 'smoothing':
        return <Smoothing />;
      case 'unit-root-test':
        return <UnitRootTest />;
      case "linear":
        return <LinearRegression />;
      case "k-means":
        return <KMeansClustering />;
      case "univariate":
        return <UnivariateGuide />;
      case "univariate-sum-of-squares":
        return <SumOfSquares />;
      case "univariate-emmeans":
        return <EMMeans />;
      case "univariate-parameter-estimates":
        return <ParameterEstimates />;
      case "univariate-levenes-test":
        return <LevenesTest />;
      case "univariate-design-matrix":
        return <DesignMatrix />;
      case "univariate-contrast-factors":
        return <ContrastFactors />;
      case "univariate-heteroscedasticity-tests":
        return <HeteroscedasticityTests />;
      case "univariate-lack-of-fit-tests":
        return <LackOfFitTests />;
      default:
        break;
    }
  }

  const tabs = [
    {
      id: 'quick-start',
      label: 'Quick Start',
      icon: Zap,
      component: QuickStartGuide
    },
    {
      id: 'basic',
      label: 'Panduan Dasar',
      icon: BookOpen,
      component: BasicGuideTab
    },
    {
      id: 'advanced',
      label: 'Analisis Lanjutan',
      icon: TrendingUp,
      component: AdvancedTab
    },
    {
      id: 'tips',
      label: 'Tips & Trik',
      icon: Target,
      component: TipsTab
    }
  ];

  return (
    <StandardizedGuideLayout
      title="Panduan Analisis Statistik"
      description="Pelajari berbagai jenis analisis statistik yang tersedia dalam Statify"
      tabs={tabs}
      defaultTab="quick-start"
    />
  );
};
