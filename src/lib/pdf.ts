import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  size: number;
}

/**
 * Reads a PDF and rebuilds its text line by line.
 * Wide horizontal gaps (like table columns) become tabs, so a
 * two-column vocab table turns into "word<TAB>definition" lines.
 */
export async function extractPdfLines(file: File): Promise<string[]> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const lines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items: TextItem[] = [];
    for (const raw of content.items) {
      if (!("str" in raw) || !raw.str) continue;
      const [a, b, , , x, y] = raw.transform as number[];
      items.push({ str: raw.str, x, y, width: raw.width, size: Math.hypot(a, b) || 10 });
    }

    // Group items into rows by their baseline (top of page first).
    items.sort((m, n) => n.y - m.y || m.x - n.x);
    const rows: TextItem[][] = [];
    for (const item of items) {
      const row = rows[rows.length - 1];
      if (row && Math.abs(row[0].y - item.y) <= Math.max(2, item.size * 0.35)) row.push(item);
      else rows.push([item]);
    }

    const built: Row[] = rows.map(buildRow).filter((r) => r.text);
    lines.push(...mergeWrappedCells(built).map((r) => r.text));
    page.cleanup();
  }
  await doc.destroy();
  return lines;
}

interface Row {
  text: string;
  y: number;
  x: number;
  /** Where the second column starts, if this row has one. */
  colX?: number;
  size: number;
}

function buildRow(row: TextItem[]): Row {
  row.sort((m, n) => m.x - n.x);
  let text = "";
  let end = -Infinity;
  let colX: number | undefined;
  for (const item of row) {
    // Whitespace items often stretch across a column gap; don't let them hide it.
    if (!item.str.trim()) {
      if (text && !/\s$/.test(text)) text += " ";
      continue;
    }
    const gap = item.x - end;
    if (text) {
      if (gap > Math.max(18, item.size * 2)) {
        text = text.trimEnd() + "\t";
        colX ??= item.x;
      }
      else if (gap > item.size * 0.15 && !/\s$/.test(text) && !/^\s/.test(item.str)) text += " ";
    }
    text += item.str;
    end = item.x + item.width;
  }
  const clean = text.replace(/[ \u00a0]+/g, " ").replace(/ *\t+ */g, "\t").trim();
  const first = row.find((i) => i.str.trim()) ?? row[0];
  return { text: clean, y: row[0].y, x: first.x, colX, size: first.size };
}

/**
 * In tables, a long definition wraps onto extra lines that have nothing in the
 * word column. Attach each such line to the closest table row above or below it
 * (cells can be top- or bottom-aligned), so the definition stays in one piece.
 */
function mergeWrappedCells(rows: Row[]): Row[] {
  const tabbed = rows.filter((r) => r.text.includes("\t"));
  if (tabbed.length < 2) return rows;
  const counts = new Map<number, number>();
  for (const r of tabbed) if (r.colX !== undefined) counts.set(Math.round(r.colX), (counts.get(Math.round(r.colX)) ?? 0) + 1);
  const colX = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (colX === undefined) return rows;

  // A wrapped line starts where the meaning column starts.
  const isOrphan = (r: Row) => !r.text.includes("\t") && Math.abs(r.x - colX) <= Math.max(6, r.size);
  const out = rows.map((r) => ({ ...r, before: [] as string[], after: [] as string[] }));
  const keep = out.map(() => true);

  for (let i = 0; i < out.length; i++) {
    if (!isOrphan(out[i])) continue;
    // Treat a run of wrapped lines as one block so it isn't split between rows.
    let end = i;
    while (end + 1 < out.length && isOrphan(out[end + 1])) end++;
    const up = i - 1;
    const down = end + 1;
    const upOk = up >= 0 && out[up].text.includes("\t");
    const downOk = down < out.length && out[down].text.includes("\t");
    if (upOk || downOk) {
      const dUp = upOk ? out[up].y - out[i].y : Infinity;
      const dDown = downOk ? out[end].y - out[down].y : Infinity;
      const texts = out.slice(i, end + 1).map((r) => r.text);
      if (dUp <= dDown) out[up].after.push(...texts);
      else out[down].before.push(...texts);
      for (let k = i; k <= end; k++) keep[k] = false;
    }
    i = end;
  }

  return out
    .filter((_, i) => keep[i])
    .map((r) => {
      if (!r.before.length && !r.after.length) return r;
      const tab = r.text.indexOf("\t");
      const term = r.text.slice(0, tab);
      const def = [...r.before, r.text.slice(tab + 1), ...r.after].join(" ");
      return { ...r, text: `${term}\t${def}` };
    });
}

export async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
