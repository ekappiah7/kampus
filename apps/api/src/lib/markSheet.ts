import ExcelJS from "exceljs";

/**
 * The Excel mark sheet: download a class's grid, fill it in offline, upload it back.
 *
 * Most teachers here mark at home, on a laptop with no reliable internet, and they
 * already live in Excel. Forcing them to type a term of scores into a web grid is
 * how a system stops being used. So the portal hands them the file they'd have made
 * themselves, pre-filled with their own pupils and their own assessment columns.
 *
 * The file carries a hidden `_kampus` sheet recording exactly which school, class,
 * subject and term it came from, and the pupil id behind every row. On upload that
 * metadata does the matching, so a file can't be pointed at the wrong subject and
 * a pupil renamed in between still lands on the right row. When the sheet is absent
 * — the teacher rebuilt the file, or exported CSV from Google Sheets — the importer
 * falls back to matching on names, and says so.
 */

/** Bumped when the sheet layout changes in a way the importer must know about. */
const FORMAT_VERSION = 1;

const META_SHEET = "_kampus";
const DATA_SHEET = "Scores";

/** Row of the header band in the Scores sheet; pupils start on the next row. */
const HEADER_ROW = 7;
const FIRST_DATA_ROW = HEADER_ROW + 1;

/** Columns before the score columns begin. */
const COL_NUMBER = 1;
const COL_NAME = 2;
const FIRST_SCORE_COL = 3;

const BRAND = "FFFFC629";
const DARK = "FF2A2C30";

export interface SheetComponent {
  key: string;
  label: string;
  type: string;
  maxScore: number;
  weightPct: number;
}

export interface SheetPupil {
  studentId: string;
  name: string;
  scores: Record<string, number | null>;
}

export interface SheetContext {
  schoolName: string;
  schoolId: string;
  className: string;
  classId: string;
  subjectName: string;
  subjectId: string;
  termName: string;
  academicYear: string;
  termId: string;
  teacherName: string;
}

function prettyType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

