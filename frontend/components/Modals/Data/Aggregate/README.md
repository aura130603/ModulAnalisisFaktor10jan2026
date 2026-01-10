# Aggregate Data Feature

This document explains the functionality of the Aggregate Data feature, which allows users to combine data into summary statistics across groups.

## Overview

The Aggregate Data feature enables users to aggregate data by creating summary statistics for specified variables within groups defined by break variables. This is useful for summarizing information, calculating group means, finding maximum values per group, counting occurrences, and more.

## Options Explained

### Variables Configuration

#### Break Variable(s)

These variables define the groups for aggregation. Each unique combination of values in the break variables creates a group. For example, if "Gender" and "Region" are break variables, the data will be aggregated separately for each Gender-Region combination.

#### Aggregated Variables

These are the variables to be summarized. For each selected variable, you can apply an aggregation function to calculate a statistic for each group defined by the break variables.

### Aggregation Functions

The feature provides several categories of aggregation functions:

#### Summary Statistics

- **Mean**: Calculates the average value across cases in each group
- **Median**: Finds the middle value in each group when values are sorted
- **Sum**: Calculates the total of all values in each group
- **Standard Deviation**: Measures the amount of variation within each group

#### Specific Values

- **First**: Takes the first value encountered in each group
- **Last**: Takes the last value encountered in each group
- **Minimum**: Finds the smallest value in each group
- **Maximum**: Finds the largest value in each group

#### Number of Cases

*Note: The terms "Weighted" and "Unweighted" are based on SPSS terminology. Currently, this feature does not support a case weight variable, so all counts are effectively unweighted.*

- **Weighted (N)**: Counts the number of cases in each group where the source variable has a non-missing value.
- **Weighted Missing (NMISS)**: Counts the number of cases in each group where the source variable has a missing value.
- **Unweighted (NU)**: Counts the total number of cases in each group.
- **Unweighted Missing (NUMISS)**: Counts the number of cases in each group where the source variable has a missing value.

#### Percentages, Fractions, Counts

- **Percentages**: Calculates percentage of cases meeting specific criteria
  - **Above**: Percentage of cases above a specified value
  - **Below**: Percentage of cases below a specified value
  - **Inside**: Percentage of cases between two specified values
  - **Outside**: Percentage of cases outside a range of specified values
- **Fractions**: Similar to percentages but expressed as proportions (0-1 instead of 0-100)
- **Counts**: Simple counting of cases meeting criteria

### Additional Options

#### Options for Very Large Datasets

- **File is already sorted on break variable(s)**: Skip the sorting step when data is already ordered by break variables. *(Note: This option is available in the UI but not yet implemented in the aggregation logic.)*
- **Sort file before aggregating**: Sort data by break variables before aggregating (improves performance). *(Note: This option is available in the UI but not yet implemented in the aggregation logic.)*

## Algorithm Details

The aggregation algorithm works as follows:

1. **Grouping**:
   - Data is grouped by unique combinations of values in the break variables
   - Each unique combination forms a distinct group

2. **Function Application**:
   - For each aggregated variable, the specified function is applied to all values within each group
   - Results are calculated and stored in new variables

3. **Result Generation**:
   - New variables are created for each aggregated variable with its associated function.
   - By default, these new variables are added to the *active dataset*. The aggregated value is then broadcast to all cases belonging to the same break group.
   - Functionality to create a new dataset containing one case per break group is planned for a future release.

## Usage Examples

### Calculating Group Averages

To find average scores by group:
1. Select "Gender" and "Class" as break variables
2. Add "Score" to aggregated variables
3. Choose "Mean" as the aggregation function
4. Click OK to process
5. Results will show the average score for each Gender-Class combination

### Finding Maximum Values Per Group

To find maximum income by department:
1. Select "Department" as break variable
2. Add "Income" to aggregated variables
3. Choose "Maximum" as the aggregation function
4. Click OK to process
5. Results will show the highest income in each department

### Counting Cases Per Group

To count people by region and age category:
1. Select "Region" and "AgeGroup" as break variables
2. Choose any variable for aggregation
3. Apply the "Weighted" (N) function
4. Click OK to process
5. Results will show counts for each Region-AgeGroup combination

## Notes

- The aggregation process creates new variables in your dataset, one for each aggregation function applied.
- Variable names are automatically generated based on the original variable and function (e.g., "income_mean").
- When using multiple break variables, grouping happens based on all combinations of these variables.
- For optimal performance with large datasets, consider using the sorting options.

## Implementation Details

The Aggregate Data feature is implemented with a focus on flexibility and performance:

1. **User Interface**:
   - The UI is divided into tabs: Variables and Options
   - The Variables tab allows selection of break variables and specification of aggregation variables with functions
   - The Options tab provides settings for handling large datasets

2. **Data Processing Flow**:
   - When the user clicks "OK", the specified break variables group the data
   - Aggregation functions are applied to the target variables within each group
   - New variables are created with appropriate naming conventions
   - Results are displayed in the dataset view

3. **Function Processing**:
   - Each aggregation function has specialized logic for different data types and edge cases
   - Missing value handling is consistent with statistical practices
   - Calculations maintain numerical precision where appropriate

4. **Performance Optimization**:
   - Efficient grouping algorithms minimize memory usage
   - Options for pre-sorted data improve performance for very large datasets
   - Background processing prevents UI freezes during computation

## Sample Test Data

To test the Aggregate Data feature, you can use the following sample dataset that includes different variable types and potential groupings:

```
ID,Department,Gender,Age,Salary,Performance
1,Sales,M,34,65000,4.2
2,Sales,F,29,62000,4.5
3,Marketing,M,45,70000,3.8
4,Marketing,F,39,68000,4.0
5,Sales,M,27,58000,3.9
6,IT,M,33,72000,4.3
7,IT,F,31,71000,4.4
8,Marketing,M,52,75000,3.7
9,Sales,F,36,63000,4.1
10,IT,M,41,78000,4.6
```

### Test Scenarios

1. **Department Summary**:
   - Break Variable: Department
   - Aggregated Variables: Salary (Mean), Performance (Mean)
   - Expected Result: Average salary and performance for each department

2. **Department-Gender Analysis**:
   - Break Variables: Department, Gender
   - Aggregated Variables: Salary (Mean), Count (N)
   - Expected Result: Average salary and count of employees for each department-gender combination

3. **Age-Based Statistics**:
   - Break Variable: Department
   - Aggregated Variables: Age (Min), Age (Max), Age (Mean)
   - Expected Result: Min, max and average age for each department

These examples demonstrate how to use the Aggregate Data feature for different analysis needs and validate the results. 