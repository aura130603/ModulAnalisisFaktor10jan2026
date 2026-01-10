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

interface LinearityTestResult {
  variable: string;
  variableLabel: string;
  correlation: number;
  resetTest: {
    fStatistic: number;
    pValue: number;
    isLinear: boolean;
  };
  isLinear: boolean;
  scatterData: Array<{ x: number; y: number }>;
}

interface LinearityTestProps {
  data: string;
}

const LinearityTest: React.FC<LinearityTestProps> = ({ data }) => {
  try {
    // Parse the JSON data
    const parsedData = JSON.parse(data);
    const { title, description, allLinear, results } = parsedData;

    if (!results || !Array.isArray(results)) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Data</AlertTitle>
          <AlertDescription>Linearity test results data is invalid or missing.</AlertDescription>
        </Alert>
      );
    }

    const testResults = results as LinearityTestResult[];

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>

        <Alert variant={allLinear ? 'default' : 'destructive'}>
          <AlertTitle>
            {allLinear ? 'All relationships are linear' : 'Non-linear relationships detected'}
          </AlertTitle>
          <AlertDescription>
            {allLinear 
              ? 'All independent variables have a linear relationship with the dependent variable.' 
              : 'Some independent variables have a non-linear relationship with the dependent variable. Consider transforming variables or using non-linear models.'
            }
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variable</TableHead>
                  <TableHead>Correlation</TableHead>
                  <TableHead>F Statistic</TableHead>
                  <TableHead>p-value</TableHead>
                  <TableHead>Linearity Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testResults.map((result) => (
                  <TableRow key={result.variable}>
                    <TableCell>{result.variableLabel || result.variable}</TableCell>
                    <TableCell>{result.correlation.toFixed(4)}</TableCell>
                    <TableCell>{result.resetTest.fStatistic.toFixed(4)}</TableCell>
                    <TableCell>{result.resetTest.pValue.toFixed(4)}</TableCell>
                    <TableCell className="flex items-center">
                      {result.isLinear ? (
                        <><Check className="h-4 w-4 text-green-500 mr-2" /> Linear</>
                      ) : (
                        <><X className="h-4 w-4 text-red-500 mr-2" /> Non-linear</>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="text-sm mt-4">
          <p><strong>Interpretation:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>The RESET test evaluates if there&apos;s a non-linear relationship between variables.</li>
            <li>A p-value greater than 0.05 indicates a linear relationship (fail to reject linearity).</li>
            <li>A p-value less than 0.05 suggests a non-linear relationship (reject linearity).</li>
            <li>If non-linearity is detected, consider transforming your variables (log, square root, etc.) or using non-linear models.</li>
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error parsing linearity test data:", error);
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to parse linearity test results: {error instanceof Error ? error.message : 'Unknown error'}</AlertDescription>
      </Alert>
    );
  }
};

export default LinearityTest; 