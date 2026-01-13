import { Badge } from "@/components/ui/badge";
import { ArrowRight, ClipboardList, HeartPulse } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-10 h-56 w-56 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-900/40"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-emerald-200/60 blur-3xl dark:bg-emerald-900/30"
        />
        <div className="relative z-10 flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <Badge
              variant="secondary"
              className="w-fit border border-slate-200/80 bg-white/70 text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300"
            >
              Care workflow
            </Badge>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
              Start your cardiovascular risk assessment
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Link
              href="/onboarding"
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-950/70"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-10 h-24 w-24 rounded-full bg-emerald-200/60 blur-2xl dark:bg-emerald-900/40"
              />
              <div className="relative z-10 flex h-full flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/70 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-200">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600/80 dark:text-emerald-300/80">
                    Step 1
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Onboarding
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Capture demographics, vitals, lab values, and clinical
                    history.
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-200">
                  Begin intake
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link
              href="/risk-assessment"
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-950/70"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -left-12 -bottom-10 h-24 w-24 rounded-full bg-sky-200/60 blur-2xl dark:bg-sky-900/40"
              />
              <div className="relative z-10 flex h-full flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200/70 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-800/60 dark:bg-sky-950/60 dark:text-sky-200">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600/80 dark:text-sky-300/80">
                    Step 2
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Risk assessment
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Review 10-year risk, factor contributions, and care-ready
                    insights.
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-200">
                  View dashboard
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-300">
            Tip: Complete onboarding first so the risk assessment can calculate
            accurate PREVENT scores and factor insights.
          </div>

          <div className="flex flex-col rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-5 text-xs text-emerald-900 shadow-sm backdrop-blur dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-100">
            This algorithm has been clinically validated, so you can trust the
            results as part of your cardiovascular risk workflow.
            <Link
              className="mt-3 inline-flex text-xs font-medium text-emerald-800/70 underline decoration-1 underline-offset-4 transition hover:text-emerald-900 dark:text-emerald-200/70 dark:hover:text-emerald-100"
              href="https://professional.heart.org/en/guidelines-and-statements/about-prevent-calculator"
              target="_blank"
              rel="noreferrer"
            >
              PREVENT validation details →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
