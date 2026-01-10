import React from 'react';
import { render, screen } from '@testing-library/react';
import ModalManager from '../ModalManager';
import { useModalStore } from '@/stores/useModalStore';
// @ts-expect-error - ModalRegistry is dynamically mocked in tests and may not be exported in source code
import { ModalRegistry } from '../ModalRegistry';
import { ModalType } from '@/types/modalTypes';

// Mock dependencies
jest.mock('@/stores/useModalStore');
jest.mock('../ModalRegistry', () => ({
    ModalRegistry: new Map(),
}));
jest.mock('../ModalRenderer', () => ({
    __esModule: true,
    default: ({ component: Component, props }: { component: React.FC<any>, props: any }) => (
        <div data-testid="modal-renderer">
            <Component {...props} />
        </div>
    ),
}));
// Mock the onborda module to avoid ESM parsing issues
jest.mock('onborda', () => ({
    useOnborda: () => ({ closeOnborda: jest.fn() })
}));

// Mock a sample modal component
const SampleModal = (props: any) => <div data-testid="sample-modal">Sample Modal: {props.text}</div>;

describe('ModalManager', () => {
    // @ts-expect-error - casting store hook to jest.Mock for test mocking purposes
    const mockUseModalStore = useModalStore as jest.Mock;
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Register a mock modal
        (ModalRegistry as Map<ModalType, React.FC<any>>).set(ModalType.ExportCSV, SampleModal);
    });

    it('should render nothing when no modals are active', () => {
        mockUseModalStore.mockReturnValue({
            getTopModal: () => null,
        });

        render(<ModalManager />);
        expect(screen.queryByTestId('modal-renderer')).not.toBeInTheDocument();
    });

    it('should render the top modal from the store', () => {
        const modalData = {
            id: '1',
            type: ModalType.ExportCSV,
            props: { text: 'Hello World' },
        };
        mockUseModalStore.mockReturnValue({
            getTopModal: () => modalData,
        });

        render(<ModalManager />);

        expect(screen.getByTestId('modal-renderer')).toBeInTheDocument();
        expect(screen.getByTestId('sample-modal')).toBeInTheDocument();
        expect(screen.getByText('Sample Modal: Hello World')).toBeInTheDocument();
    });

    it('should do nothing if the modal type is not in the registry', () => {
        const modalData = {
            id: '2',
            type: 'NonExistentModal' as ModalType,
            props: {},
        };
        mockUseModalStore.mockReturnValue({
            getTopModal: () => modalData,
        });
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        
        render(<ModalManager />);
        
        expect(screen.queryByTestId('modal-renderer')).not.toBeInTheDocument();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "ModalManager: Component for modal type NonExistentModal not found in registry."
        );
        consoleErrorSpy.mockRestore();
    });
}); 