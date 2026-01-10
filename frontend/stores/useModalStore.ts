// stores/useModalStore.ts

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ModalType } from "@/types/modalTypes";
import { FindReplaceMode } from "@/components/Modals/Edit/FindReplace/types";
import { GoToMode } from "@/components/Modals/Edit/GoTo/types";

/**
 * ModalProps - Interface untuk props yang diteruskan ke modal
 *
 * Object dinamis yang dapat menampung berbagai jenis props
 * yang dibutuhkan oleh komponen modal.
 */
export interface ModalProps {
  [key: string]: any;
}

// Legacy modal types that are now handled by other modals
const LEGACY_MODAL_MAPPINGS: Record<
  string,
  { type: ModalType; props?: ModalProps }
> = {
  // Old Find modal now maps to FindAndReplace with Find tab
  Find: {
    type: ModalType.FindAndReplace,
    props: { initialTab: FindReplaceMode.FIND },
  },
  // Old Replace modal now maps to FindAndReplace with Replace tab
  Replace: {
    type: ModalType.FindAndReplace,
    props: { initialTab: FindReplaceMode.REPLACE },
  },
  // Old GoToCase modal now maps to GoTo with Case mode
  GoToCase: { type: ModalType.GoTo, props: { initialMode: GoToMode.CASE } },
  // Old GoToVariable modal now maps to GoTo with Variable mode
  GoToVariable: {
    type: ModalType.GoTo,
    props: { initialMode: GoToMode.VARIABLE },
  },
};

/**
 * ModalInstance - Representasi sebuah modal dalam store
 *
 * Berisi informasi lengkap tentang satu instance modal,
 * termasuk tipe, props, dan ID unik.
 */
export interface ModalInstance {
  type: ModalType;
  props?: ModalProps;
  id: string; // ID unik untuk mengidentifikasi instance spesifik
}

/**
 * ModalStoreState - Interface untuk state dan aksi pada modal store
 */
interface ModalStoreState {
  // State
  modals: ModalInstance[];
  isStatisticProgress: boolean;

  // Aksi dasar
  openModal: (type: ModalType, props?: ModalProps) => void;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;
  setStatisticProgress: (value: boolean) => void;

  // Aksi tambahan
  hasOpenModals: () => boolean;
  getTopModal: () => ModalInstance | undefined;
  isModalOpen: (type: ModalType) => boolean;
  closeModalsByType: (type: ModalType) => void;
  replaceModal: (type: ModalType, props?: ModalProps) => void;
}

/**
 * useModalStore - Store Zustand untuk manajemen modal
 *
 * Menyediakan state terpusat dan aksi untuk mengelola
 * tampilan dan state modal di seluruh aplikasi.
 */
export const useModalStore = create<ModalStoreState>()(
  devtools((set, get) => ({
    // State
    modals: [],
    isStatisticProgress: false,

    // Aksi dasar
    openModal: (type, props) => {
      // Check if this is a legacy modal type that needs to be mapped
      const legacyMapping = LEGACY_MODAL_MAPPINGS[type];
      if (legacyMapping) {
        console.warn(
          `Modal type "${type}" is deprecated. Use "${legacyMapping.type}" instead.`
        );
        // Merge any provided props with the legacy mapping props
        const mergedProps = { ...legacyMapping.props, ...props };
        // Use the mapped type and merged props
        type = legacyMapping.type;
        props = mergedProps;
      }

      // Buat ID unik untuk instance modal ini
      const modalInstance: ModalInstance = {
        type,
        props,
        id: `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      set((state) => ({ modals: [...state.modals, modalInstance] }));
    },

    closeModal: (id) => {
      // Jika ID disediakan, tutup modal spesifik tersebut
      // Jika tidak, tutup modal teratas
      if (id) {
        set((state) => ({
          modals: state.modals.filter((modal) => modal.id !== id),
        }));
      } else {
        set((state) => ({ modals: state.modals.slice(0, -1) }));
      }
    },

    closeAllModals: () => {
      set({ modals: [] });
    },

    setStatisticProgress: (value: boolean) => {
      set({ isStatisticProgress: value });
    },

    // Aksi tambahan
    hasOpenModals: () => {
      return get().modals.length > 0;
    },

    getTopModal: () => {
      const { modals } = get();
      return modals.length > 0 ? modals[modals.length - 1] : undefined;
    },

    isModalOpen: (type: ModalType) => {
      return get().modals.some((modal) => modal.type === type);
    },

    closeModalsByType: (type: ModalType) => {
      set((state) => ({
        modals: state.modals.filter((modal) => modal.type !== type),
      }));
    },

    replaceModal: (type: ModalType, props?: ModalProps) => {
      const { modals } = get();
      if (modals.length === 0) {
        get().openModal(type, props);
        return;
      }

      // Pertahankan ID yang sama untuk kontinuitas
      const currentId = modals[modals.length - 1].id;

      set((state) => ({
        modals: [...state.modals.slice(0, -1), { type, props, id: currentId }],
      }));
    },
  }))
);
