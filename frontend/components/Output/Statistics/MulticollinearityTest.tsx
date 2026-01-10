import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';

interface MulticollinearityTestProps {
  data: string;
}

interface VifItem {
  variable: string;
  variableLabel: string;
  vif: number;
  concern: string;
}

interface CorrelationMatrix {
  variables: string[];
  variableLabels: string[];
  values: number[][];
}

interface TestResult {
  hasMulticollinearity: boolean;
  correlationMatrix: CorrelationMatrix;
  vif: VifItem[];
  interpretation: string[];
  title?: string;
  description?: string;
}

const MulticollinearityTest: React.FC<MulticollinearityTestProps> = ({ data }) => {
  try {
    // Parse the data, which could be a string representation of the results object
    // or a string representation of an object with a results property
    const parsedData = JSON.parse(data);
    
    // Try to extract the actual test result data
    const result: TestResult = parsedData.results || parsedData;
    
    if (!result || typeof result !== 'object' || !('correlationMatrix' in result) || !('vif' in result)) {
      console.error('Invalid multicollinearity test data:', result);
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Invalid multicollinearity test data. Please try running the test again.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <Alert variant={result.hasMulticollinearity ? "destructive" : "default"}>
          <div className="flex items-center">
            {result.hasMulticollinearity ? (
              <AlertTriangleIcon className="h-4 w-4" />
            ) : (
              <CheckCircleIcon className="h-4 w-4" />
            )}
            <AlertTitle className="ml-2">
              {result.hasMulticollinearity 
                ? "Multicollinearity Detected" 
                : "No Significant Multicollinearity"
              }
            </AlertTitle>
          </div>
          <AlertDescription>
            {result.interpretation?.length > 0 && (
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {result.interpretation.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>VIF Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variable</TableHead>
                  <TableHead>VIF</TableHead>
                  <TableHead>Concern Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.vif.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.variableLabel || item.variable}</TableCell>
                    <TableCell>{item.vif.toFixed(3)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        item.concern === "Low" ? "outline" : 
                        item.concern === "Moderate" ? "secondary" :
                        item.concern === "High" ? "destructive" : 
                        "destructive"
                      }>
                        {item.concern}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-xs text-muted-foreground mt-4">
              <p>VIF Interpretation:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>VIF &lt; 2: Low multicollinearity concern</li>
                <li>VIF 2-5: Moderate multicollinearity</li>
                <li>VIF 5-10: High multicollinearity</li>
                <li>VIF &gt; 10: Very high multicollinearity</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Correlation Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variable</TableHead>
                    {result.correlationMatrix.variableLabels.map((label, i) => (
                      <TableHead key={i}>{label || result.correlationMatrix.variables[i]}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.correlationMatrix.variables.map((variable, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {result.correlationMatrix.variableLabels[i] || variable}
                      </TableCell>
                      {result.correlationMatrix.values[i].map((value, j) => (
                        <TableCell 
                          key={j} 
                          className={Math.abs(value) > 0.7 && i !== j ? "text-destructive font-bold" : ""}
                        >
                          {value.toFixed(3)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-xs text-muted-foreground mt-4">
              <div className="flex items-center">
                <InfoIcon className="h-3 w-3 mr-1" />
                <span>
                  Values above 0.7 (highlighted in red) indicate strong correlation between variables.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-xs text-muted-foreground mt-2">
          <p>
            Multicollinearity occurs when independent variables are strongly correlated with each other, 
            which can affect the reliability of regression coefficients.
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering multicollinearity test:', error);
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to parse multicollinearity test results.
          {error instanceof Error ? ` ${error.message}` : ''}
        </AlertDescription>
      </Alert>
    );
  }
};

export default MulticollinearityTest; 