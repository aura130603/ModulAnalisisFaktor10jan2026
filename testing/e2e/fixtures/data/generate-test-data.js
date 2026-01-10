/**
 * Realistic SPSS Test Data Generator
 * Creates realistic datasets with proper variables for SPSS analysis
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate realistic SPSS datasets with proper variables
 */
function generateRealisticSPSSData(rowCount) {
  const headers = [
    'RespondentID',           // Unique identifier
    'Age',                    // Numeric - Age in years
    'Gender',                 // Categorical - Male/Female/Other
    'Education',              // Ordinal - Education level
    'Income',                 // Scale - Annual income
    'Satisfaction',           // Ordinal - 1-5 Likert scale
    'Department',             // Nominal - Company department
    'Experience',             // Numeric - Years of experience
    'Salary',                 // Scale - Monthly salary
    'Performance',            // Ordinal - Performance rating
    'MaritalStatus',          // Nominal - Marital status
    'Children',               // Numeric - Number of children
    'CommuteTime',            // Numeric - Daily commute minutes
    'WorkHours',              // Numeric - Weekly work hours
    'JobSatisfaction',        // Ordinal - Job satisfaction scale
    'StressLevel',            // Ordinal - Stress level 1-10
    'TrainingHours',          // Numeric - Annual training hours
    'Promotion',              // Binary - Promoted (Yes/No)
    'Tenure',                 // Numeric - Years in current role
    'Location'                // Nominal - Office location
  ];

  const rows = [headers.join(',')];
  
  // Realistic value generators
  const departments = ['Sales', 'Marketing', 'IT', 'HR', 'Finance', 'Operations', 'R&D', 'Customer Service'];
  const genders = ['Male', 'Female', 'Other'];
  const educationLevels = ['High School', 'Bachelor', 'Master', 'PhD', 'Other'];
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
  const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
  const performanceRatings = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'];

  for (let i = 1; i <= rowCount; i++) {
    const age = Math.floor(Math.random() * 35) + 22; // 22-57 years
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const education = educationLevels[Math.floor(Math.random() * educationLevels.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const maritalStatus = maritalStatuses[Math.floor(Math.random() * maritalStatuses.length)];
    const performance = performanceRatings[Math.floor(Math.random() * performanceRatings.length)];
    
    // Correlated realistic values
    const experience = Math.floor(Math.random() * 25) + 1; // 1-25 years
    const income = Math.floor(Math.random() * 80000) + 30000; // 30K-110K
    const salary = Math.floor(income / 12 * (0.8 + Math.random() * 0.4)); // Monthly salary
    const satisfaction = Math.floor(Math.random() * 5) + 1; // 1-5 scale
    const children = Math.floor(Math.random() * 4); // 0-3 children
    const commuteTime = Math.floor(Math.random() * 60) + 5; // 5-65 minutes
    const workHours = Math.floor(Math.random() * 20) + 35; // 35-55 hours
    const trainingHours = Math.floor(Math.random() * 40) + 5; // 5-45 hours
    const stressLevel = Math.floor(Math.random() * 10) + 1; // 1-10 scale
    const tenure = Math.floor(Math.random() * 15) + 1; // 1-15 years
    const promotion = Math.random() > 0.7 ? 'Yes' : 'No'; // 30% promotion rate
    const jobSatisfaction = Math.floor(Math.random() * 5) + 1; // 1-5 scale

    const row = [
      i,                          // RespondentID
      age,                        // Age
      gender,                     // Gender
      education,                  // Education
      income,                     // Income
      satisfaction,               // Satisfaction
      department,                 // Department
      experience,                 // Experience
      salary,                     // Salary
      performance,                // Performance
      maritalStatus,              // MaritalStatus
      children,                   // Children
      commuteTime,                // CommuteTime
      workHours,                  // WorkHours
      jobSatisfaction,            // JobSatisfaction
      stressLevel,                // StressLevel
      trainingHours,              // TrainingHours
      promotion,                  // Promotion
      tenure,                     // Tenure
      location                    // Location
    ];
    
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
}

/**
 * Create 3 realistic SPSS datasets for testing
 */
function createTestDatasets() {
  const datasets = [
    { name: 'small-dataset.csv', rows: 100 },      // Small realistic dataset
    { name: 'medium-dataset.csv', rows: 1000 },    // Medium realistic dataset
    { name: 'large-dataset.csv', rows: 10000 }     // Large realistic dataset
  ];
  
  const dataDir = path.join(__dirname);
  
  datasets.forEach(({ name, rows }) => {
    const csvData = generateRealisticSPSSData(rows);
    const filePath = path.join(dataDir, name);
    fs.writeFileSync(filePath, csvData);
    console.log(`Created ${name} with ${rows} rows`);
  });
}



// Run if called directly
if (require.main === module) {
  createTestDatasets();
  console.log('3 realistic SPSS datasets created successfully!');
}

module.exports = { generateRealisticSPSSData, createTestDatasets };