export async function buildMarkSheet(ctx: SheetContext, components: SheetComponent[], pupils: SheetPupil[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = ctx.schoolName;
  wb.created = new Date();

  const ws = wb.addWorksheet(DATA_SHEET, {
    views: [{ state: "frozen", xSplit: COL_NAME, ySplit: HEADER_ROW }],
  });

  // --- title band ----------------------------------------------------------
  const lastCol = Math.max(FIRST_SCORE_COL + components.length, FIRST_SCORE_COL + 1);
  ws.mergeCells(1, 1, 1, lastCol);
  const title = ws.getCell(1, 1);
  title.value = ctx.schoolName;
  title.font = { name: "Calibri", size: 16, bold: true, color: { argb: DARK } };
  title.alignment = { horizontal: "center" };

  ws.mergeCells(2, 1, 2, lastCol);
  const sub = ws.getCell(2, 1);
  sub.value = `${ctx.className}  ·  ${ctx.subjectName}  ·  ${ctx.termName} ${ctx.academicYear}`;
  sub.font = { size: 12, bold: true };
  sub.alignment = { horizontal: "center" };

  ws.mergeCells(3, 1, 3, lastCol);
  const who = ws.getCell(3, 1);
  who.value = `Teacher: ${ctx.teacherName}    Generated: ${new Date().toLocaleDateString("en-GB")}`;
  who.font = { size: 10, color: { argb: "FF6B6F76" } };
  who.alignment = { horizontal: "center" };

  ws.mergeCells(5, 1, 5, lastCol);
  const help = ws.getCell(5, 1);
  help.value =
    components.length > 0
      ? "Type scores in the shaded columns only. Leave a cell blank to keep the score already in the portal. Do not add, remove or reorder pupils."
      : "This subject has no assessments yet. Add them in the portal (Grades → + Assessment), then download this sheet again.";
  help.font = { size: 10, italic: true, color: { argb: "FF8A6200" } };
  help.alignment = { horizontal: "center", wrapText: true };
  ws.getRow(5).height = 26;

  // --- header row ----------------------------------------------------------
  const header = ws.getRow(HEADER_ROW);
  header.getCell(COL_NUMBER).value = "#";
  header.getCell(COL_NAME).value = "Pupil name";
  components.forEach((c, i) => {
    // The weight is on the header so a teacher can see at a glance what each
    // column is worth without going back to the portal.
    header.getCell(FIRST_SCORE_COL + i).value = `${c.label}\n${prettyType(c.type)} · out of ${c.maxScore} · ${c.weightPct}%`;
  });
  header.height = 46;
  header.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: DARK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "thin" }, top: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });

  ws.getColumn(COL_NUMBER).width = 5;
  ws.getColumn(COL_NAME).width = 30;
  components.forEach((_, i) => (ws.getColumn(FIRST_SCORE_COL + i).width = 16));

  // --- pupil rows ----------------------------------------------------------
  pupils.forEach((p, rowIdx) => {
    const row = ws.getRow(FIRST_DATA_ROW + rowIdx);
    row.getCell(COL_NUMBER).value = rowIdx + 1;
    row.getCell(COL_NUMBER).alignment = { horizontal: "center" };
    row.getCell(COL_NAME).value = p.name;
    row.getCell(COL_NAME).font = { bold: true, size: 11 };

    components.forEach((c, i) => {
      const cell = row.getCell(FIRST_SCORE_COL + i);
      const existing = p.scores[c.key];
      // A zero here means "column created, not yet marked" — showing it as 0 would
      // read as a real mark of nought, so those cells are left empty.
      if (existing !== null && existing !== undefined && existing > 0) cell.value = existing;
      cell.numFmt = "0.##";
      cell.alignment = { horizontal: "center" };
      cell.protection = { locked: false };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEC" } };
      cell.border = { bottom: { style: "hair" }, left: { style: "hair" }, right: { style: "hair" } };
      cell.dataValidation = {
        type: "decimal",
        operator: "between",
        allowBlank: true,
        formulae: [0, c.maxScore],
        showErrorMessage: true,
        errorStyle: "error",
        errorTitle: "Score out of range",
        error: `${c.label} is marked out of ${c.maxScore}. Enter a number between 0 and ${c.maxScore}.`,
      };
    });

    if (rowIdx % 2 === 1) {
      row.getCell(COL_NUMBER).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F6F3" } };
      row.getCell(COL_NAME).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F6F3" } };
    }
  });

  // Locking the identity columns is a guardrail against accidental edits, not
  // security — there is no password, and the importer re-checks everything anyway.
  await ws.protect("", { selectLockedCells: true, selectUnlockedCells: true, formatColumns: true });

  // --- hidden metadata -----------------------------------------------------
  const meta = wb.addWorksheet(META_SHEET);
  meta.state = "veryHidden";
  meta.addRow(["kampus mark sheet — do not edit or delete this sheet"]);
  meta.addRow(["version", FORMAT_VERSION]);
  meta.addRow(["schoolId", ctx.schoolId]);
  meta.addRow(["classId", ctx.classId]);
  meta.addRow(["subjectId", ctx.subjectId]);
  meta.addRow(["termId", ctx.termId]);
  meta.addRow(["firstDataRow", FIRST_DATA_ROW]);
  meta.addRow([]);
  meta.addRow(["column", "componentKey", "maxScore"]);
  components.forEach((c, i) => meta.addRow([FIRST_SCORE_COL + i, c.key, c.maxScore]));
  meta.addRow([]);
  meta.addRow(["row", "studentId"]);
  pupils.forEach((p, i) => meta.addRow([FIRST_DATA_ROW + i, p.studentId]));

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}

