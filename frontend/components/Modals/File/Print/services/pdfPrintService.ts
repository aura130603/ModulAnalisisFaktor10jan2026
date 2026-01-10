import type { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { HookData } from "jspdf-autotable";
import type { DataRow } from "@/types/Data";
import type { Variable } from "@/types/Variable";
import type { Log } from "@/types/Result";
// Path to utils is one level up from services directory
import type { CellDef, HAlignType, VAlignType, generateAutoTableDataFromString } from "../print.utils"; 

type JsPDFWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

const PAGE_MARGIN = 14;
const PAGE_TOP_MARGIN = 10;
const SECTION_TITLE_FONT_SIZE = 14;
const TABLE_HEADER_FONT_SIZE = 8.5;
const TABLE_BODY_FONT_SIZE = 8;
const TEXT_FONT_SIZE = 8;
const LOG_ID_FONT_SIZE = 10;
const ANALYTIC_TITLE_FONT_SIZE = 12;
const SPACE_AFTER_TITLE = 7;
const SPACE_AFTER_TABLE = 10;
const SPACE_AFTER_LOG_TEXT = 3;

// Y-coordinate thresholds for page breaks, allowing for some content height
const Y_THRESHOLD_GENERAL = 250; 
const Y_THRESHOLD_RESULTS_LOG_TEXT = 280;
const Y_THRESHOLD_RESULTS_ANALYTIC_TITLE = 260;
const Y_THRESHOLD_RESULTS_TABLE_TITLE = 250;
const Y_THRESHOLD_RESULTS_LOG_ID = 270;

// Utility to convert HTML (e.g., rich-text from Tiptap) to plain text for PDF output
// We rely on DOM APIs which are available in the browser (Print runs client-side)
function htmlToPlainText(html: string): string {
  if (typeof window === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;

  // Process ordered lists
  Array.from(div.querySelectorAll("ol")).forEach((ol) => {
    Array.from(ol.querySelectorAll("li")).forEach((li, idx) => {
      li.insertAdjacentText("afterbegin", `  ${idx + 1}. `);
    });
    ol.insertAdjacentText("afterend", "\n");
  });

  // Process unordered lists
  Array.from(div.querySelectorAll("ul")).forEach((ul) => {
    Array.from(ul.querySelectorAll("li")).forEach((li) => {
      li.insertAdjacentText("afterbegin", "  • ");
    });
    ul.insertAdjacentText("afterend", "\n");
  });

  // Replace <br> with newline tokens
  Array.from(div.querySelectorAll("br")).forEach((br) => {
    br.replaceWith("\n");
  });

  // Add newline after paragraphs and list items to preserve spacing
  Array.from(div.querySelectorAll("p, li")).forEach((el) => {
    el.insertAdjacentText("afterend", "\n");
  });

  const text = div.textContent ?? div.innerText ?? "";
  // Collapse multiple newlines to max 2
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function addDataGridView(
    doc: jsPDF,
    currentY: number,
    data: DataRow[],
    variables: Variable[],
    activeColumns: number[]
): number {
    let newY = currentY;
    if (activeColumns.length === 0 || data.length === 0) {
        return newY;
    }

    if (newY > Y_THRESHOLD_GENERAL) { 
        doc.addPage();
        newY = PAGE_TOP_MARGIN;
    }

    doc.setFontSize(SECTION_TITLE_FONT_SIZE);
    doc.text("Data View", PAGE_MARGIN, newY);
    newY += SPACE_AFTER_TITLE;
    doc.setFontSize(TEXT_FONT_SIZE);

    const dataTableColumns = activeColumns.map((colIdx) => {
        const variable = variables.find((v) => v.columnIndex === colIdx);
        return variable?.name ?? `Column ${colIdx + 1}`;
    });

    const dataTableBody = data.map((row) =>
        activeColumns.map((colIdx) => row[colIdx] ?? "")
    );

    autoTable(doc, {
        head: [dataTableColumns],
        body: dataTableBody,
        startY: newY,
        theme: "grid",
        styles: { fontSize: TABLE_BODY_FONT_SIZE, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            halign: "center" as HAlignType,
            valign: "middle" as VAlignType,
            fontSize: TABLE_HEADER_FONT_SIZE,
            fontStyle: 'bold'
        },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
        tableWidth: doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2),
        didDrawPage: (data: HookData) => { newY = data.cursor?.y ?? PAGE_TOP_MARGIN; } 
    });
    newY = ((doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? newY) + SPACE_AFTER_TABLE;
    return newY;
}

export function addVariableView(
    doc: jsPDF,
    currentY: number,
    variables: Variable[],
    activeColumns: number[]
): number {
    let newY = currentY;
    const variablesToPrint = variables.filter(v => activeColumns.includes(v.columnIndex));

    if (variablesToPrint.length === 0) {
        return newY;
    }

    if (newY > Y_THRESHOLD_GENERAL) { 
        doc.addPage();
        newY = PAGE_TOP_MARGIN;
    }

    doc.setFontSize(SECTION_TITLE_FONT_SIZE);
    doc.text("Variable View", PAGE_MARGIN, newY);
    newY += SPACE_AFTER_TITLE;
    doc.setFontSize(TEXT_FONT_SIZE);

    const variableData = variablesToPrint.map((variable) => [
        variable.name ?? "-",
        variable.type ?? "-",
        variable.label ?? "-",
        variable.measure ?? "unknown",
    ]);

    autoTable(doc, {
        head: [["Name", "Type", "Label", "Measure"]],
        body: variableData,
        startY: newY,
        theme: "grid",
        styles: { fontSize: TABLE_BODY_FONT_SIZE, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0,0,0],
            halign: "center" as HAlignType,
            valign: "middle" as VAlignType,
            fontSize: TABLE_HEADER_FONT_SIZE,
            fontStyle: 'bold'
        },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
        tableWidth: doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2),
        didDrawPage: (data: HookData) => { newY = data.cursor?.y ?? PAGE_TOP_MARGIN; }
    });
    newY = ((doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? newY) + SPACE_AFTER_TABLE;
    return newY;
}

export function addResultsView(
    doc: jsPDF,
    currentY: number,
    logs: Log[],
    generateAutoTableDataFromStringFn: typeof generateAutoTableDataFromString // Type remains the same
): number {
    let newY = currentY;

    if (logs.length === 0) {
        return newY;
    }

    if (newY > Y_THRESHOLD_GENERAL - 10) { // Slightly less for the main title
        doc.addPage();
        newY = PAGE_TOP_MARGIN;
    }
    doc.setFontSize(SECTION_TITLE_FONT_SIZE);
    doc.text("Output Viewer (Results)", PAGE_MARGIN, newY);
    newY += SPACE_AFTER_TITLE;

    for (let index = 0; index < logs.length; index++) {
        const log = logs[index];
        if (index > 0) {
            newY += 3;
            doc.line(PAGE_MARGIN, newY, doc.internal.pageSize.getWidth() - PAGE_MARGIN, newY);
            newY += 7;
        }

        if (newY > Y_THRESHOLD_RESULTS_LOG_ID) { 
            doc.addPage(); 
            newY = PAGE_TOP_MARGIN; 
        }
        doc.setFontSize(LOG_ID_FONT_SIZE);
        doc.setFont(doc.getFont().fontName, 'bold');
        doc.text(`Analysis Log: ${log.id}`, PAGE_MARGIN, newY);
        doc.setFont(doc.getFont().fontName, 'normal');
        newY += 5; // Specific spacing after log ID
        doc.setFontSize(TEXT_FONT_SIZE);
        
        const logTextLines = doc.splitTextToSize(log.log, doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2));
        if (newY + (logTextLines.length * 3.5) > Y_THRESHOLD_RESULTS_LOG_TEXT) { 
            doc.addPage();
            newY = PAGE_TOP_MARGIN;
        }
        doc.setFont(doc.getFont().fontName, 'italic');
        doc.text(log.log, PAGE_MARGIN, newY, { maxWidth: doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2) });
        doc.setFont(doc.getFont().fontName, 'normal');
        newY += (logTextLines.length * 3.5) + SPACE_AFTER_LOG_TEXT;

        if (log.analytics?.length) {
            for (const analytic of log.analytics) {
                if (newY > Y_THRESHOLD_RESULTS_ANALYTIC_TITLE) { 
                    doc.addPage(); 
                    newY = PAGE_TOP_MARGIN; 
                }
                doc.setFontSize(ANALYTIC_TITLE_FONT_SIZE);
                doc.setFont(doc.getFont().fontName, 'bold');
                doc.text(
                    analytic.title,
                    doc.internal.pageSize.getWidth() / 2,
                    newY,
                    { align: "center" }
                );
                doc.setFont(doc.getFont().fontName, 'normal');
                newY += SPACE_AFTER_TITLE;

                if (analytic.statistics?.length) {
                    for (const stat of analytic.statistics) {
                        const { tables } = generateAutoTableDataFromStringFn(stat.output_data);

                        for (const tbl of tables) {
                            if (newY > Y_THRESHOLD_RESULTS_TABLE_TITLE) { 
                                doc.addPage(); 
                                newY = PAGE_TOP_MARGIN; 
                            }
                            doc.setFontSize(LOG_ID_FONT_SIZE); // Re-using LOG_ID_FONT_SIZE for table titles for consistency
                            doc.setFont(doc.getFont().fontName, 'bold');
                            doc.text(tbl.title, PAGE_MARGIN, newY);
                            doc.setFont(doc.getFont().fontName, 'normal');
                            newY += 6; // Specific spacing after table title

                            autoTable(doc, {
                                head: tbl.head as CellDef[][],
                                body: tbl.body as CellDef[][],
                                startY: newY,
                                theme: "grid",
                                styles: { fontSize: TABLE_BODY_FONT_SIZE, cellPadding: 1.5, overflow: 'linebreak' },
                                headStyles: {
                                    fillColor: [220, 220, 220],
                                    textColor: [0,0,0],
                                    halign: "center" as HAlignType,
                                    valign: "middle" as VAlignType,
                                    fontSize: TABLE_HEADER_FONT_SIZE,
                                    fontStyle: 'bold'
                                },
                                margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
                                tableWidth: doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2),
                                didDrawPage: (data: HookData) => { newY = data.cursor?.y ?? PAGE_TOP_MARGIN; }
                            });
                            newY = ((doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? newY) + 4; // Small space after table

                            // Add statistic description if available, now placed AFTER the table
                            if (stat.description) {
                                const plainDescription = htmlToPlainText(stat.description);
                                const descriptionLines = doc.splitTextToSize(plainDescription, doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2));
                                if (newY + (descriptionLines.length * 3.5) > Y_THRESHOLD_GENERAL) {
                                    doc.addPage();
                                    newY = PAGE_TOP_MARGIN;
                                }
                                const lineHeightFactor = 1.3;
                                doc.text(descriptionLines, PAGE_MARGIN, newY, { lineHeightFactor, maxWidth: doc.internal.pageSize.getWidth() - (PAGE_MARGIN * 2) });
                                doc.setFont(doc.getFont().fontName, 'normal');
                                newY += (descriptionLines.length * TEXT_FONT_SIZE * lineHeightFactor) / 2; // approximate line height
                            }
                            newY += SPACE_AFTER_TABLE; // Final space after the entire statistic block
                        }
                    }
                }
            }
        }
    }
    return newY;
} 