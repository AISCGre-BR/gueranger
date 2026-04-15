import ExcelJS from "exceljs";
import { dialog, BrowserWindow, shell } from "electron";
import { join } from "node:path";
import { homedir } from "node:os";

export interface ExcelExportParams {
  rows: Record<string, string>[];
  columns: string[];
  columnLabels: string[];
  sheetName: string;
  defaultFileName: string;
}

export interface ExcelExportResult {
  filePath: string;
  canceled: boolean;
}

export async function exportToExcel(
  params: ExcelExportParams,
  parentWindow?: BrowserWindow,
): Promise<ExcelExportResult> {
  const suggestedPath = join(homedir(), `${params.defaultFileName}.xlsx`);

  const saveRes = await dialog.showSaveDialog(
    parentWindow ?? BrowserWindow.getFocusedWindow() ?? new BrowserWindow({ show: false }),
    {
      title: "Save spreadsheet",
      defaultPath: suggestedPath,
      filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }],
    },
  );

  if (saveRes.canceled || !saveRes.filePath) {
    return { filePath: "", canceled: true };
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Gueranger";
  workbook.created = new Date();

  const safeName = params.sheetName.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Results";
  const sheet = workbook.addWorksheet(safeName);

  sheet.columns = params.columns.map((key, i) => ({
    header: params.columnLabels[i] ?? key,
    key,
    width: Math.max(12, (params.columnLabels[i] ?? key).length + 4),
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const row of params.rows) {
    const record: Record<string, string> = {};
    for (const key of params.columns) {
      record[key] = row[key] ?? "";
    }
    sheet.addRow(record);
  }

  await workbook.xlsx.writeFile(saveRes.filePath);

  return { filePath: saveRes.filePath, canceled: false };
}

export function revealInFolder(filePath: string): void {
  shell.showItemInFolder(filePath);
}

export function openFile(filePath: string): Promise<string> {
  return shell.openPath(filePath);
}
