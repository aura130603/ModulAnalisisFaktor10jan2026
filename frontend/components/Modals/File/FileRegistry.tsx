import React, { lazy, Suspense } from 'react';
import type { BaseModalProps } from '@/types/modalTypes';
import { ModalType } from '@/types/modalTypes';

// Import file modals directly - prioritize commonly used modals
import { ImportCsv } from '@/components/Modals/File/ImportCsv';
import { ImportExcelModal } from '@/components/Modals/File/ImportExcel';
import { ImportClipboardModal } from '@/components/Modals/File/ImportClipboard';
import { OpenSavFileModal } from '@/components/Modals/File/OpenSavFile';
import { PrintModal } from '@/components/Modals/File/Print';
import { ExportCsv } from '@/components/Modals/File/ExportCsv';
import { ExportExcel } from '@/components/Modals/File/ExportExcel';
import { ExampleDatasetModal } from '@/components/Modals/File/ExampleDataset';

/**
 * LoadingModal - Displayed while modal components are loading
 */
const LoadingModal: React.FC<BaseModalProps> = ({ onClose }) => (
  <div className="p-6 text-center" data-testid="file-modal-loading">
    <div className="animate-pulse mx-auto h-8 w-8 rounded-full bg-primary/20 mb-4" data-testid="file-modal-loading-spinner" />
    <p className="text-sm text-muted-foreground" data-testid="file-modal-loading-text">Loading file modal...</p>
  </div>
);

/**
 * withSuspense - HOC for wrapping lazy-loaded components with Suspense
 */
function withSuspense(Component: React.ComponentType<BaseModalProps>): React.ComponentType<BaseModalProps> {
  const WrappedComponent = (props: BaseModalProps) => (
    <Suspense fallback={<LoadingModal onClose={props.onClose} />}>
      <Component {...props} />
    </Suspense>
  );
  
  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

/**
 * FILE_MODAL_COMPONENTS - Registry for file modal components
 * 
 * Maps each file-related ModalType to its corresponding React component
 */
export const FILE_MODAL_COMPONENTS: Record<string, React.ComponentType<BaseModalProps>> = {
  // Import/Export related
  [ModalType.ImportCSV]: ImportCsv as React.ComponentType<BaseModalProps>,
  [ModalType.ImportExcel]: ImportExcelModal as React.ComponentType<BaseModalProps>,
  [ModalType.ImportClipboard]: ImportClipboardModal as React.ComponentType<BaseModalProps>,
  [ModalType.ExportCSV]: ExportCsv as React.ComponentType<BaseModalProps>,
  [ModalType.ExportExcel]: ExportExcel as React.ComponentType<BaseModalProps>,
  
  // File operations
  [ModalType.OpenData]: OpenSavFileModal as React.ComponentType<BaseModalProps>,
  [ModalType.Print]: PrintModal as React.ComponentType<BaseModalProps>,
  [ModalType.ExampleDataset]: ExampleDatasetModal as React.ComponentType<BaseModalProps>,
};

/**
 * getFileModalComponent - Get a file modal component by type
 * 
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getFileModalComponent(type: ModalType): React.ComponentType<BaseModalProps> | null {
  const Component = FILE_MODAL_COMPONENTS[type];
  
  if (!Component) {
    console.warn(`No file modal component registered for type: ${type}`);
    return null;
  }
  
  return Component;
}

/**
 * FILE_MODAL_CONTAINER_PREFERENCES - Container preferences for file modals
 * 
 * Some modals work better in specific container types based on their complexity
 * and screen space requirements.
 */
export const FILE_MODAL_CONTAINER_PREFERENCES: Partial<Record<ModalType, "dialog" | "sidebar">> = {
  // Import/Export modals
  [ModalType.ImportCSV]: "sidebar",
  [ModalType.ImportExcel]: "sidebar", 
  [ModalType.ImportClipboard]: "sidebar",
  [ModalType.ExportCSV]: "sidebar",
  [ModalType.ExportExcel]: "sidebar",
  
  // File operation modals
  [ModalType.OpenData]: "sidebar",
  [ModalType.Print]: "sidebar",
  [ModalType.ExampleDataset]: "sidebar",
};