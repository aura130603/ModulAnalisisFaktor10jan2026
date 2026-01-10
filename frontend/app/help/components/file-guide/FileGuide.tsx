import React from 'react';
import { Upload, Download, Database } from 'lucide-react';
import StandardizedGuideLayout from '../statistics-guide/shared/StandardizedGuideLayout';
import { ImportTab } from './tabs/ImportTab';
import { ExportTab } from './tabs/ExportTab';
import { DataTab } from './tabs/DataTab';
import { QuickStartGuide } from './tabs/QuickStartGuide';
import {
  ImportSav,
  ImportCsv,
  ImportExcel,
  ImportClipboard,
  ExportCsv,
  ExportExcel,
  ExampleDataset,
  Print,
} from './index';

interface FileGuideProps {
  section?: string;
}

export const FileGuide: React.FC<FileGuideProps> = ({ section }) => {
  // If section is provided, render the specific component for backward compatibility
  if (section) {

    switch (section) {
      case "import-sav":
        return <ImportSav />;
      case "import-csv":
        return <ImportCsv />;
      case "import-excel":
        return <ImportExcel />;
      case "import-clipboard":
        return <ImportClipboard />;
      case "export-csv":
        return <ExportCsv />;
      case "export-excel":
        return <ExportExcel />;
      case "example-data":
        return <ExampleDataset />;
      case "print":
        return <Print />;
      default:
        return <ImportSav />;
    }
  }
  const tabs = [
    {
      id: 'import',
      label: 'Import Data',
      icon: Upload,
      component: ImportTab
    },
    {
      id: 'export',
      label: 'Export Data',
      icon: Download,
      component: ExportTab
    },
    {
      id: 'data',
      label: 'Kelola Data',
      icon: Database,
      component: DataTab
    }
  ];

  return (
    <StandardizedGuideLayout
      title="Panduan Manajemen File"
      description="Pelajari cara mengimpor, mengekspor, dan mengelola data dalam Statify"
      tabs={tabs}
      defaultTab="import"
    >
      <QuickStartGuide />
    </StandardizedGuideLayout>
  );
};

export default FileGuide;