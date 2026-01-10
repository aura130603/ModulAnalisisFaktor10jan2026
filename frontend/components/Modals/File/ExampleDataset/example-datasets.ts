import type { ExampleFiles } from './types';

const exampleSavFiles = [
    { 
        name: 'accidents', 
        path: '/exampleData/accidents.sav',
        tags: ['insurance', 'risk'],
        description: 'Insurance company studying age and gender risk factors for automobile accidents.'
    },
    { 
        name: 'adl', 
        path: '/exampleData/adl.sav',
        tags: ['medical', 'therapy'],
        description: 'Benefits of emotional therapy for stroke patients compared to standard physical therapy.'
    },
    { 
        name: 'advert', 
        path: '/exampleData/advert.sav',
        tags: ['marketing', 'sales'],
        description: 'Retailer examining relationship between advertising costs and sales figures.'
    },
    { 
        name: 'bankloan', 
        path: '/exampleData/bankloan.sav',
        tags: ['finance', 'risk'],
        description: 'Bank efforts to reduce loan defaults with financial and demographic information.'
    },
    { 
        name: 'behavior', 
        path: '/exampleData/behavior.sav',
        tags: ['psychology', 'survey'],
        description: 'Students rating appropriateness of behaviors in various situations.'
    },
    { 
        name: 'car_sales', 
        path: '/exampleData/car_sales.sav',
        tags: ['automotive', 'sales'],
        description: 'Sales estimates, list prices, and specifications for various vehicles.'
    },
    { 
        name: 'contacts', 
        path: '/exampleData/contacts.sav',
        tags: ['business', 'sales'],
        description: 'Contact lists for corporate computer sales representatives.'
    },
    { 
        name: 'customer_dbase', 
        path: '/exampleData/customer_dbase.sav',
        tags: ['marketing', 'offers'],
        description: 'Company using data warehouse to make special offers to likely responders.'
    },
    { 
        name: 'demo', 
        path: '/exampleData/demo.sav',
        tags: ['marketing', 'demographics'],
        description: 'Mailing list with demographic information for marketing offers.'
    },
    { 
        name: 'employee_data', 
        path: '/exampleData/employee_data.sav',
        tags: ['hr', 'performance'],
        description: 'Employee data with job satisfaction, gender, and minority classification.'
    },
    { 
        name: 'german_credit', 
        path: '/exampleData/german_credit.sav',
        tags: ['finance', 'risk'],
        description: 'German credit dataset from University of California, Irvine.'
    },
    { 
        name: 'insurance_claims', 
        path: '/exampleData/insurance_claims.sav',
        tags: ['insurance', 'fraud'],
        description: 'Insurance company examining fraudulent claims detection.'
    },
    { 
        name: 'poll_cs_sample', 
        path: '/exampleData/poll_cs_sample.sav',
        tags: ['polling', 'survey'],
        description: 'Sample of voters from a poll concerning public support for legislation.'
    },
    { 
        name: 'patient_los', 
        path: '/exampleData/patient_los.sav',
        tags: ['medical', 'treatment'],
        description: 'Treatment records of patients admitted for suspected heart attack.'
    },
    { 
        name: 'salesperformance', 
        path: '/exampleData/salesperformance.sav',
        tags: ['training', 'performance'],
        description: 'Evaluation of two new sales training courses.'
    },
    { 
        name: 'satisf', 
        path: '/exampleData/satisf.sav',
        tags: ['marketing', 'survey'],
        description: 'Customer satisfaction survey at 4 store locations.'
    },
    { 
        name: 'tcm_kpi', 
        path: '/exampleData/tcm_kpi.sav',
        tags: ['business', 'metrics'],
        description: 'Weekly key performance indicators for business analysis.'
    },
    { 
        name: 'telco', 
        path: '/exampleData/telco.sav',
        tags: ['telecom', 'churn'],
        description: 'Telecommunications company efforts to reduce customer churn.'
    },
    { 
        name: 'telco_extra', 
        path: '/exampleData/telco_extra.sav',
        tags: ['telecom', 'spending'],
        description: 'Telecom data with standardized log-transformed customer spending variables.'
    },
    { 
        name: 'test_scores', 
        path: '/exampleData/test_scores.sav',
        tags: ['education', 'assessment'],
        description: 'Test scores for educational assessment and performance analysis.'
    },
    { 
        name: 'workprog', 
        path: '/exampleData/workprog.sav',
        tags: ['government', 'employment'],
        description: 'Government works program for disadvantaged people job placement.'
    },
    { 
        name: 'worldsales', 
        path: '/exampleData/worldsales.sav',
        tags: ['business', 'sales'],
        description: 'Sales revenue by continent and product for global business analysis.'
    },
];

export const exampleFiles: ExampleFiles = {
    sav: exampleSavFiles,
};