import { renderHook, act } from '@testing-library/react';
import { useImportCsvFileReader } from '../useImportCsvFileReader';

describe('useImportCsvFileReader hook', () => {
    let mockFileReader: {
        onload: (() => void) | null;
        onerror: ((error: any) => void) | null;
        readAsText: jest.Mock;
        result: string | null;
    };

    beforeAll(() => {
        // Mock the global FileReader
        global.FileReader = jest.fn(() => mockFileReader) as any;
    });

    beforeEach(() => {
        // Reset the mock before each test
        mockFileReader = {
            onload: null,
            onerror: null,
            readAsText: jest.fn(),
            result: null,
        };
    });

    it('should have correct initial state', () => {
        const { result } = renderHook(() => useImportCsvFileReader());
        
        expect(result.current.fileContent).toBeNull();
        expect(result.current.fileName).toBe('');
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should successfully read a file and update state', () => {
        const { result } = renderHook(() => useImportCsvFileReader());
        const file = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv' });
        const fileContent = 'col1,col2\nval1,val2';

        act(() => {
            result.current.readFile(file);
        });

        // Check loading state
        expect(result.current.isLoading).toBe(true);
        expect(result.current.fileName).toBe('test.csv');
        expect(mockFileReader.readAsText).toHaveBeenCalledWith(file);

        // Simulate successful file read
        act(() => {
            mockFileReader.result = fileContent;
            mockFileReader.onload?.();
        });

        // Check final state
        expect(result.current.isLoading).toBe(false);
        expect(result.current.fileContent).toBe(fileContent);
        expect(result.current.error).toBeNull();
    });

    it('should handle file reader errors', () => {
        const { result } = renderHook(() => useImportCsvFileReader());
        const file = new File([''], 'error.csv', { type: 'text/csv' });
        const errorEvent = new ProgressEvent('error');

        act(() => {
            result.current.readFile(file);
        });

        expect(result.current.isLoading).toBe(true);

        // Simulate error
        act(() => {
            mockFileReader.onerror?.(errorEvent);
        });
        
        expect(result.current.isLoading).toBe(false);
        expect(result.current.fileContent).toBeNull();
        expect(result.current.fileName).toBe('');
        expect(result.current.error).toBe('An error occurred while trying to read the file. Please try again.');
    });

    it('should handle empty file content', () => {
        const { result } = renderHook(() => useImportCsvFileReader());
        const file = new File([''], 'empty.csv', { type: 'text/csv' });

        act(() => {
            result.current.readFile(file);
        });

        act(() => {
            mockFileReader.result = '';
            mockFileReader.onload?.();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.fileContent).toBe(null);
        expect(result.current.fileName).toBe('');
        expect(result.current.error).toBe('The selected file is empty or could not be read.');
    });
    
    it('should not do anything if no file is provided', () => {
        const { result } = renderHook(() => useImportCsvFileReader());

        act(() => {
            // @ts-ignore
            result.current.readFile(null);
        });

        expect(result.current.error).toBe('Please select a CSV file.');
        expect(mockFileReader.readAsText).not.toHaveBeenCalled();
    });

    it('should reset the state', () => {
        const { result } = renderHook(() => useImportCsvFileReader());
        const file = new File(['a,b'], 'test.csv');

        // Set some state
        act(() => {
            result.current.readFile(file);
        });
        act(() => {
            mockFileReader.result = 'a,b';
            mockFileReader.onload?.();
        });

        // Verify state is set
        expect(result.current.fileContent).toBe('a,b');
        expect(result.current.fileName).toBe('test.csv');

        // Reset the state
        act(() => {
            result.current.resetFileState();
        });

        // Verify state is reset
        expect(result.current.fileContent).toBeNull();
        expect(result.current.fileName).toBe('');
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });
}); 