export function markSheetFilename(ctx: SheetContext): string {
  const safe = (v: string) => v.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${safe(ctx.className)}-${safe(ctx.subjectName)}-${safe(ctx.termName)}-marks.xlsx`;
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export interface ParsedMeta {
  version: number;
  schoolId: string;
  classId: string;
  subjectId: string;
  termId: string;
  firstDataRow: number;
  columns: { column: number; componentKey: string; maxScore: number }[];
  rows: { row: number; studentId: string }[];
}

export interface ParsedScore {
  studentId: string | null;
  /** What the file said, used to report unmatched rows back to the teacher. */
  rowLabel: string;
  componentKey: string | null;
  columnLabel: string;
  score: number;
}

export interface ParseResult {
  meta: ParsedMeta | null;
  scores: ParsedScore[];
  /** Structural problems worth telling the teacher about before anything is written. */
  problems: string[];
}

function cellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return "";
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "richText" in v) return v.richText.map((t) => t.text).join("");
  if (typeof v === "object" && "text" in v) return String((v as { text: unknown }).text);
  if (typeof v === "object" && "result" in v) return String((v as { result: unknown }).result ?? "");
  return String(v);
}

function cellNumber(cell: ExcelJS.Cell | undefined): number | null {
  if (!cell) return null;
  const v = cell.value;
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && "result" in v) {
    const r = (v as { result: unknown }).result;
    return typeof r === "number" ? r : null;
  }
  const text = cellText(cell).trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function readMeta(wb: ExcelJS.Workbook): ParsedMeta | null {
  const ws = wb.getWorksheet(META_SHEET);
  if (!ws) return null;

  const flat = new Map<string, string>();
  const columns: ParsedMeta["columns"] = [];
  const rows: ParsedMeta["rows"] = [];
  let section: "head" | "columns" | "rows" = "head";

  ws.eachRow((row) => {
    const a = cellText(row.getCell(1)).trim();
    const b = cellText(row.getCell(2)).trim();
    const c = cellText(row.getCell(3)).trim();
    if (a === "column" && b === "componentKey") return void (section = "columns");
    if (a === "row" && b === "studentId") return void (section = "rows");
    if (!a) return;
    if (section === "columns" && /^\d+$/.test(a)) columns.push({ column: Number(a), componentKey: b, maxScore: Number(c) || 100 });
    else if (section === "rows" && /^\d+$/.test(a)) rows.push({ row: Number(a), studentId: b });
    else if (b) flat.set(a, b);
  });

  if (!flat.get("subjectId")) return null;
  return {
    version: Number(flat.get("version") ?? 0),
    schoolId: flat.get("schoolId") ?? "",
    classId: flat.get("classId") ?? "",
    subjectId: flat.get("subjectId") ?? "",
    termId: flat.get("termId") ?? "",
    firstDataRow: Number(flat.get("firstDataRow") ?? FIRST_DATA_ROW),
    columns,
    rows,
  };
}

/** Normalises a pupil name for fallback matching: case, punctuation and spacing. */
export function nameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(mr|mrs|miss|ms|master)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Reads an uploaded mark sheet.
 *
 * Nothing here touches the database — it returns what the file says, and the caller
 * decides what is valid. That separation is what makes a dry run possible.
 */
export async function parseMarkSheet(buffer: Buffer, filename: string): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  const problems: string[] = [];

  if (/\.csv$/i.test(filename)) {
    // A CSV has lost the metadata sheet, so this always falls back to name matching.
    const { Readable } = await import("node:stream");
    await wb.csv.read(Readable.from(buffer.toString("utf8")));
  } else {
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  }

  const meta = readMeta(wb);
  const ws = wb.getWorksheet(DATA_SHEET) ?? wb.worksheets.find((w) => w.name !== META_SHEET) ?? wb.worksheets[0];
  if (!ws) return { meta, scores: [], problems: ["That file has no readable sheet in it."] };

  const scores: ParsedScore[] = [];

  if (meta && meta.columns.length && meta.rows.length) {
    // Trusted path: the file came from us, so ids do the matching.
    const rowById = new Map(meta.rows.map((r) => [r.row, r.studentId]));
    for (const [rowNo, studentId] of rowById) {
      const row = ws.getRow(rowNo);
      const rowLabel = cellText(row.getCell(COL_NAME)).trim() || `row ${rowNo}`;
      for (const col of meta.columns) {
        const value = cellNumber(row.getCell(col.column));
        if (value === null) continue;
        scores.push({ studentId, rowLabel, componentKey: col.componentKey, columnLabel: col.componentKey.split("::").slice(1).join("::"), score: value });
      }
    }
    return { meta, scores, problems };
  }

  // Fallback: match on the header text and the pupil name column.
  problems.push(
    "This file no longer carries the hidden sheet that identifies it, so pupils were matched by name. Check the summary below before saving.",
  );

  let headerRow = -1;
  for (let r = 1; r <= Math.min(ws.rowCount, 30); r++) {
    const cells = ws.getRow(r);
    for (let c = 1; c <= 4; c++) {
      if (/pupil\s*name|student\s*name|^name$/i.test(cellText(cells.getCell(c)).trim())) {
        headerRow = r;
        break;
      }
    }
    if (headerRow > 0) break;
  }
  if (headerRow < 0) {
    return { meta, scores: [], problems: [...problems, 'No "Pupil name" column found. Download a fresh template and fill that in instead.'] };
  }

  const nameCol = (() => {
    for (let c = 1; c <= 6; c++) {
      if (/pupil\s*name|student\s*name|^name$/i.test(cellText(ws.getRow(headerRow).getCell(c)).trim())) return c;
    }
    return COL_NAME;
  })();

  const headers: { col: number; label: string }[] = [];
  const hdr = ws.getRow(headerRow);
  for (let c = nameCol + 1; c <= ws.columnCount; c++) {
    const label = cellText(hdr.getCell(c)).split("\n")[0]?.trim() ?? "";
    if (label) headers.push({ col: c, label });
  }

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const name = cellText(row.getCell(nameCol)).trim();
    if (!name) continue;
    for (const h of headers) {
      const value = cellNumber(row.getCell(h.col));
      if (value === null) continue;
      scores.push({ studentId: null, rowLabel: name, componentKey: null, columnLabel: h.label, score: value });
    }
  }

  return { meta, scores, problems };
}
