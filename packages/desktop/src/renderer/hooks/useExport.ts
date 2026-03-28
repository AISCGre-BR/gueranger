import { useState, useCallback, useRef } from "react";

export interface ExportParams {
  rows: Record<string, string>[];
  columns: string[];
  sheetName: string;
  existingSpreadsheetId?: string;
  appendOrNewTab?: "append" | "newTab";
}

type ExportStatus = "idle" | "exporting" | "success" | "error";

interface ExportState {
  status: ExportStatus;
  url: string | null;
  errorMessage: string | null;
}

export function useExport() {
  const [state, setState] = useState<ExportState>({
    status: "idle",
    url: null,
    errorMessage: null,
  });
  const lastParamsRef = useRef<ExportParams | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exportToSheets = useCallback(async (params: ExportParams) => {
    lastParamsRef.current = params;
    setState({ status: "exporting", url: null, errorMessage: null });

    try {
      const result = await window.gueranger.exportToSheets(params);
      setState({ status: "success", url: result.url, errorMessage: null });
      // Auto-dismiss after 8 seconds
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      autoDismissRef.current = setTimeout(() => {
        setState({ status: "idle", url: null, errorMessage: null });
      }, 8000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "error", url: null, errorMessage: message });
    }
  }, []);

  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      exportToSheets(lastParamsRef.current);
    }
  }, [exportToSheets]);

  const dismiss = useCallback(() => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    setState({ status: "idle", url: null, errorMessage: null });
  }, []);

  return { ...state, exportToSheets, retry, dismiss };
}
