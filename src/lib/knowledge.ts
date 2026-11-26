import "server-only";

export const MAX_FILE_BYTES = 3 * 1024 * 1024; // keeps uploads inside serverless request limits

export function chunkText(text: string, size = 900, overlap = 120): string[] {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const paragraphs = clean.split(/\n\n+/);
  const chunks: string[] = [];
  let cur = "";
  const push = () => { if (cur.trim()) chunks.push(cur.trim()); cur = ""; };
  for (const p of paragraphs) {
    if (p.length > size) {
      push();
      for (let i = 0; i < p.length; i += size - overlap) chunks.push(p.slice(i, i + size).trim());
    } else if ((cur + "\n\n" + p).length > size) {
      push();
      cur = p;
    } else {
      cur = cur ? cur + "\n\n" + p : p;
    }
  }
  push();
  return chunks.filter(Boolean);
}

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await pdfText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n\n") : text;
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value;
  }
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv") || name.endsWith(".json") || file.type.startsWith("text/")) {
    const text = buf.toString("utf8");
    if (name.endsWith(".csv")) return csvToText(text);
    return text;
  }
  throw new Error("Unsupported file type. Upload PDF, DOCX, TXT, MD, CSV or JSON.");
}

/** Turns each CSV row into a readable "header: value" line so retrieval keeps column meaning. */
function csvToText(csv: string): string {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (q) {
      if (c === '"' && csv[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  if (!head) return "";
  return body.map((r) => head.map((h, i) => `${h.trim()}: ${(r[i] ?? "").trim()}`).join("; ")).join("\n\n");
}
