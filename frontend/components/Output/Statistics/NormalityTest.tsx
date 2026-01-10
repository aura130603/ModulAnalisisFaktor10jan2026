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

interface NormalityTest {
  testName: string;
  statistic: number;
  pValue: number;
  isNormal: boolean;
  criticalValue: number;
}

interface NormalityTestProps {
  data: string;
}

const NormalityTest: React.FC<NormalityTestProps> = ({ data }) => {
  try {
    // Parse the JSON data
    const parsedData = JSON.parse(data);
    const { title, description, isNormal, tests, residualStats, visualizations: _visualizations } = parsedData;

    if (!tests) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Data</AlertTitle>
          <AlertDescription>Normality test results data is invalid or missing.</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>

        <Alert variant={isNormal ? 'default' : 'destructive'}>
          <AlertTitle>
            {isNormal ? 'Residuals are normally distributed' : 'Residuals may not be normally distributed'}
          </AlertTitle>
          <AlertDescription>
            {isNormal 
              ? 'The tests indicate that the residuals follow a normal distribution, which is a key assumption for linear regression.' 
              : 'Some tests suggest the residuals may not follow a normal distribution. This could affect the validity of statistical inferences from the model.'
            }
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Normality Tests</h3>
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
                {Object.values(tests as Record<string, NormalityTest>).map((test) => (
                  <TableRow key={test.testName}>
                    <TableCell>{test.testName}</TableCell>
                    <TableCell>{test.statistic.toFixed(4)}</TableCell>
                    <TableCell>{test.pValue.toFixed(4)}</TableCell>
                    <TableCell className="flex items-center">
                      {test.isNormal ? (
                        <><Check className="h-4 w-4 text-green-500 mr-2" /> Normal</>
                      ) : (
                        <><X className="h-4 w-4 text-red-500 mr-2" /> Non-normal</>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
            <li>These tests evaluate if the regression residuals follow a normal distribution.</li>
            <li>A p-value greater than 0.05 indicates normal distribution (fail to reject normality).</li>
            <li>A p-value less than 0.05 suggests non-normal distribution (reject normality).</li>
            <li>Normal residuals are important for valid statistical inferences in linear regression.</li>
            <li>If residuals are not normal, consider transforming your variables or using robust regression methods.</li>
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error parsing normality test data:", error);
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to parse normality test results: {error instanceof Error ? error.message : 'Unknown error'}</AlertDescription>
      </Alert>
    );
  }
};

export default NormalityTest; 