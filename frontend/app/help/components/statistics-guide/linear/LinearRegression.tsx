import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { HelpCircle, Table, Calculator, BarChart3, ClipboardList, SlidersHorizontal } from 'lucide-react';

/*
 * Help Guide: Linear Regression
 * ----------------------------------------------------------------------------
 * This component provides an end-user guide for the Linear Regression modal
 * (see `components/Modals/Regression/Linear/ModalLinear.tsx`).
 *
 * The layout intentionally mirrors the Frequencies help guide to keep the
 * UX consistent across statistical procedures.
 */

// ----------- Tab content components ----------------------------------------

const OverviewTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="What is Linear Regression?">
      <p className="text-sm mt-2">
        Linear regression fits a line (or hyper-plane) that best describes the
        relationship between a dependent variable and one or more independent
        variables.  It is useful for prediction, assessing relationships, and
        understanding effect sizes.
      </p>
    </HelpAlert>

    <HelpCard title="When to Use Linear Regression" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2 list-disc list-inside">
        <li>Predicting a quantitative outcome from one or more predictors</li>
        <li>Assessing how strongly variables are related</li>
        <li>Testing hypotheses about coefficients (t-tests)</li>
        <li>Exploring model fit (R², ANOVA, residual analysis)</li>
      </ul>
    </HelpCard>

    <HelpCard title="What You'll Learn" icon={ClipboardList} variant="feature">
      <ul className="text-sm space-y-2 mt-2 list-disc list-inside">
        <li>Selecting variables for the analysis</li>
        <li>Available statistics &amp; diagnostics</li>
        <li>Plot and save options</li>
        <li>Interpreting key output tables</li>
      </ul>
    </HelpCard>
  </div>
);

const VariablesTab = () => (
  <div className="space-y-6">
    <HelpCard title="Selecting Variables" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Choose Dependent Variable"
          description="Select one quantitative variable to predict."
        />
        <HelpStep
          number={2}
          title="Select Independent Variable(s)"
          description="Move one or more predictor variables into the Independent box."
        />
        <HelpStep
          number={3}
          title="Re-order Predictors (Optional)"
          description="Use the up/down arrows to change predictor order."
        />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Variable Types">
      <p className="text-sm mt-2">
        Linear regression requires a scale (numeric) dependent variable.  Nominal
        predictors should be converted to dummy variables first.
      </p>
    </HelpAlert>
  </div>
);

const StatisticsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Available Statistics" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep number={1} title="Estimates" description="Coefficients, standard errors and t-tests." />
        <HelpStep number={2} title="Model Fit" description="R², adjusted R², ANOVA table, Durbin-Watson." />
        <HelpStep number={3} title="Descriptives" description="Means and standard deviations of variables." />
        <HelpStep number={4} title="Collinearity" description="Tolerance, VIF and diagnostics." />
        <HelpStep number={5} title="Residual Diagnostics" description="Casewise diagnostics and residual statistics." />
      </div>
    </HelpCard>

    <HelpAlert variant="info" title="Statistics Options">
      <p className="text-sm mt-2">
        Tick only the tables you need.  Extra diagnostics can slow large
        datasets.
      </p>
    </HelpAlert>
  </div>
);

const PlotsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Plot Options" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep number={1} title="Scatter Plot" description="Plot any X vs Y combination (including residuals)." />
        <HelpStep number={2} title="Histogram" description="Show distribution of a selected variable." />
        <HelpStep number={3} title="Customization" description="Choose axis labels, colors and titles." />
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Best Practices">
      <p className="text-sm mt-2">
        Check residual scatter plots for non-linearity or heteroscedasticity.
      </p>
    </HelpAlert>
  </div>
);

const OptionsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Method &amp; Options" icon={SlidersHorizontal} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep number={1} title="Stepping Method" description="Choose probability or F-value criteria for stepwise models." />
        <HelpStep number={2} title="Include Constant" description="Remove intercept to force the regression through the origin." />
        <HelpStep number={3} title="Missing Values" description="Replace missing values with means or apply listwise deletion." />
      </div>
    </HelpCard>
  </div>
);

const QuickStartGuide = () => (
  <div className="mt-8 grid gap-4">
    <HelpCard title="Quick Start" icon={ClipboardList} variant="feature">
      <div className="space-y-3">
        <p className="text-sm">Ready to run a linear regression?</p>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Select dependent and independent variables</li>
          <li>Pick desired statistics &amp; diagnostics</li>
          <li>Choose any plots or save options</li>
          <li>Click <b>OK</b> to calculate the model</li>
        </ol>
      </div>
    </HelpCard>
  </div>
);

// ----------- Main component -------------------------------------------------

export const LinearRegression: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabConfig = [
    { value: 'overview', label: 'Overview', icon: HelpCircle },
    { value: 'variables', label: 'Variables', icon: Table },
    { value: 'statistics', label: 'Statistics', icon: Calculator },
    { value: 'plots', label: 'Plots', icon: BarChart3 },
    { value: 'options', label: 'Options', icon: SlidersHorizontal }
  ];

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Linear Regression Guide</h1>
        <p className="text-muted-foreground">
          Learn how to set up and interpret a linear regression analysis in Statify.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {tabConfig.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
        <TabsContent value="variables" className="mt-6"><VariablesTab /></TabsContent>
        <TabsContent value="statistics" className="mt-6"><StatisticsTab /></TabsContent>
        <TabsContent value="plots" className="mt-6"><PlotsTab /></TabsContent>
        <TabsContent value="options" className="mt-6"><OptionsTab /></TabsContent>
      </Tabs>

      <QuickStartGuide />
    </div>
  );
};
