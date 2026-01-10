import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, X, AlertCircle } from 'lucide-react';

interface HomoscedasticityTestResult {
  testName: string;
  statistic: number;
  pValue: number;
  isHomoscedastic: boolean;
  criticalValue: number;
  df?: number;
  df1?: number;
  df2?: number;
  error?: string;
}

interface HomoscedasticityTestProps {
  data: string;
}

const HomoscedasticityTest: React.FC<HomoscedasticityTestProps> = ({ data }) => {
  try {
    // Parse the JSON data
    const parsedData = JSON.parse(data);
    const { title, description, isHomoscedastic, tests, residualStats, visualizations: _visualizations } = parsedData;

    if (!tests) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Data</AlertTitle>
          <AlertDescription>Homoscedasticity test results data is invalid or missing.</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>

        <Alert variant={isHomoscedastic ? 'default' : 'destructive'}>
          <AlertTitle>
            {isHomoscedastic ? 'Residuals have constant variance' : 'Residuals may not have constant variance'}
          </AlertTitle>
          <AlertDescription>
            {isHomoscedastic 
              ? 'The test indicates that the residuals have constant variance across all levels of predicted values, which is a key assumption for linear regression.' 
              : 'The test suggests the residuals may not have constant variance. This heteroscedasticity could affect the validity of statistical inferences from the model.'
            }
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Homoscedasticity Test</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Statistic</TableHead>
                  <TableHead>p-value</TableHead>
                  <TableHead>Assessment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(tests as Record<string, HomoscedasticityTestResult>).map(([key, test]) => {
                  const testResult = test;
                  return (
                    <TableRow key={key}>
                      <TableCell>{testResult.testName}</TableCell>
                      <TableCell>
                        {testResult.statistic !== null ? testResult.statistic.toFixed(4) : 'N/A'}
                        {testResult.df && <span className="text-xs text-muted-foreground ml-1">(df={testResult.df})</span>}
                        {testResult.df1 && testResult.df2 && (
                          <span className="text-xs text-muted-foreground ml-1">(df1={testResult.df1}, df2={testResult.df2})</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {testResult.pValue !== null ? testResult.pValue.toFixed(4) : 'N/A'}
                        {testResult.error && <span className="text-xs text-muted-foreground block">{testResult.error}</span>}
                      </TableCell>
                      <TableCell className="flex items-center">
                        {testResult.isHomoscedastic ? (
                          <><Check className="h-4 w-4 text-green-500 mr-2" /> Homoscedastic</>
                        ) : (
                          <><X className="h-4 w-4 text-red-500 mr-2" /> Heteroscedastic</>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {residualStats && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Residual Statistics</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statistic</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Count</TableCell>
                    <TableCell>{residualStats.count}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mean</TableCell>
                    <TableCell>{residualStats.mean.toFixed(6)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Standard Deviation</TableCell>
                    <TableCell>{residualStats.stdDev.toFixed(6)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Minimum</TableCell>
                    <TableCell>{residualStats.min.toFixed(6)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Maximum</TableCell>
                    <TableCell>{residualStats.max.toFixed(6)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="text-sm mt-4">
          <p><strong>Interpretation:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong>Breusch-Pagan Test:</strong> Tests if the variance of residuals depends on the values of the independent variables.</li>
            <li>A p-value greater than 0.05 indicates constant variance (homoscedasticity).</li>
            <li>A p-value less than 0.05 suggests non-constant variance (heteroscedasticity).</li>
            <li>If heteroscedasticity is detected, consider using robust standard errors, weighted least squares, or transforming variables.</li>
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error parsing homoscedasticity test data:", error);
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to parse homoscedasticity test results: {error instanceof Error ? error.message : 'Unknown error'}</AlertDescription>
      </Alert>
    );
  }
};

export default HomoscedasticityTest; 