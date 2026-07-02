import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExcelColumn<T> {
  header: string;
  key: keyof T;
  /**
   * Optional transform applied to the raw cell value before writing.
   * Return the formatted value (string | number).
   */
  transform?: (value: any, row: T) => string | number;
  /** Column width in characters (default: 18) */
  width?: number;
}

export interface ExcelExportOptions<T> {
  /** Sheet / tab name inside the workbook */
  sheetName?: string;
  /** Name of the downloaded file (without extension) */
  fileName: string;
  /** Column definitions – order determines column order */
  columns: ExcelColumn<T>[];
  /** The data rows to export */
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  /**
   * Builds an .xlsx workbook from `options` and triggers a browser download.
   * Throws on error so the caller can surface it.
   */
  exportToExcel<T>(options: ExcelExportOptions<T>): void {
    const { sheetName = 'Sheet1', fileName, columns, data } = options;

    // ── 1. Build header row ──────────────────────────────────────────────────
    const headerRow = columns.map((col) => col.header);

    // ── 2. Build data rows ───────────────────────────────────────────────────
    const dataRows = data.map((row) =>
      columns.map((col) => {
        const rawValue = row[col.key];
        return col.transform ? col.transform(rawValue, row) : (rawValue ?? '');
      })
    );

    // ── 3. Assemble worksheet ────────────────────────────────────────────────
    const wsData = [headerRow, ...dataRows];
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(wsData);

    // ── 4. Column widths ─────────────────────────────────────────────────────
    ws['!cols'] = columns.map((col) => ({ wch: col.width ?? 18 }));

    // ── 5. Style header row (bold + blue bg) — xlsx-js-style not required;
    //       plain xlsx supports limited cell meta via !ref ────────────────────
    this.styleHeaderRow(ws, columns.length);

    // ── 6. Create workbook & write ────────────────────────────────────────────
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, `${fileName}.xlsx`);
  }

  /**
   * Applies bold font to every cell in the first row via the `!rows` metadata.
   * Full colour styling requires a separate library (xlsx-js-style); this keeps
   * the dependency footprint minimal while still differentiating the header.
   */
  private styleHeaderRow(ws: XLSX.WorkSheet, colCount: number): void {
    for (let c = 0; c < colCount; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[cellAddr]) continue;
      ws[cellAddr].s = { font: { bold: true } };
    }
  }
}
