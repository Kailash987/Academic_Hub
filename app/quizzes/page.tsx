import AppShell from "@/components/app-shell"
import QuizRunner from "@/components/quiz-runner"

export default function QuizzesPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold">Quizzes</h2>
          <p className="text-muted-foreground">
            Generate or select topic-wise interactive MCQs with instant results and visual feedback.
          </p>
        </header>

        {/* Quiz runner handles both manual and suggested topics */}
        <QuizRunner />
      </section>
    </AppShell>
  )
}
