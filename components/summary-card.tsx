import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SummaryCard({
  title,
  date,
  snippet,
}: {
  title: string
  date: string
  snippet: string
}) {
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <div className="text-xs text-muted-foreground">{date}</div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {/* ✳️ Preview with bullet formatting */}
        <div className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
          {snippet.split("\n").map((line, idx) => (
            <div key={idx}>• {line.trim()}</div>
          ))}
        </div>

        <div className="mt-auto">
          <Button
            size="sm"
            className="bg-secondary text-secondary-foreground hover:opacity-90 w-full"
          >
            Expand
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
