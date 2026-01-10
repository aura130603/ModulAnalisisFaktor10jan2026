import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportExcelConfigurationStep } from '../components/ImportExcelConfigurationStep';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import * as utils from '../importExcel.utils';

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('../importExcel.utils');
// Mock tidak diperlukan lagi karena menggunakan tabel HTML biasa

const mockResetVariables = jest.fn();
const mockOverwriteAll = jest.fn();

const mockParseSheetForPreview = utils.parseSheetForPreview as jest.Mock;
const mockProcessSheetForImport = utils.processSheetForImport as jest.Mock;
const mockGenerateVariablesFromData = utils.generateVariablesFromData as jest.Mock;

(useDataStore as unknown as jest.Mock).mockReturnValue({ });
(useVariableStore as unknown as jest.Mock).mockReturnValue({ overwriteAll: mockOverwriteAll, resetVariables: mockResetVariables });

const mockParsedSheets = [
    { sheetName: 'Sheet1', data: [['Name', 'Age'], ['Alice', 20]]},
    { sheetName: 'Sheet2', data: [['Product', 'Price'], ['A', 100]]}
];

describe('ImportExcelConfigurationStep Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementations for utils
        mockParseSheetForPreview.mockReturnValue({ data: [['Alice', 20]], headers: ['Name', 'Age'] });
        mockProcessSheetForImport.mockReturnValue({ processedFullData: [['Alice', 20]], actualHeaders: ['Name', 'Age'] });
        mockGenerateVariablesFromData.mockReturnValue([{ name: 'Name', type: 'STRING'}, { name: 'Age', type: 'NUMERIC' }]);
    });

    const renderComponent = (props = {}) => {
        const defaultProps = {
            onClose: jest.fn(),
            onBack: jest.fn(),
            fileName: 'test.xlsx',
            parsedSheets: mockParsedSheets,
            ...props
        };
        return render(<ImportExcelConfigurationStep {...defaultProps} />);
    }

    it('renders correctly with initial data', () => {
        renderComponent();
        expect(screen.getByText(/configure: test.xlsx/i)).toBeInTheDocument();
        expect(screen.getByText('Sheet1')).toBeInTheDocument(); // Select trigger display value
        // Periksa apakah tabel preview muncul
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
        expect(mockParseSheetForPreview).toHaveBeenCalledTimes(1);
    });

    it('updates preview when worksheet is changed', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        expect(mockParseSheetForPreview).toHaveBeenCalledTimes(1);
        
        const sheetSelect = screen.getByTestId('worksheet-select-trigger');
        await user.click(sheetSelect);
        await user.click(screen.getByText('Sheet2'));

        expect(mockParseSheetForPreview).toHaveBeenCalledTimes(2);
        // Ensure it was called for Sheet2
        expect(mockParseSheetForPreview).toHaveBeenLastCalledWith(
            expect.any(Object), // workbook argument
            'Sheet2',           // sheet name argument
            expect.any(Object)  // options argument
        );
    });

    it('calls import process and store actions on "Import Data" click', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const importButton = screen.getByRole('button', { name: /import data/i });
        await user.click(importButton);

        expect(mockProcessSheetForImport).toHaveBeenCalledTimes(1);
        expect(mockGenerateVariablesFromData).toHaveBeenCalledTimes(1);
        expect(mockOverwriteAll).toHaveBeenCalledTimes(1);
    });
    
    it('displays an error if import processing fails', async () => {
        const user = userEvent.setup();
        const errorMessage = 'Import failed';
        mockProcessSheetForImport.mockReturnValue({ error: errorMessage });
        renderComponent();

        const importButton = screen.getByRole('button', { name: /import data/i });
        await user.click(importButton);

        expect(await screen.findByText(/import failed/i)).toBeInTheDocument();
        expect(mockOverwriteAll).not.toHaveBeenCalled();
    });

});