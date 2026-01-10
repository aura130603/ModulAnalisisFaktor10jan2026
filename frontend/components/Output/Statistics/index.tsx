import type React from 'react';
import dynamic from 'next/dynamic';

// Import statistics components
import LinearityTest from './LinearityTest';
import NormalityTest from './NormalityTest';
import HomoscedasticityTest from './HomoscedasticityTest';
import AutocorrelationTest from './AutocorrelationTest';
import NonautocorrelationTest from './NonautocorrelationTest';
import MulticollinearityTest from './MulticollinearityTest';

// Define the StatisticsComponentsRegistry interface
interface StatisticsComponentsRegistry {
  [key: string]: React.ComponentType<any>;
}

// Create a registry of statistics components mapped by name
export const StatisticsComponents: StatisticsComponentsRegistry = {
  // Add LinearityTest component
  LinearityTest,
  
  // Add NormalityTest component
  NormalityTest,
  
  // Add HomoscedasticityTest component
  HomoscedasticityTest,
  
  // Add AutocorrelationTest component
  AutocorrelationTest,
  
  // Add NonautocorrelationTest component
  NonautocorrelationTest,
  
  // Add MulticollinearityTest component
  MulticollinearityTest,
  
  // Add more components as they are created
  // 'MulticollinearityTest': MulticollinearityTest,
};

// Function to get a component by name
export const getStatisticsComponent = (name: string): React.ComponentType<any> | null => {
  return StatisticsComponents[name] || null;
};

// Default export for convenience
export default StatisticsComponents; 