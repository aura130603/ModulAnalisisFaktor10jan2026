/**
 * Factor Analysis SPSS-Style Log Generator
 * 
 * Generates SPSS syntax-like log messages for Factor Analysis operations.
 * Similar to Linear Regression log format for consistency.
 * 
 * Created: 29/1/2026
 * Updated: 29/1/2026 - Fixed extraction method mapping to match actual values
 */

import { FactorType } from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor";

/**
 * Maps extraction method internal value to SPSS syntax method name
 * Values must match those defined in constants/factor-method.ts
 */
function getExtractionMethodSyntax(method: string | null): string {
    const methodMap: Record<string, string> = {
        // Values from constants/factor-method.ts -> SPSS syntax
        "PrincipalComp": "PC",
        "PrincipalAxisFactoring": "PAF",
        "UnweightLeastSqr": "ULS",
        "GeneralizedLeastSqr": "GLS",
        "MaxLikelihood": "ML",
        "AlphaFactoring": "ALPHA",
        "ImageFactoring": "IMAGE"
    };
    return methodMap[method || "PrincipalComp"] || "PC";
}

/**
 * Gets the active rotation method from config
 */
function getRotationMethodSyntax(rotationConfig: FactorType["rotation"]): string {
    if (rotationConfig.None) return "NOROTATE";
    if (rotationConfig.Varimax) return "VARIMAX";
    if (rotationConfig.Quartimax) return "QUARTIMAX";
    if (rotationConfig.Equimax) return "EQUAMAX";
    if (rotationConfig.Oblimin) return `OBLIMIN(${rotationConfig.Delta ?? 0})`;
    if (rotationConfig.Promax) return `PROMAX(${rotationConfig.Kappa ?? 4})`;
    return "NOROTATE";
}

/**
 * Gets the missing value handling method
 */
function getMissingValueSyntax(optionsConfig: FactorType["options"]): string {
    if (optionsConfig.ExcludeListWise) return "LISTWISE";
    if (optionsConfig.ExcludePairWise) return "PAIRWISE";
    if (optionsConfig.ReplaceMean) return "MEANSUB";
    return "LISTWISE";
}

/**
 * Gets the matrix analysis type
 */
function getAnalysisMatrixSyntax(extractionConfig: FactorType["extraction"]): string {
    if (extractionConfig.Covariance) return "COV";
    return "COR"; // Default: Correlation
}

/**
 * Gets the extraction criteria syntax
 */
function getExtractionCriteriaSyntax(extractionConfig: FactorType["extraction"]): string[] {
    const criteria: string[] = [];
    
    if (extractionConfig.Eigen && extractionConfig.EigenVal !== null) {
        criteria.push(`MINEIGEN(${extractionConfig.EigenVal})`);
    }
    
    if (extractionConfig.Factor && extractionConfig.MaxFactors !== null) {
        criteria.push(`FACTORS(${extractionConfig.MaxFactors})`);
    }
    
    if (extractionConfig.MaxIter !== null) {
        criteria.push(`ITERATE(${extractionConfig.MaxIter})`);
    }
    
    return criteria;
}

/**
 * Gets the print options based on descriptives config
 */
function getPrintOptionsSyntax(descriptivesConfig: FactorType["descriptives"]): string[] {
    const printOptions: string[] = ["INITIAL"]; // Always show initial solution
    
    if (descriptivesConfig.UnivarDesc) printOptions.push("UNIVARIATE");
    if (descriptivesConfig.Coefficient) printOptions.push("CORRELATION");
    if (descriptivesConfig.SignificanceLvl) printOptions.push("SIG");
    if (descriptivesConfig.Determinant) printOptions.push("DET");
    if (descriptivesConfig.KMO) printOptions.push("KMO");
    if (descriptivesConfig.Inverse) printOptions.push("INV");
    if (descriptivesConfig.Reproduced) printOptions.push("REPR");
    if (descriptivesConfig.AntiImage) printOptions.push("AIC");
    
    return printOptions;
}

/**
 * Gets the plot options based on extraction config
 */
function getPlotOptionsSyntax(extractionConfig: FactorType["extraction"], rotationConfig: FactorType["rotation"]): string[] {
    const plotOptions: string[] = [];
    
    if (extractionConfig.Scree) plotOptions.push("EIGEN");
    if (rotationConfig.LoadingPlot) plotOptions.push("ROTATION");
    
    return plotOptions;
}

/**
 * Gets the score method syntax
 */
function getScoreMethodSyntax(scoresConfig: FactorType["scores"]): string | null {
    if (!scoresConfig.SaveVar) return null;
    
    if (scoresConfig.Regression) return "REG";
    if (scoresConfig.Bartlett) return "BARTLETT";
    if (scoresConfig.Anderson) return "AR";
    return "REG";
}

