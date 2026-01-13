import { Badge } from "@/components/ui/badge";
import { ArrowRight, ClipboardList, HeartPulse } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-8 shadow-xl backdrop-blur sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-chart-5/20 blur-3xl"
        />
        <div className="relative z-10 flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <Badge
              variant="secondary"
              className="w-fit border border-border/80 bg-card/70 text-muted-foreground"
            >
              Care workflow
            </Badge>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Start your cardiovascular risk assessment
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Link
              href="/onboarding"
              className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-10 -right-12 h-24 w-24 rounded-full bg-chart-2/20 blur-2xl"
              />
              <div className="relative z-10 flex h-full flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/30 bg-blue-300/10 text-blue-500 shadow-sm">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold tracking-[0.2em] text-cyan-500 uppercase">
                    Step 1
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Onboarding
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Capture demographics, vitals, lab values, and clinical
                    history.
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-cyan-500">
                  Begin intake
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link
              href="/risk-assessment"
              className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-10 -right-12 h-24 w-24 rounded-full bg-chart-3/20 blur-2xl"
              />
              <div className="relative z-10 flex h-full flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-300/30 bg-red-300/10 text-red-500 shadow-sm">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold tracking-[0.2em] text-yellow-600 uppercase">
                    Step 2
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Risk assessment
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Review 10-year risk, factor contributions, and care-ready
                    insights.
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-yellow-600">
                  View dashboard
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground shadow-sm backdrop-blur">
            Tip: Complete onboarding first so the risk assessment can calculate
            accurate PREVENT scores and factor insights.
          </div>

          <div className="flex flex-col rounded-2xl border border-chart-2/30 bg-chart-2/10 p-5 text-xs text-foreground shadow-sm backdrop-blur">
            This algorithm has been clinically validated.
            <Link
              className="mt-3 inline-flex text-xs font-medium text-chart-2/80 underline decoration-1 underline-offset-4 transition hover:text-chart-2"
              href="https://professional.heart.org/en/guidelines-and-statements/about-prevent-calculator"
              target="_blank"
              rel="noreferrer"
            >
              Learn more about the PREVENT workgroup →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
