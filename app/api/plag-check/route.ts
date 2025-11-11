import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  // ✅ PDF extraction
  if (fileName.endsWith(".pdf")) {
    const data = await pdfParse(buffer);
    return data.text;
  }

  // ✅ DOC / DOCX extraction
  if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // ✅ TXT fallback
  return buffer.toString("utf-8");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const textContent = await extractTextFromFile(file);

    if (!textContent || textContent.trim().length < 80) {
      return NextResponse.json(
        { error: "Extracted text is too short (<80 chars). Document may be scanned image-based PDF." },
        { status: 400 }
      );
    }

    const apiKey = process.env.PLAGCHECK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // ✅ dynamic external_id
    const externalId = `${file.name.replace(/\W+/g, "_")}_${Date.now()}`;

    // ✅ submit to /text endpoint with `type=single`
    const submitBody = new URLSearchParams({
      language: "en",
      is_private: "1",
      type: "single",       // ✅ REQUIRED FOR NEW SINGLE USER TOKENS
      external_id: externalId,
      text: textContent,
    }).toString();

    const submitRes = await fetch("https://plagiarismcheck.org/api/v1/text", {
      method: "POST",
      headers: {
        "X-API-TOKEN": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: submitBody,
    });

    const submitJson = await submitRes.json();

    if (!submitJson?.data?.text?.id) {
      return NextResponse.json(
        { error: "Failed to submit text", details: submitJson },
        { status: 400 }
      );
    }

    const textId = submitJson.data.text.id;

    // ✅ poll until report ready
    let statusJson: any = null;
    while (true) {
      await new Promise((r) => setTimeout(r, 2000));

      const pollRes = await fetch(`https://plagiarismcheck.org/api/v1/text/${textId}`, {
        headers: { "X-API-TOKEN": apiKey },
      });

      statusJson = await pollRes.json();

      if (statusJson?.data?.state === 5) break; // checked ✓
      if (statusJson?.data?.state === 4) {
        return NextResponse.json({ error: "Checking failed" }, { status: 500 });
      }
    }

    // ✅ fetch final report
    const reportRes = await fetch(
      `https://plagiarismcheck.org/api/v1/text/report/${textId}`,
      { headers: { "X-API-TOKEN": apiKey } }
    );

    const reportJson = await reportRes.json();

    return NextResponse.json({
      plagiarism: reportJson.data.report.percent,
      sources_count: reportJson.data.report.source_count,
      text_id: textId,
      extracted_text: textContent,
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
