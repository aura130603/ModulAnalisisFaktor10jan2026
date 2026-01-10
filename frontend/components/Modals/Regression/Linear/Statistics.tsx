// components/Statistics.tsx
import React, { useState, useEffect } from 'react';
// import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button'; // Remove Button if no longer used internally
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { TrendingUp } from 'lucide-react';

// Keep the Params interface export
export interface StatisticsParams {
  estimates: boolean;
  confidenceIntervals: boolean;
  confidenceLevel: string; // Added for editable confidence level
  covarianceMatrix: boolean;
  modelFit: boolean;
  rSquaredChange: boolean;
  descriptives: boolean;
  partAndPartial: boolean;
  collinearityDiagnostics: boolean;
  durbinWatson: boolean;
  casewiseDiagnostics: boolean;
  selectedResidualOption: string;
  outlierThreshold: string;
}

// Update Props interface
interface StatisticsProps {
  params: StatisticsParams;
  onChange: (newParams: Partial<StatisticsParams>) => void;
  showAlert: (title: string, description: string) => void;
}


const Statistics: React.FC<StatisticsProps> = ({ params, onChange, showAlert }) => {
  // Use passed params to initialize state
  const [estimates, setEstimates] = useState<boolean>(params.estimates);
  const [confidenceIntervals, setConfidenceIntervals] = useState<boolean>(params.confidenceIntervals);
  const [confidenceLevel, setConfidenceLevel] = useState<string>(params.confidenceLevel);
  const [covarianceMatrix, setCovarianceMatrix] = useState<boolean>(params.covarianceMatrix);
  const [modelFit, setModelFit] = useState<boolean>(params.modelFit);
  const [rSquaredChange, setRSquaredChange] = useState<boolean>(params.rSquaredChange);
  const [descriptives, setDescriptives] = useState<boolean>(params.descriptives);
  const [partAndPartial, setPartAndPartial] = useState<boolean>(params.partAndPartial);
  const [collinearityDiagnostics, setCollinearityDiagnostics] = useState<boolean>(params.collinearityDiagnostics);
  const [durbinWatson, setDurbinWatson] = useState<boolean>(params.durbinWatson);
  const [casewiseDiagnostics, setCasewiseDiagnostics] = useState<boolean>(params.casewiseDiagnostics);
  const [selectedResidualOption, setSelectedResidualOption] = useState<string>(params.selectedResidualOption);
  const [outlierThreshold, setOutlierThreshold] = useState<string>(params.outlierThreshold);

  // Effect to update local state if params prop changes from parent (e.g., on Reset)
  useEffect(() => {
    setEstimates(params.estimates);
    setConfidenceIntervals(params.confidenceIntervals);
    setConfidenceLevel(params.confidenceLevel);
    setCovarianceMatrix(params.covarianceMatrix);
    setModelFit(params.modelFit);
    setRSquaredChange(params.rSquaredChange);
    setDescriptives(params.descriptives);
    setPartAndPartial(params.partAndPartial);
    setCollinearityDiagnostics(params.collinearityDiagnostics);
    setDurbinWatson(params.durbinWatson);
    setCasewiseDiagnostics(params.casewiseDiagnostics);
    setSelectedResidualOption(params.selectedResidualOption);
    setOutlierThreshold(params.outlierThreshold);
  }, [params]);

  // Helper to call onChange prop
  const handleChange = (field: keyof StatisticsParams, value: any) => {
    // Update local state immediately for responsiveness
    switch(field) {
      case 'estimates': setEstimates(value); break;
      case 'confidenceIntervals': setConfidenceIntervals(value); break;
      case 'confidenceLevel': setConfidenceLevel(value); break; // Added
      case 'covarianceMatrix': setCovarianceMatrix(value); break;
      case 'modelFit': setModelFit(value); break;
      case 'rSquaredChange': setRSquaredChange(value); break;
      case 'descriptives': setDescriptives(value); break;
      case 'partAndPartial': setPartAndPartial(value); break;
      case 'collinearityDiagnostics': setCollinearityDiagnostics(value); break;
      case 'durbinWatson': setDurbinWatson(value); break;
      case 'casewiseDiagnostics':
        setCasewiseDiagnostics(value);
        if (value) {
            // Default to 'outliers' when Casewise Diagnostics is checked
            setSelectedResidualOption('outliers');
            onChange({ casewiseDiagnostics: value, selectedResidualOption: 'outliers' });
            return; // Exit early as onChange was called with both changes
        } else {
            // Clear radio button selection if Casewise Diagnostics is unchecked
            setSelectedResidualOption('');
            onChange({ casewiseDiagnostics: value, selectedResidualOption: '' });
            return; // Exit early
        }
        // No break needed due to return statements
      case 'selectedResidualOption': setSelectedResidualOption(value); break;
      case 'outlierThreshold': setOutlierThreshold(value); break;
    }
    // Propagate change to parent if not handled by specific cases above
    onChange({ [field]: value });
  };

  const handleConfidenceLevelBlur = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 1 || numValue >= 100) {
        showAlert('Invalid Input', 'Confidence level must be a number between 1 and 99.999.');
        // Revert to original valid value from props
        setConfidenceLevel(params.confidenceLevel);
    } else {
        // Propagate the valid change to the parent
        onChange({ confidenceLevel: value });
    }
  };

  const handleOutlierThresholdBlur = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      showAlert('Invalid Input', 'Outlier threshold must be a number greater than 0.');
      // Revert to original valid value
      setOutlierThreshold(params.outlierThreshold);
    } else {
      onChange({ outlierThreshold: value });
    }
  };

  // Return the JSX content directly, without Dialog wrappers
  return (
    <div className="p-4"> {/* Add padding or styling as needed */}
      {/* Removed Header */}
      {/* <Separator className="my-2" /> */}

      {/* Bagian Regression Coefficients & Model Fit */}
      <div className="grid grid-cols-2 gap-6">
        {/* Regression Coefficients */}
        <div>
          <h3 className="font-semibold text-md mb-2">Regression Coefficients</h3>
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              checked={estimates}
              onCheckedChange={(checked) => handleChange('estimates', !!checked)}
              id="estimates"
            />
            <label htmlFor="estimates" className="text-sm">Estimates</label>
          </div>
          <div className="flex flex-col ml-6 mb-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={confidenceIntervals}
                onCheckedChange={(checked) => handleChange('confidenceIntervals', !!checked)}
                id="confidenceIntervals"
              />
              <label htmlFor="confidenceIntervals" className="text-sm">Confidence intervals</label>
            </div>
            <div className="ml-6 mt-1">
              <label htmlFor="level" className="text-xs">Level(%):</label>
              <Input
                id="level"
                type="number"
                value={confidenceLevel}
                onChange={(e) => handleChange('confidenceLevel', e.target.value)}
                onBlur={(e) => handleConfidenceLevelBlur(e.target.value)}
                disabled={!confidenceIntervals}
                className="w-20 ml-2 p-1 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-6">
            <Checkbox
              checked={covarianceMatrix}
              onCheckedChange={(checked) => handleChange('covarianceMatrix', !!checked)}
              id="covarianceMatrix"
            />
            <label htmlFor="covarianceMatrix" className="text-sm">Covariance matrix</label>
          </div>
        </div>

        {/* Model Fit */}
        <div>
          <h3 className="font-semibold text-md mb-2">Model fit</h3>
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              checked={modelFit}
              onCheckedChange={(checked) => handleChange('modelFit', !!checked)}
              id="modelFit"
            />
            <label htmlFor="modelFit" className="text-sm">Model fit</label>
          </div>
          <div className="flex flex-col ml-6 space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={rSquaredChange}
                onCheckedChange={(checked) => handleChange('rSquaredChange', !!checked)}
                id="rSquaredChange"
              />
              <label htmlFor="rSquaredChange" className="text-sm">R squared change</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={descriptives}
                onCheckedChange={(checked) => handleChange('descriptives', !!checked)}
                id="descriptives"
              />
              <label htmlFor="descriptives" className="text-sm">Descriptives</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={partAndPartial}
                onCheckedChange={(checked) => handleChange('partAndPartial', !!checked)}
                id="partAndPartial"
              />
              <label htmlFor="partAndPartial" className="text-sm">Part and partial correlations</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={collinearityDiagnostics}
                onCheckedChange={(checked) => handleChange('collinearityDiagnostics', !!checked)}
                id="collinearityDiagnostics"
              />
              <label htmlFor="collinearityDiagnostics" className="text-sm">Collinearity diagnostics</label>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Bagian Residuals */}
      <div className="border rounded-md p-4">
        <h3 className="font-semibold text-md mb-2">Residuals</h3>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={durbinWatson}
              onCheckedChange={(checked) => handleChange('durbinWatson', !!checked)}
              id="durbinWatson"
            />
            <label htmlFor="durbinWatson" className="text-sm">Durbin-Watson</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={casewiseDiagnostics}
              onCheckedChange={(checked) => handleChange('casewiseDiagnostics', !!checked)}
              id="casewiseDiagnostics"
            />
            <label htmlFor="casewiseDiagnostics" className="text-sm">Casewise diagnostics</label>
          </div>
          <div className="flex flex-col ml-6 space-y-1">
            {/* Radio button: Outliers outside: [input] standard deviations */}
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="residualOption"
                id="outliers"
                value="outliers"
                disabled={!casewiseDiagnostics}
                checked={selectedResidualOption === 'outliers'}
                onChange={() => handleChange('selectedResidualOption', 'outliers')}
                className="accent-gray-500"
              />
              <label htmlFor="outliers" className="text-sm">Outliers outside:</label>
              <Input
                type="number"
                value={outlierThreshold} // Controlled component
                onChange={(e) => handleChange('outlierThreshold', e.target.value)}
                onBlur={(e) => handleOutlierThresholdBlur(e.target.value)}
                disabled={!casewiseDiagnostics || selectedResidualOption !== 'outliers'}
                className="w-16 p-1 text-sm"
              />
              <span className="text-sm">standard deviations</span>
            </div>
            {/* Radio button: All cases */}
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="residualOption"
                id="allCases"
                value="allCases"
                disabled={!casewiseDiagnostics}
                checked={selectedResidualOption === 'allCases'}
                onChange={() => handleChange('selectedResidualOption', 'allCases')}
                className="accent-gray-500"
              />
              <label htmlFor="allCases" className="text-sm">All cases</label>
            </div>
          </div>
        </div>
      </div>

      {/* Removed Footer and Buttons */}
    </div>
  );
};

export default Statistics;
