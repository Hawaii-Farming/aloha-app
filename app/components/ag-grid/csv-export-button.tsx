import { useCallback } from 'react';

import type { GridApi } from 'ag-grid-community';
import { Download } from 'lucide-react';

import { Button } from '@aloha/ui/button';

interface CsvExportButtonProps {
  gridApi: GridApi | null;
  fileName?: string;
}

export function CsvExportButton({
  gridApi,
  fileName = 'export',
}: CsvExportButtonProps) {
  const handleExport = useCallback(() => {
    gridApi?.exportDataAsCsv({
      fileName: `${fileName}-${new Date().toISOString().split('T')[0]}.csv`,
    });
  }, [gridApi, fileName]);

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleExport}
      disabled={!gridApi}
      data-test="csv-export-button"
    >
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
