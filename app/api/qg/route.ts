import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid topic" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY in .env.local" },
        { status: 500 }
      )
    }

    // 🧠 Construct the prompt
    const prompt = `
      You are an AI quiz generator.
      Generate 5 multiple-choice questions on the topic "${topic}".
      Each question must include 4 options and specify which option (0-based index) is correct.
      Return JSON in the following format ONLY:
      {
        "questions": [
          {
            "id": "1",
            "prompt": "Question text",
            "options": ["A", "B", "C", "D"],
            "answer": 1,
            "topic": "${topic}"
          }
        ]
      }
      Output JSON only — no explanations, markdown, or commentary.
    `

    // 🧩 Call Groq API
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "You are a JSON-only quiz generator." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("Groq API Error:", text)
      return NextResponse.json(
        { error: "Groq API returned an error" },
        { status: res.status }
      )
    }

    const data = await res.json()
    const output = data?.choices?.[0]?.message?.content

    if (!output) {
      return NextResponse.json(
        { error: "Empty Groq response" },
        { status: 500 }
      )
    }

    // 🧹 Clean model output and parse JSON
    const cleaned = output
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch (e) {
      console.error("Failed to parse Groq output:", e, cleaned)
      return NextResponse.json(
        { error: "Failed to parse quiz JSON" },
        { status: 500 }
      )
    }

    return NextResponse.json(parsed, { status: 200 })
  } catch (error: any) {
    console.error("Error in /api/qg:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
