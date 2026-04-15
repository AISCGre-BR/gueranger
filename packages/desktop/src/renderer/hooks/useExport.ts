import { useState, useCallback, useRef } from "react";

export interface ExportParams {
  rows: Record<string, string>[];
  columns: string[];
  columnLabels: string[];
  sheetName: string;
  defaultFileName: string;
}

type ExportStatus = "idle" | "exporting" | "success" | "error";

interface ExportState {
  status: ExportStatus;
  filePath: string | null;
  errorMessage: string | null;
}

export function useExport() {
  const [state, setState] = useState<ExportState>({
    status: "idle",
    filePath: null,
    errorMessage: null,
  });
  const lastParamsRef = useRef<ExportParams | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exportToExcel = useCallback(async (params: ExportParams) => {
    lastParamsRef.current = params;
    setState({ status: "exporting", filePath: null, errorMessage: null });

    try {
      const result = await window.gueranger.exportToExcel(params);
      if (result.canceled) {
        setState({ status: "idle", filePath: null, errorMessage: null });
        return;
      }
      setState({ status: "success", filePath: result.filePath, errorMessage: null });
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      autoDismissRef.current = setTimeout(() => {
        setState({ status: "idle", filePath: null, errorMessage: null });
      }, 8000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "error", filePath: null, errorMessage: message });
    }
  }, []);

  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      exportToExcel(lastParamsRef.current);
    }
  }, [exportToExcel]);

  const dismiss = useCallback(() => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    setState({ status: "idle", filePath: null, errorMessage: null });
  }, []);

  return { ...state, exportToExcel, retry, dismiss };
}
