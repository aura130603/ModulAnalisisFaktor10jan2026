import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { addDataGridView, addVariableView, addResultsView } from '../services/pdfPrintService';
import { generateAutoTableDataFromString } from '../print.utils';
import type { DataRow } from '@/types/Data';
import type { Variable } from '@/types/Variable';
import type { Log } from '@/types/Result';

// Mock the external libraries
jest.mock('jspdf');
jest.mock('jspdf-autotable');

const mockJsPDF = jsPDF as unknown as jest.Mock;
const mockAutoTable = autoTable as jest.Mock;

// Helper to create a complete Variable mock
const createMockVariable = (overrides: Partial<Variable> & { columnIndex: number; name: string; type: 'NUMERIC' | 'STRING' }): Variable => ({
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    columns: 1,
    align: 'left',
    measure: 'unknown',
    role: 'input',
    label: '',
    ...overrides,
});

describe('pdfPrintService', () => {
    let doc: any;

    beforeEach(() => {
        // Reset mocks and create a fresh jsPDF instance for each test
        jest.clearAllMocks();
        
        doc = {
            text: jest.fn(),
            setFontSize: jest.fn(),
            setFont: jest.fn().mockReturnThis(),
            getFont: jest.fn().mockReturnValue({ fontName: 'helvetica' }),
            addPage: jest.fn(),
            internal: {
                pageSize: { getWidth: jest.fn().mockReturnValue(210), getHeight: jest.fn().mockReturnValue(297) },
            },
            splitTextToSize: jest.fn(text => text.split('\\n')),
            lastAutoTable: { finalY: 100 },
            save: jest.fn(),
        };

        mockJsPDF.mockImplementation(() => doc);
        mockAutoTable.mockImplementation((d, options) => {
            if (options.didDrawPage) {
                options.didDrawPage({ cursor: { y: 150 } });
            }
        });
    });

    describe('addDataGridView', () => {
        const mockVariables: Variable[] = [
            createMockVariable({ columnIndex: 0, name: 'Var1', type: 'NUMERIC' }),
            createMockVariable({ columnIndex: 1, name: 'Var2', type: 'STRING' }),
        ];
        const mockData: DataRow[] = [ [10, 'A'], [20, 'B'] ];
        const mockActiveColumns = [0, 1];

        it('should add a data view section with correct title and table', () => {
            addDataGridView(doc, 10, mockData, mockVariables, mockActiveColumns);

            expect(doc.text).toHaveBeenCalledWith('Data View', expect.any(Number), expect.any(Number));
            expect(mockAutoTable).toHaveBeenCalledWith(doc, expect.objectContaining({
                head: [['Var1', 'Var2']],
                body: [ [10, 'A'], [20, 'B'] ],
            }));
        });

        it('should not render if there is no data', () => {
            const y = addDataGridView(doc, 10, [], mockVariables, []);
            expect(doc.text).not.toHaveBeenCalled();
            expect(mockAutoTable).not.toHaveBeenCalled();
            expect(y).toBe(10);
        });

        it('should add a page if currentY is over the threshold', () => {
            addDataGridView(doc, 260, mockData, mockVariables, mockActiveColumns);
            expect(doc.addPage).toHaveBeenCalled();
        });
    });

    describe('addVariableView', () => {
        const mockVariables: Variable[] = [
            createMockVariable({ columnIndex: 0, name: 'Var1', type: 'NUMERIC', label: 'Variable 1', measure: 'scale', width: 8 }),
            createMockVariable({ columnIndex: 2, name: 'Var2', type: 'STRING', label: 'Variable 2', measure: 'nominal', width: 12 }),
        ];
        const mockActiveColumns = [0, 2];

        it('should add a variable view section with correct data', () => {
            addVariableView(doc, 10, mockVariables, mockActiveColumns);

            expect(doc.text).toHaveBeenCalledWith('Variable View', expect.any(Number), expect.any(Number));
            
            const expectedBody: string[][] = [
                ['Var1', 'NUMERIC', 'Variable 1', 'scale'],
                ['Var2', 'STRING', 'Variable 2', 'nominal'],
            ];

            expect(mockAutoTable).toHaveBeenCalledWith(doc, expect.objectContaining({
                head: [['Name', 'Type', 'Label', 'Measure']],
                body: expectedBody,
            }));
        });
    });

    describe('addResultsView', () => {
        const mockLogs: Log[] = [
            {
                id: 123,
                log: 'Frequencies analysis performed.',
                analytics: [{
                    title: 'Frequency Analysis',
                    statistics: [{
                        title: 'Gender Frequencies',
                        description: 'A table of gender frequencies.',
                        components: [],
                        output_data: JSON.stringify({
                            tables: [{
                                title: 'Gender Frequencies',
                                columnHeaders: [{ header: 'Gender' }, { header: 'Frequency' }],
                                rows: [{ rowHeader: ['Male'], Frequency: 50 }],
                            }]
                        })
                    }]
                }]
            }
        ];

        it('should render log text and analytic tables', () => {
            addResultsView(doc, 10, mockLogs, generateAutoTableDataFromString);
            
            expect(doc.text).toHaveBeenCalledWith('Output Viewer (Results)', expect.any(Number), expect.any(Number));
            expect(doc.text).toHaveBeenCalledWith('Analysis Log: 123', expect.any(Number), expect.any(Number));
            expect(doc.text).toHaveBeenCalledWith('Frequency Analysis', expect.any(Number), expect.any(Number), { align: 'center' });
            
            // Inspect the call to autoTable more directly
            const autoTableCallArgs = mockAutoTable.mock.calls[0][1];
            expect(autoTableCallArgs.body[0][0].content).toBe('Male');
            expect(autoTableCallArgs.body[0][1].content).toBe('50');
        });

        it('should call page break checks at various points', () => {
            addResultsView(doc, 280, mockLogs, generateAutoTableDataFromString);
            expect(doc.addPage).toHaveBeenCalledTimes(1);
            jest.clearAllMocks();

            addResultsView(doc, 270, mockLogs, generateAutoTableDataFromString);
            expect(doc.addPage).toHaveBeenCalledTimes(1);
        });
    });
}); 