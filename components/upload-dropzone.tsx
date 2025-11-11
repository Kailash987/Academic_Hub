"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

export default function UploadDropzone() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [processing, setProcessing] = useState<boolean>(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false)
  const [textContent, setTextContent] = useState<string>("")

  const handleOpenFile = () => {
    setError(null)
    setResult(null)
    setSummary(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.")
      return
    }

    setProcessing(true)
    setProgress(10)
    const steps = [25, 45, 70, 85, 100]
    steps.forEach((v, i) => setTimeout(() => setProgress(v), 400 * (i + 1)))

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/plag-check", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Upload failed")

      // store both plagiarism score + extracted text
      setResult({
        filename: file.name,
        plagiarism: parseFloat(data.plagiarism),
      })
      setTextContent(data.extracted_text || "")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTimeout(() => setProcessing(false), 2000)
    }
  }

  // ✅ Generate summary via Groq/OpenAI
  const handleGenerateSummary = async () => {
    if (!textContent) {
      setError("No extracted text available to summarize.")
      return
    }

    setLoadingSummary(true)
    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textContent }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate summary")

      setSummary(data.summary)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingSummary(false)
    }
  }

  const getPlagiarismColor = (p: number) => {
    if (p <= 25) return "bg-green-100 border-green-400 text-green-800"
    if (p <= 60) return "bg-yellow-100 border-yellow-400 text-yellow-800"
    return "bg-red-100 border-red-400 text-red-800"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload & Processing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          onClick={handleOpenFile}
          onKeyDown={(e) => e.key === "Enter" && handleOpenFile()}
          className="border-2 border-dashed rounded-xl p-10 text-center bg-muted cursor-pointer"
        >
          <p className="font-medium">Drag-and-drop documents</p>
          <p className="text-sm text-muted-foreground">or click to select files</p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
        />

        {file && (
          <div className="text-sm text-muted-foreground">
            Selected: <span className="font-medium">{file.name}</span>
          </div>
        )}

        {processing && (
          <div className="space-y-2">
            <div className="text-sm">Checking document for plagiarism…</div>
            <Progress value={progress} />
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleUpload}>
            Upload & Check
          </Button>
          <Button variant="outline" onClick={handleOpenFile}>
            Choose Files
          </Button>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        {result && (
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-lg">Plagiarism Report</h3>
            <p className="text-sm text-muted-foreground">
              File: <b>{result.filename}</b>
            </p>

            <div
              className={`p-4 rounded-lg border font-semibold text-center text-xl ${getPlagiarismColor(
                result.plagiarism
              )}`}
            >
              {result.plagiarism}% Plagiarism Detected
            </div>

            {/* ✅ Show Generate Summary button if plagiarism < 50% */}
            {result.plagiarism < 50 && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleGenerateSummary}
                  disabled={loadingSummary}
                  className="bg-secondary text-secondary-foreground hover:opacity-90"
                >
                  {loadingSummary ? "Generating Summary..." : "Generate Summary"}
                </Button>
              </div>
            )}

            {/* ✅ Display generated summary */}
            {summary && (
  <div className="mt-6 bg-white shadow-sm rounded-lg p-5 border border-gray-200">
    <h4 className="font-semibold text-lg mb-3">Generated Summary</h4>

    <ul className="list-disc list-inside text-gray-700 text-sm leading-relaxed space-y-1">
      {summary
        // Split the summary text into bullet points
        .split(/\n|•/g)
        .filter((line) => line.trim() !== "")
        .slice(0, 7) // Limit to max 7 bullet points for readability
        .map((point, idx) => (
          <li key={idx} className="pl-1">
            {point.trim().replace(/^-/, "").trim()}
          </li>
        ))}
    </ul>

    {/* Action Buttons */}
    <div className="flex gap-2 mt-4">
      <Button
        variant="outline"
        className="hover:bg-gray-100"
        onClick={() => {
          // Download summary as .txt file
          const blob = new Blob([summary], { type: "text/plain" })
          const link = document.createElement("a")
          link.href = URL.createObjectURL(blob)
          link.download = "generated_summary.txt"
          link.click()
        }}
      >
        Download
      </Button>

      <Button
        className="bg-secondary text-secondary-foreground hover:opacity-90"
        onClick={() => alert("Export feature coming soon!")}
      >
        Export
      </Button>
    </div>
  </div>
)}


          </div>
        )}
      </CardContent>
    </Card>
  )
}
