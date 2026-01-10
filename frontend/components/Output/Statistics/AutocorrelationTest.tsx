import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';

interface AutocorrelationTestProps {
  data: string;
}

interface TestResult {
  durbinWatsonStatistic: number;
  interpretation: string;
  nObservations: number;
  lowerBound: number;
  upperBound: number;
}

const AutocorrelationTest: React.FC<AutocorrelationTestProps> = ({ data }) => {
  try {
    // Parse the data, which could be a string representation of the results object
    // or a string representation of an object with a results property
    const parsedData = JSON.parse(data);
    
    // Try to extract the actual test result data
    const result: TestResult = parsedData.results || parsedData;
    
    if (!result || typeof result !== 'object' || !('durbinWatsonStatistic' in result)) {
      console.error('Invalid autocorrelation test data:', result);
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Invalid autocorrelation test data. Please try running the test again.
          </AlertDescription>
        </Alert>
      );
    }

    // Determine the alert variant based on interpretation
    let alertVariant: 'default' | 'destructive' | null;
    let icon;
    
    if (result.interpretation.includes('No autocorrelation')) {
      alertVariant = 'default';
      icon = <CheckCircleIcon className="h-4 w-4" />;
    } else {
      alertVariant = 'destructive';
      icon = <XCircleIcon className="h-4 w-4" />;
    }

    return (
      <div className="space-y-4">
        <Alert variant={alertVariant}>
          <div className="flex items-center">
            {icon}
            <AlertTitle className="ml-2">
              {result.interpretation}
            </AlertTitle>
          </div>
          <AlertDescription>
            Durbin-Watson statistic: {result.durbinWatsonStatistic.toFixed(3)}
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Durbin-Watson Statistic</p>
                <p className="text-2xl font-bold">{result.durbinWatsonStatistic.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Sample Size</p>
                <p className="text-2xl font-bold">{result.nObservations}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Interpretation Guide</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>DW ≈ 2: No autocorrelation ({result.lowerBound} to {result.upperBound})</li>
                <li>DW &lt; {result.lowerBound}: Positive autocorrelation</li>
                <li>DW &gt; {result.upperBound}: Negative autocorrelation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-xs text-muted-foreground mt-2">
          <div className="flex items-center">
            <InfoIcon className="h-3 w-3 mr-1" />
            <span>
              The Durbin-Watson test checks for autocorrelation in regression residuals.
              Values near 2 suggest no autocorrelation.
            </span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering autocorrelation test:', error);
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to parse autocorrelation test results.
          {error instanceof Error ? ` ${error.message}` : ''}
        </AlertDescription>
      </Alert>
    );
  }
};

export default AutocorrelationTest; 