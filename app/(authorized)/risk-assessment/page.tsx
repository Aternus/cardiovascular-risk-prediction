"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const interpretationLevels = [
  { label: "Low", range: "0-5%" },
  { label: "Borderline", range: "5-7.5%" },
  { label: "Intermediate", range: "7.5-20%" },
  { label: "High", range: "20%+" },
];

const eventBreakdown = [
  {
    label: "CHD",
    description: "Coronary heart disease",
    value: "6.1%",
  },
  {
    label: "Stroke",
    description: "Ischemic or hemorrhagic",
    value: "4.0%",
  },
  {
    label: "HF",
    description: "Heart failure",
    value: "3.3%",
  },
];

const riskFactors = [
  {
    label: "Age",
    impact: "Higher risk",
    delta: "+4.2%",
    strength: 78,
  },
  {
    label: "Total cholesterol",
    impact: "Higher risk",
    delta: "+2.1%",
    strength: 52,
  },
  {
    label: "Systolic BP",
    impact: "Higher risk",
    delta: "+1.6%",
    strength: 46,
  },
  {
    label: "HDL",
    impact: "Protective",
    delta: "-1.4%",
    strength: 40,
  },
  {
    label: "eGFR",
    impact: "Protective",
    delta: "-0.8%",
    strength: 28,
  },
];

export default function RiskAssessment() {
  const interpretation = "Intermediate";

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
          <CardHeader className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>PREVENT 2023</Badge>
              <Badge
                variant="outline"
                className="border-muted-foreground/30 text-muted-foreground"
              >
                Updated Aug 14, 2024
              </Badge>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">
              10-year cardiovascular event risk
            </CardTitle>
            <CardDescription>
              Your personalized estimate based on the latest measurements.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="text-5xl font-semibold tracking-tight">
                  13.4%
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <span>Absolute risk</span>
                  <span>Median for age: 8.1%</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>20%</span>
                  <span>40%</span>
                </div>
                <Progress value={13.4} className="h-3" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-lg border bg-background/70 px-3 py-2">
                  <p className="text-muted-foreground">Model</p>
                  <p className="font-medium">PREVENT</p>
                </div>
                <div className="rounded-lg border bg-background/70 px-3 py-2">
                  <p className="text-muted-foreground">Horizon</p>
                  <p className="font-medium">10 years</p>
                </div>
                <div className="rounded-lg border bg-background/70 px-3 py-2">
                  <p className="text-muted-foreground">Assessment</p>
                  <p className="font-medium">Cardiovascular event</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interpretation</CardTitle>
            <CardDescription>
              American Heart Association risk categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Badge className="w-fit bg-amber-500 text-white hover:bg-amber-500">
              {interpretation}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Your 10-year risk falls in the intermediate range. Consider
              discussing lifestyle changes and preventive therapy with your care
              team.
            </p>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {interpretationLevels.map((level) => (
                <Badge
                  key={level.label}
                  variant={
                    level.label === interpretation ? "default" : "outline"
                  }
                  className={
                    level.label === interpretation
                      ? "bg-amber-500 text-white hover:bg-amber-500"
                      : "text-muted-foreground"
                  }
                >
                  {level.label} {level.range}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Breakdown of CV events</CardTitle>
            <CardDescription>
              Ranked by probability for the next 10 years.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Probability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventBreakdown.map((event) => (
                  <TableRow key={event.label}>
                    <TableCell className="font-medium">{event.label}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.description}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {event.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contribution of risk factors</CardTitle>
            <CardDescription>
              Direction and magnitude of each factor on ASCVD risk.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {riskFactors.map((factor, index) => (
              <div key={factor.label} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{factor.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Impact on 10-year risk
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        factor.impact === "Protective"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-200"
                          : "bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-200"
                      }
                    >
                      {factor.impact}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {factor.delta}
                    </span>
                  </div>
                </div>
                <Progress value={factor.strength} className="h-2" />
                {index < riskFactors.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
