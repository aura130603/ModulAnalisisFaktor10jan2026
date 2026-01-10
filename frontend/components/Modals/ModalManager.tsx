"use client";

import React, { useEffect } from "react";
import { useModal } from "@/hooks/useModal";
import ModalRenderer from "./ModalRenderer";
import { ModalType } from "@/types/modalTypes";
import { useOnborda } from "onborda";

interface ModalManagerProps {
  // Optional callback to filter or customize which modals to display
  // Useful for different views that need special modal handling
  customFilter?: (modalId: string) => boolean;
  
  // Optional custom container type
  containerType?: "dialog" | "sidebar";
}

/**
 * ModalManager - Pengelola tampilan modal dalam aplikasi
 * 
 * Komponen ini bertanggung jawab untuk:
 * 1. Mengambil daftar modal aktif dari store
 * 2. Memfilter modal yang akan ditampilkan (opsional)
 * 3. Merender setiap modal dengan ModalRenderer
 * 4. Mengelola product tour untuk modal yang dibuka
 * 
 * Digunakan di layout dashboard untuk menampilkan modal dengan berbagai jenis
 * tampilan (dialog/sidebar) sesuai kebutuhan.
 */
const ModalManager: React.FC<ModalManagerProps> = ({ 
  customFilter,
  containerType = "dialog"
}) => {
  const { modals, closeModal } = useModal();
  const { closeOnborda } = useOnborda();
  
  // Filter modals if a custom filter is provided
  const visibleModals = customFilter 
    ? modals.filter(modal => customFilter(modal.id))
    : modals;
  
  // Clean up product tour when modals change or close
  useEffect(() => {
    return () => {
      // Close any active tour when the modal is closed
      closeOnborda();
    };
  }, [closeOnborda]);
  
  if (visibleModals.length === 0) return null;
  
  return (
    <>
      {visibleModals.map((modal) => {
        return (
          <ModalRenderer
            key={modal.id}
            id={modal.id}
            modalType={modal.type}
            onClose={() => {
              // Close any active tour before closing the modal
              closeOnborda();
              closeModal(modal.id);
            }}
            containerType={containerType}
            {...modal.props}
          />
        );
      })}
    </>
  );
};

export default ModalManager; 