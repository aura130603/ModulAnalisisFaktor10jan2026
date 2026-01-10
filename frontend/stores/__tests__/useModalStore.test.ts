import { renderHook, act } from '@testing-library/react';
import { useModalStore } from '../useModalStore';
import { ModalType } from '@/types/modalTypes';
import { FindReplaceMode } from '@/components/Modals/Edit/FindReplace/types';

describe('useModalStore', () => {
    let initialState: any;
    beforeEach(() => {
        // Reset the store's state before each test
        initialState = useModalStore.getState();
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Clear all mocks after each test
        act(() => {
            useModalStore.setState(initialState);
        });
    });

    it('should have a correct initial state', () => {
        const { result } = renderHook(() => useModalStore());
        expect(result.current.modals).toEqual([]);
        expect(result.current.isStatisticProgress).toBe(false);
        expect(result.current.hasOpenModals()).toBe(false);
    });

    it('should open a modal and add it to the stack', () => {
        const { result } = renderHook(() => useModalStore());

        act(() => {
            result.current.openModal(ModalType.ExportCSV, { customProp: 'value' });
        });

        expect(result.current.modals).toHaveLength(1);
        const topModal = result.current.getTopModal();
        expect(topModal?.type).toBe(ModalType.ExportCSV);
        expect(topModal?.props).toEqual({ customProp: 'value' });
        expect(result.current.isModalOpen(ModalType.ExportCSV)).toBe(true);
    });

    it('should close the top modal when closeModal is called without an id', () => {
        const { result } = renderHook(() => useModalStore());

        // Open two modals
        act(() => {
            result.current.openModal(ModalType.ExportCSV);
            result.current.openModal(ModalType.Print);
        });

        expect(result.current.modals).toHaveLength(2);

        // Close the top one (Print)
        act(() => {
            result.current.closeModal();
        });

        expect(result.current.modals).toHaveLength(1);
        expect(result.current.getTopModal()?.type).toBe(ModalType.ExportCSV);
    });
    
    it('should close all modals', () => {
        const { result } = renderHook(() => useModalStore());

        act(() => {
            result.current.openModal(ModalType.ExportCSV);
            result.current.openModal(ModalType.Print);
        });

        expect(result.current.modals).toHaveLength(2);

        act(() => {
            result.current.closeAllModals();
        });

        expect(result.current.modals).toHaveLength(0);
        expect(result.current.hasOpenModals()).toBe(false);
    });

    it('should correctly map a legacy modal type to the new one', () => {
        const { result } = renderHook(() => useModalStore());
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        // Open a legacy "Find" modal
        act(() => {
            result.current.openModal('Find' as any, { additionalProp: 'test' });
        });

        expect(result.current.modals).toHaveLength(1);
        const topModal = result.current.getTopModal();
        
        // It should be mapped to FindAndReplace
        expect(topModal?.type).toBe(ModalType.FindAndReplace);
        // It should have the default prop from the mapping and the new prop
        expect(topModal?.props).toEqual({
            initialTab: FindReplaceMode.FIND,
            additionalProp: 'test'
        });

        // Check if a warning was logged
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'Modal type "Find" is deprecated. Use "FindAndReplace" instead.'
        );
        
        consoleWarnSpy.mockRestore();
    });
}); 