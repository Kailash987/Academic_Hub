import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <main className="min-h-dvh grid">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-6 py-16 md:py-24 grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-xs font-medium">
            Built for students
          </div>
          <h1 className="text-balance text-4xl md:text-5xl font-semibold">Your Academic Resource Hub, Powered by AI</h1>
          <p className="text-pretty text-muted-foreground">
            Upload notes, get instant summaries, browse previous year questions, and take quick quizzes. Designed for
            clarity, speed, and daily use.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground hover:opacity-90">Sign Up</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Login</Button>
            </Link>
          </div>
        </div>
        <div className="relative">
          <Image
            src={`/placeholder.jpeg?height=480&width=640&query=students%20studying%20with%20laptops%20and%20books`}
            alt="Students studying with laptops and books illustration"
            width={640}
            height={480}
            className="rounded-xl border object-cover"
            priority
          />
        </div>
      </div>
    </main>
  )
}
