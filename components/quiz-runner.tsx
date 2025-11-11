"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import ResultsChart from "./results-chart"

type Q = {
  id: string
  prompt: string
  options: string[]
  answer: number
  topic: string
}

type QuizRunnerProps = {
  topic?: string
}

export default function QuizRunner({ topic }: QuizRunnerProps) {
  const [selectedTopic, setTopic] = useState(topic || "")
  const [questions, setQuestions] = useState<Q[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = questions.length
    ? Math.round((index / questions.length) * 100)
    : 0

  // 🎯 Fetch questions for a given topic
  const fetchQuestions = async (t: string) => {
    if (!t.trim()) return
    setLoading(true)
    setError(null)
    setDone(false)
    setAnswers([])
    setQuestions([])
    try {
      const res = await fetch("/api/qg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      })
      if (!res.ok) throw new Error("Failed to generate quiz")
      const data = await res.json()
      if (!data.questions?.length) {
        setError(`No questions found for “${t}”.`)
      } else {
        setQuestions(data.questions)
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  // 🧩 Handle option selection
  const select = (i: number) => {
    const next = [...answers]
    next[index] = i
    setAnswers(next)
  }

  const nextQ = () => {
    if (index + 1 < questions.length) setIndex(index + 1)
    else setDone(true)
  }

  useEffect(() => {
    if (done) {
      ;(async () => {
        try {
          const confetti = (await import("canvas-confetti")).default
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } })
        } catch {}
      })()
    }
  }, [done])

  // 🟩 Show results
  if (done && questions.length) {
    const correct = answers.reduce(
      (acc, a, i) => acc + (a === questions[i].answer ? 1 : 0),
      0
    )
    const byTopic = new Map<string, { total: number; correct: number }>()
    questions.forEach((q, i) => {
      const stats = byTopic.get(q.topic) || { total: 0, correct: 0 }
      stats.total += 1
      stats.correct += answers[i] === q.answer ? 1 : 0
      byTopic.set(q.topic, stats)
    })
    const chartData = Array.from(byTopic.entries()).map(([label, s]) => ({
      label,
      value: (s.correct / s.total) * 100,
    }))

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              Score:{" "}
              <span className="font-semibold">
                {correct} / {questions.length}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Great job! Review weaker areas below.
            </div>
          </CardContent>
        </Card>

        <ResultsChart results={chartData} />

        <div className="flex gap-2">
          <Button
            onClick={() => {
              setIndex(0)
              setAnswers([])
              setDone(false)
            }}
          >
            Retry
          </Button>
          <Button variant="secondary" onClick={() => setQuestions([])}>
            New Quiz
          </Button>
        </div>
      </div>
    )
  }

  // 🟨 No questions yet → show search bar and suggestions
  if (!questions.length && !loading && !done) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Quizzes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate or select topic-wise interactive MCQs with instant results and visual feedback.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a topic (e.g., Machine Learning)"
              value={selectedTopic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <Button onClick={() => fetchQuestions(selectedTopic)} disabled={loading}>
              {loading ? "Generating..." : "Generate Quiz"}
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap text-sm">
            {["Operating Systems", "Computer Networks", "DSA"].map((s) => (
              <Button
                key={s}
                variant="outline"
                onClick={() => {
                  setTopic(s)
                  fetchQuestions(s)
                }}
              >
                {s}
              </Button>
            ))}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>
    )
  }

  // 🟦 Loading State
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generating Quiz...</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={50} />
          <p className="text-sm text-muted-foreground mt-2">
            Preparing questions for “{selectedTopic}”...
          </p>
        </CardContent>
      </Card>
    )
  }

  // 🟪 Active Quiz View
  const q = questions[index]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Question {index + 1} of {questions.length}
          </div>
          <div className="w-40">
            <Progress value={progress} aria-label="Quiz progress" />
          </div>
        </div>

        <div className="font-medium">{q.prompt}</div>

        <div className="grid gap-2">
          {q.options.map((o, i) => (
            <Button
              key={i}
              variant={answers[index] === i ? "default" : "outline"}
              className={answers[index] === i ? "bg-accent text-accent-foreground" : ""}
              onClick={() => select(i)}
            >
              {o}
            </Button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={nextQ} disabled={answers[index] == null}>
            {index + 1 === questions.length ? "Finish" : "Next"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
