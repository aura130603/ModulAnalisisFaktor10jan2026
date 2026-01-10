// hooks/useModal.ts

import { useModalStore, ModalProps } from '@/stores/useModalStore';
import { ModalType } from '@/types/modalTypes';

// Re-export the ModalType for convenience
export { ModalType };

/**
 * OpenModalOptions - Opsi tambahan saat membuka modal
 * 
 * Dapat digunakan untuk mengatur perilaku modal seperti
 * memaksa tipe container tertentu.
 */
export interface OpenModalOptions {
  containerOverride?: "dialog" | "sidebar" | "auto";
  allowStacking?: boolean; // Mengizinkan modal untuk di-stack, default false (tidak di-stack)
  [key: string]: any;
}

/**
 * useModal - Hook untuk mengakses dan mengelola modal dalam aplikasi
 * 
 * Hook ini menyediakan interface yang simpel dan type-safe untuk:
 * 1. Mengakses state modal (daftar modal aktif, modal teratas, dll)
 * 2. Melakukan aksi pada modal (membuka, menutup, mengganti)
 * 3. Mendapatkan informasi tentang status modal
 * 
 * @returns Object berisi state modal dan fungsi-fungsi untuk memanipulasinya
 */
export const useModal = () => {
    // Akses state dan aksi dasar dari store
    const modals = useModalStore(state => state.modals);
    const openModalBase = useModalStore(state => state.openModal);
    const closeModal = useModalStore(state => state.closeModal);
    const closeAllModals = useModalStore(state => state.closeAllModals);
    
    // Aksi tambahan dari store
    const hasOpenModals = useModalStore(state => state.hasOpenModals);
    const getTopModal = useModalStore(state => state.getTopModal);
    const isModalOpen = useModalStore(state => state.isModalOpen);
    const closeModalsByType = useModalStore(state => state.closeModalsByType);
    const replaceModal = useModalStore(state => state.replaceModal);
    
    // Informasi tentang modal teratas (jika ada)
    const currentModalType = modals.length > 0 ? modals[modals.length - 1].type : null;
    const currentModalId = modals.length > 0 ? modals[modals.length - 1].id : null;

    // Enhanced openModal function that supports options
    const openModal = (type: ModalType, propsOrOptions?: ModalProps | OpenModalOptions) => {
        // Ekstrak opsi stacking jika ada
        const allowStacking = propsOrOptions && 'allowStacking' in propsOrOptions 
            ? propsOrOptions.allowStacking 
            : false;

        // Jika stacking tidak diizinkan dan ada modal yang sudah terbuka, tutup dulu modal yang ada
        if (!allowStacking && hasOpenModals()) {
            closeAllModals();
        }
        
        openModalBase(type, propsOrOptions);
    };

    return { 
        // State
        modals,
        currentModalType,
        currentModalId,
        
        // Aksi dasar
        openModal,
        closeModal,
        closeAllModals,
        
        // Aksi tambahan
        hasOpenModals,
        getTopModal,
        isModalOpen,
        closeModalsByType,
        replaceModal
    };
};
