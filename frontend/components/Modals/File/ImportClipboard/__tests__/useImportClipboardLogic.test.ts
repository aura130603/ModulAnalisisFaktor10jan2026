import { renderHook, act } from '@testing-library/react';
import { useImportClipboardLogic } from '../hooks/useImportClipboardLogic';
import { useMobile } from '@/hooks/useMobile';

// Mock dependencies
jest.mock('@/hooks/useMobile');
const mockedUseMobile = useMobile as jest.Mock;

describe('useImportClipboardLogic hook', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseMobile.mockReturnValue({ isMobile: false, isPortrait: false });
    });

    it('should initialize with the correct default state', () => {
        const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));
        
        expect(result.current.stage).toBe('paste');
        expect(result.current.pastedText).toBeNull();
        expect(result.current.parsedData).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should update pastedText and parsedData on handleTextPaste', () => {
        const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));
        const testText = 'a\tb\nc\td';

        act(() => {
            result.current.handleTextPaste(testText);
        });

        expect(result.current.pastedText).toBe(testText);
        expect(result.current.parsedData).toEqual([['a', 'b'], ['c', 'd']]);
    });

    it('should clear error on handleTextPaste', () => {
        const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));

        act(() => {
            result.current.handleContinueToConfigure(); // This will set an error
        });
        expect(result.current.error).not.toBeNull();

        act(() => {
            result.current.handleTextPaste('some text');
        });
        expect(result.current.error).toBeNull();
    });

    it('should transition to configure stage on handleContinueToConfigure with valid data', () => {
        const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));
        
        act(() => {
            result.current.handleTextPaste('a\tb');
        });
        
        act(() => {
            result.current.handleContinueToConfigure();
        });
        
        expect(result.current.stage).toBe('configure');
        expect(result.current.error).toBeNull();
    });

    it('should set an error on handleContinueToConfigure if there is no data', () => {
        const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));

        act(() => {
            result.current.handleContinueToConfigure();
        });
        
        expect(result.current.stage).toBe('paste');
        expect(result.current.error).toBe('Please paste some data first.');
    });

    it('should transition back to paste stage on handleBackToPaste', () => {
        const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));

        act(() => {
            result.current.handleTextPaste('a\tb');
        });

        act(() => {
            result.current.handleContinueToConfigure();
        });

        expect(result.current.stage).toBe('configure');

        act(() => {
            result.current.handleBackToPaste();
        });
        expect(result.current.stage).toBe('paste');
    });

    it('should call onClose prop on handleModalClose', () => {
        const { result } = renderHook(() => useImportClipboardLogic({ onClose: mockOnClose }));
        
        act(() => {
            result.current.handleModalClose();
        });

        expect(mockOnClose).toHaveBeenCalled();
    });
}); 