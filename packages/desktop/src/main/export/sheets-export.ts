import { sheets_v4 } from "@googleapis/sheets";
import { drive_v3 } from "@googleapis/drive";
import type { OAuth2Client } from "google-auth-library";

export async function exportToNewSheet(
  auth: OAuth2Client,
  title: string,
  headers: string[],
  rows: string[][],
): Promise<string> {
  const sheetsApi = new sheets_v4.Sheets({ auth });

  const createRes = await sheetsApi.spreadsheets.create({
    requestBody: {
      properties: { title },
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId!;
  const sheetId = createRes.data.sheets![0].properties!.sheetId!;

  await sheetsApi.spreadsheets.values.update({
    spreadsheetId,
    range: "Sheet1!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [headers, ...rows],
    },
  });

  await sheetsApi.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
              },
            },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
        {
          updateSheetProperties: {
            properties: {
              sheetId,
              gridProperties: { frozenRowCount: 1 },
            },
            fields: "gridProperties.frozenRowCount",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId,
              dimension: "COLUMNS",
              startIndex: 0,
              endIndex: headers.length,
            },
          },
        },
      ],
    },
  });

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

export async function exportToExistingSheet(
  auth: OAuth2Client,
  spreadsheetId: string,
  mode: "append" | "newTab",
  tabName: string,
  headers: string[],
  rows: string[][],
): Promise<string> {
  const sheetsApi = new sheets_v4.Sheets({ auth });

  if (mode === "newTab") {
    const addRes = await sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: tabName },
            },
          },
        ],
      },
    });

    const newSheetId =
      addRes.data.replies![0].addSheet!.properties!.sheetId!;

    await sheetsApi.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers, ...rows],
      },
    });

    await sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: newSheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true },
                },
              },
              fields: "userEnteredFormat.textFormat.bold",
            },
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId: newSheetId,
                gridProperties: { frozenRowCount: 1 },
              },
              fields: "gridProperties.frozenRowCount",
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: newSheetId,
                dimension: "COLUMNS",
                startIndex: 0,
                endIndex: headers.length,
              },
            },
          },
        ],
      },
    });
  } else {
    // mode === "append"
    await sheetsApi.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: rows,
      },
    });
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

export async function listRecentSpreadsheets(
  auth: OAuth2Client,
): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  const driveApi = new drive_v3.Drive({ auth });

  const res = await driveApi.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet'",
    orderBy: "modifiedTime desc",
    pageSize: 20,
    fields: "files(id, name, modifiedTime)",
  });

  return (res.data.files ?? []).map((f) => ({
    id: f.id!,
    name: f.name!,
    modifiedTime: f.modifiedTime!,
  }));
}
