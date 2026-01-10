import type { Variable } from "@/types/Variable";

/**
 * Evaluates a condition expression against a data row
 * @param expression Condition expression to evaluate
 * @param row Data row to evaluate against
 * @param variables Array of variables with column mappings
 * @returns Boolean result of the condition evaluation
 */
export function evaluateCondition(expression: string, row: any[], variables: Variable[]): boolean {
  try {
    // Build variable map for easy access
    const varMap = new Map<string, any>();
    variables.forEach(variable => {
      varMap.set(variable.name, row[variable.columnIndex]);
    });

    // Replace variable names with their values in the expression
    let processedExpression = expression;
    
    // Process function calls first
    processedExpression = processFunctions(processedExpression, row, variables);
    
    // Replace variable names with their values
    // Use Array.from() to convert Map entries to an array before iterating
    Array.from(varMap.entries()).forEach(([varName, value]) => {
      // Use regex to match whole words only
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      
      // Convert to appropriate type based on the comparison
      if (typeof value === 'string') {
        processedExpression = processedExpression.replace(regex, `"${value}"`);
      } else if (value === null || value === undefined) {
        processedExpression = processedExpression.replace(regex, 'null');
      } else {
        processedExpression = processedExpression.replace(regex, value.toString());
      }
    });

    // Replace comparison operators
    processedExpression = processedExpression
      .replace(/==/g, '===')
      .replace(/!=/g, '!==')
      .replace(/&/g, '&&')
      .replace(/\|/g, '||')
      .replace(/~/g, '!');
    
    // Safely evaluate the expression
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${  processedExpression}`)();
    return !!result;
  } catch (error) {
    console.error("Error evaluating condition:", error);
    return false;
  }
}

/**
 * Process functions in the expression
 * @param expression Expression containing functions
 * @param row Data row
 * @param variables Array of variables
 * @returns Processed expression with function calls replaced by their results
 */
function processFunctions(expression: string, row: any[], variables: Variable[]): string {
  // Helper to call processFunction with row & variables context
  const pf = (
    expr: string,
    fnName: string,
    evaluator: (args: any[]) => any
  ) => processFunction(expr, fnName, evaluator, row, variables);

  let result = expression;

  // Math functions
  result = pf(result, "ABS", (args) => Math.abs(parseFloat(args[0] as any)));
  result = pf(result, "SQRT", (args) => {
    const value = parseFloat(args[0] as any);
    if (value < 0) throw new Error("Cannot take square root of negative number");
    return Math.sqrt(value);
  });
  result = pf(result, "ROUND", (args) => Math.round(parseFloat(args[0] as any)));
  result = pf(result, "FLOOR", (args) => Math.floor(parseFloat(args[0] as any)));
  result = pf(result, "CEIL", (args) => Math.ceil(parseFloat(args[0] as any)));
  result = pf(result, "INT", (args) => Math.floor(parseFloat(args[0] as any)));
  result = pf(result, "MAX", (args) => {
    if (args.length === 0) throw new Error("MAX function requires at least one argument");
    return Math.max(...(args as any[]).map(a => parseFloat(a)));
  });
  result = pf(result, "MIN", (args) => {
    if (args.length === 0) throw new Error("MIN function requires at least one argument");
    return Math.min(...(args as any[]).map(a => parseFloat(a)));
  });
  result = pf(result, "SUM", (args) => {
    if (args.length === 0) throw new Error("SUM function requires at least one argument");
    return (args as any[]).reduce((sum, val) => sum + parseFloat(val), 0);
  });
  result = pf(result, "POW", (args) => {
    if (args.length !== 2) throw new Error("POW function requires exactly two arguments");
    return Math.pow(parseFloat(args[0] as any), parseFloat(args[1] as any));
  });
  result = pf(result, "EXP", (args) => Math.exp(parseFloat(args[0] as any)));
  result = pf(result, "LOG", (args) => {
    const value = parseFloat(args[0] as any);
    if (value <= 0) throw new Error("Cannot take logarithm of non-positive number");
    return Math.log(value);
  });
  result = pf(result, "LOG10", (args) => {
    const value = parseFloat(args[0] as any);
    if (value <= 0) throw new Error("Cannot take logarithm of non-positive number");
    return Math.log10(value);
  });
  
  // Statistical functions
  result = pf(result, "MEAN", (args) => {
    if (args.length === 0) throw new Error("MEAN function requires at least one argument");
    const numbers = (args as any[]).map(a => parseFloat(a));
    return numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
  });
  
  result = pf(result, "MEDIAN", (args) => {
    if (args.length === 0) throw new Error("MEDIAN function requires at least one argument");
    const numbers = (args as any[]).map(a => parseFloat(a)).sort((a: number, b: number) => a - b);
    const mid = Math.floor(numbers.length / 2);
    return numbers.length % 2 === 0 ? (numbers[mid - 1] + numbers[mid]) / 2 : numbers[mid];
  });
  
  result = pf(result, "SD", (args) => {
    if (args.length <= 1) throw new Error("SD function requires at least two arguments");
    const numbers = (args as any[]).map(a => parseFloat(a));
    const mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
    const squareDiffs = numbers.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / (numbers.length - 1));
  });
  
  result = pf(result, "MISSING", (args) => {
    if (args.length === 0) throw new Error("MISSING function requires one argument");
    const varName = String(args[0]).replace(/['"]/g, '');
    const variable = variables.find(v => v.name === varName);
    if (!variable) return false;
    
    const value = row[variable.columnIndex];
    return value === null || value === undefined || value === '';
  });
  
  result = pf(result, "NMISS", (args) => {
    let count = 0;
    for (const arg of args) {
      // Check if the arg is a variable name
      const varName = String(arg).replace(/['"]/g, '');
      const variable = variables.find(v => v.name === varName);
      if (variable) {
        const value = row[variable.columnIndex];
        if (value === null || value === undefined || value === '') {
          count++;
        }
      }
    }
    return count;
  });
  
  result = pf(result, "COUNT", (args) => {
    return args.length;
  });
  
  // Text functions
  result = pf(result, "CONCAT", (args) => (args as any[]).join(''));
  result = pf(result, "LENGTH", (args) => String(args[0]).length);
  result = pf(result, "LOWER", (args) => String(args[0]).toLowerCase());
  result = pf(result, "UPPER", (args) => String(args[0]).toUpperCase());
  result = pf(result, "TRIM", (args) => String(args[0]).trim());
  result = pf(result, "SUBSTR", (args) => {
    if (args.length < 2) throw new Error("SUBSTR function requires at least two arguments");
    const str = String(args[0]);
    const start = parseInt(String(args[1]));
    const len = args.length > 2 ? parseInt(String(args[2])) : str.length - start;
    return str.substr(start, len);
  });
  result = pf(result, "REPLACE", (args) => {
    if (args.length !== 3) throw new Error("REPLACE function requires three arguments");
    const str = String(args[0]);
    const search = String(args[1]);
    const replacement = String(args[2]);
    return str.replace(new RegExp(search, 'g'), replacement);
  });
  
  // Conditional functions
  result = pf(result, "IF", (args) => {
    if (args.length !== 3) throw new Error("IF function requires three arguments");
    const condition = String(args[0]).toLowerCase();
    const trueVal = args[1];
    const falseVal = args[2];
    return (condition === 'true' || condition === '1' || parseFloat(condition) !== 0) ? trueVal : falseVal;
  });
  
  return result;
}

/**
 * Process a specific function in an expression
 * @param expression Expression containing the function
 * @param funcName Name of the function to process
 * @param evaluator Function to evaluate the arguments
 * @param row Data row
 * @param variables Array of variables
 * @returns Processed expression with function call replaced by its result
 */
function processFunction(expression: string, funcName: string, evaluator: (args: any[]) => any, row: any[], variables: Variable[]): string {
  const regex = new RegExp(`${funcName}\\(([^()]*)\\)`, 'gi');
  return expression.replace(regex, (_, argsStr) => {
    const rawArgs = parseArgs(argsStr);

    // Resolve arguments: convert variable names to their values, strip quotes, parse numbers
    const resolvedArgs = rawArgs.map((a) => {
      const trimmed = a.trim();

      // Quoted string literal
      if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        return trimmed.slice(1, -1);
      }

      // Variable name
      const variable = variables.find(v => v.name === trimmed);
      if (variable) {
        return row[variable.columnIndex];
      }

      // Numeric literal
      const num = Number(trimmed);
      if (!isNaN(num)) return num;

      // Fallback string
      return trimmed;
    });

    let computed;
    if (mathFuncs[funcName]) {
      computed = (mathFuncs as any)[funcName](...(resolvedArgs as any[]).map(Number));
    } else if (stringFuncs[funcName]) {
      computed = (stringFuncs as any)[funcName](String(resolvedArgs[0]));
    } else {
      computed = evaluator(resolvedArgs);
    }

    return typeof computed === 'string' ? `'${computed}'` : String(computed);
  });
}

/**
 * Parse function arguments, handling commas in string literals
 * @param argsStr String containing function arguments
 * @returns Array of argument strings
 */
function parseArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    
    if ((char === '"' || char === "'") && (i === 0 || argsStr[i-1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      current += char;
    } else if (char === ',' && !inString) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    args.push(current.trim());
  }
  
  return args;
}

const mathFuncs: Record<string, (...args:any[])=>any> = {
    SQRT: (n:number)=> Math.sqrt(n),
    ABS: (n:number)=> Math.abs(n),
    SUM: (...nums:number[])=> nums.reduce((a,b)=>a+b,0)
};
const stringFuncs: Record<string,(s:string)=>any>={
    LOWER:(s:string)=> s.toLowerCase(),
    UPPER:(s:string)=> s.toUpperCase(),
    TRIM:(s:string)=> s.trim(),
    LENGTH:(s:string)=> s.length
}; 