/**
 * Generates SPSS-style syntax log for Factor Analysis
 * 
 * Example output:
 * FACTOR /VARIABLES VAR1 VAR2 VAR3
 *   /MISSING LISTWISE
 *   /ANALYSIS VAR1 VAR2 VAR3
 *   /PRINT INITIAL KMO EXTRACTION ROTATION
 *   /PLOT EIGEN
 *   /CRITERIA MINEIGEN(1) ITERATE(25)
 *   /EXTRACTION PC
 *   /ROTATION VARIMAX
 *   /METHOD=CORRELATION.
 */
export function generateFactorAnalysisLog(configData: FactorType): string {
    const variables = configData.main.TargetVar || [];
    const variablesList = variables.join(" ");
    
    // Build the log parts
    const logParts: string[] = [];
    
    // Main FACTOR command with variables
    logParts.push(`FACTOR /VARIABLES ${variablesList}`);
    
    // Missing value handling
    const missingMethod = getMissingValueSyntax(configData.options);
    logParts.push(`  /MISSING ${missingMethod}`);
    
    // Analysis variables (same as VARIABLES in most cases)
    logParts.push(`  /ANALYSIS ${variablesList}`);
    
    // Print options
    const printOptions = getPrintOptionsSyntax(configData.descriptives);
    if (configData.extraction.Unrotated) printOptions.push("EXTRACTION");
    if (configData.rotation.RotatedSol && !configData.rotation.None) printOptions.push("ROTATION");
    logParts.push(`  /PRINT ${printOptions.join(" ")}`);
    
    // Plot options (if any)
    const plotOptions = getPlotOptionsSyntax(configData.extraction, configData.rotation);
    if (plotOptions.length > 0) {
        logParts.push(`  /PLOT ${plotOptions.join(" ")}`);
    }
    
    // Format options (suppression)
    if (configData.options.SuppressValues && configData.options.SuppressValuesNum !== null) {
        const formatOptions: string[] = [];
        if (configData.options.SortSize) formatOptions.push("SORT");
        formatOptions.push(`BLANK(${configData.options.SuppressValuesNum})`);
        logParts.push(`  /FORMAT ${formatOptions.join(" ")}`);
    } else if (configData.options.SortSize) {
        logParts.push(`  /FORMAT SORT`);
    }
    
    // Extraction criteria
    const criteria = getExtractionCriteriaSyntax(configData.extraction);
    if (criteria.length > 0) {
        logParts.push(`  /CRITERIA ${criteria.join(" ")}`);
    }
    
    // Extraction method
    const extractionMethod = getExtractionMethodSyntax(configData.extraction.Method);
    logParts.push(`  /EXTRACTION ${extractionMethod}`);
    
    // Rotation method
    const rotationMethod = getRotationMethodSyntax(configData.rotation);
    logParts.push(`  /ROTATION ${rotationMethod}`);
    
    // Score saving (if enabled)
    const scoreMethod = getScoreMethodSyntax(configData.scores);
    if (scoreMethod) {
        logParts.push(`  /SAVE ${scoreMethod}(ALL)`);
    }
    
    // Matrix type (correlation or covariance)
    const analysisMatrix = getAnalysisMatrixSyntax(configData.extraction);
    logParts.push(`  /METHOD=${analysisMatrix}.`);
    
    return logParts.join("\n");
}

/**
 * Generates a compact one-line version of the log (for display purposes)
 */
export function generateFactorAnalysisLogCompact(configData: FactorType): string {
    const variables = configData.main.TargetVar || [];
    const variablesList = variables.join(" ");
    const extractionMethod = getExtractionMethodSyntax(configData.extraction.Method);
    const rotationMethod = getRotationMethodSyntax(configData.rotation);
    const missingMethod = getMissingValueSyntax(configData.options);
    const analysisMatrix = getAnalysisMatrixSyntax(configData.extraction);
    
    const criteriaStr = configData.extraction.Eigen && configData.extraction.EigenVal !== null
        ? `MINEIGEN(${configData.extraction.EigenVal})`
        : configData.extraction.Factor && configData.extraction.MaxFactors !== null
            ? `FACTORS(${configData.extraction.MaxFactors})`
            : "";
    
    return `FACTOR /VARIABLES ${variablesList} /MISSING ${missingMethod} /EXTRACTION ${extractionMethod} /CRITERIA ${criteriaStr} /ROTATION ${rotationMethod} /METHOD=${analysisMatrix}.`;
}
