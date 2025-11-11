import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 })
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: "Insufficient text for summary" }, { status: 400 })
    }

    // ✅ Call Groq/OpenAI-compatible API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that summarizes academic documents into short, clear bullet points. Keep 5-7 points max. Use concise academic tone and avoid long paragraphs.",
          },
          {
            role: "user",
            content: `Summarize this text as concise bullet points:\n\n${text}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    })

    const data = await response.json()
    const summary = data?.choices?.[0]?.message?.content?.trim()

    if (!summary) {
      return NextResponse.json({ error: "No summary generated" }, { status: 400 })
    }

    return NextResponse.json({ summary })
  } catch (err) {
    console.error("SUMMARY ERROR:", err)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
