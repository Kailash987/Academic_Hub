"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

type ChartData = {
  label: string
  value: number // percentage
}

// Color palette
const COLORS = ["#10b981", "#e5e7eb"] // green for correct %, gray for remaining %

export default function ResultsChart({ results }: { results: ChartData[] }) {
  // If multiple topics exist, show all normally
  if (results.length > 1) {
    const multiTopicData = results.map((r) => ({
      name: r.label,
      value: Math.min(100, Math.max(0, Math.round(r.value))),
    }))

    const average =
      multiTopicData.reduce((sum, d) => sum + d.value, 0) / multiTopicData.length

    return (
      <Card>
        <CardHeader>
          <CardTitle>Strengths & Weaknesses</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center">
          <div className="w-full max-w-[500px] h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={multiTopicData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {multiTopicData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        <div className="text-center text-sm text-muted-foreground pb-4">
          Average Accuracy: <span className="font-semibold">{average.toFixed(1)}%</span>
        </div>
      </Card>
    )
  }

  // 🟢 If only one topic, show correct% vs incorrect% (2-slice donut)
  const single = results[0]
  const correct = Math.min(100, Math.max(0, Math.round(single.value)))
  const incorrect = 100 - correct
  const singleData = [
    { name: `${single.label} (Correct)`, value: correct },
    { name: "Incorrect", value: incorrect },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strengths & Weaknesses</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center">
        <div className="w-full max-w-[400px] h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={singleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${value}%`}
              >
                <Cell fill="#10b981" /> {/* green for correct */}
                <Cell fill="#e5e7eb" /> {/* gray for incorrect */}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontSize: "13px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <div className="text-center text-sm text-muted-foreground pb-4">
        Accuracy in {single.label}:{" "}
        <span className="font-semibold text-emerald-600">{correct}%</span>
      </div>
    </Card>
  )
}
