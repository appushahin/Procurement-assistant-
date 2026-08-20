import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker using CDN for Vite compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Client-side text extraction from PDF ArrayBuffer
 */
export async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items.map((item: any) => item.str);
      fullText += `--- PDF Page ${i} ---\n` + pageStrings.join(" ") + "\n\n";
    }

    return fullText.trim();
  } catch (err) {
    console.warn("Client-side PDF extraction encountered error:", err);
    return "";
  }
}
