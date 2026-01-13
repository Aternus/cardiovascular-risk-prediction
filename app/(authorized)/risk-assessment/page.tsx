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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { parseDateFromYMD } from "@/lib/date";
import { getAgeInYears } from "@/lib/form.utils";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";

import type {
  TClinCalcCalculateRiskAssessmentResponseDTO,
  TClinCalcPREVENTAssessmentRequestDTO,
} from "@/contracts/v1/clincalc";
import type {
  TmdCalcCalculateRiskAssessmentResponseDTO,
  TMdCalcPREVENTAssessmentRequestDTO,
} from "@/contracts/v1/mdcalc";

type TAssessmentStatus = "idle" | "loading" | "success" | "partial" | "error";
type TRiskCategory = "Low" | "Borderline" | "Intermediate" | "High" | "Unknown";
type TRiskFactorImpact = "Harmful" | "Protective";

type TRiskFactor = {
  label: string;
  impact: TRiskFactorImpact;
  delta: string;
  strength: number;
};

type TEventBreakdown = {
  label: string;
  description: string;
  value: string;
};

type TmdCalcCalculateRiskAssessmentRequestDTO = {
  body: TMdCalcPREVENTAssessmentRequestDTO;
};

type TClinCalcCalculateRiskAssessmentRequestDTO = {
  body: TClinCalcPREVENTAssessmentRequestDTO;
};

const interpretationLevels = [
  { label: "Low", range: "0-5%" },
  { label: "Borderline", range: "5-7.5%" },
  { label: "Intermediate", range: "7.5-20%" },
  { label: "High", range: "20%+" },
];

const interpretationDescriptions: Record<
  Exclude<TRiskCategory, "Unknown">,
  string
> = {
  Low: "Your 10-year risk is low. Keep up healthy habits and routine checkups.",
  Borderline:
    "Your 10-year risk is borderline. Consider lifestyle changes and discuss options with your care team.",
  Intermediate:
    "Your 10-year risk is intermediate. Review preventive therapy and lifestyle changes with your care team.",
  High: "Your 10-year risk is high. Discuss preventive therapy and follow up with your care team.",
};

const eventBreakdownConfig = [
  {
    label: "CHD",
    description: "Coronary heart disease",
    key: "chd",
    keywords: [/coronary/i, /\bchd\b/i, /myocard/i],
  },
  {
    label: "Stroke",
    description: "Ischemic or hemorrhagic",
    key: "stroke",
    keywords: [/stroke/i],
  },
  {
    label: "HF",
    description: "Heart failure",
    key: "hf",
    keywords: [/heart failure/i, /\bhf\b/i],
  },
] as const;

const parsePercentValue = (value: string) => {
  const match = value.match(/-?\d+(\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
};

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatPercent = (value: number | null) =>
  value === null ? "N/A" : `${percentFormatter.format(value)}%`;

const formatSignedPercent = (value: number) => {
  const rounded = value.toFixed(1);
  return `${value >= 0 ? "+" : ""}${rounded}%`;
};

const getInterpretationLabel = (
  value: number,
): Exclude<TRiskCategory, "Unknown"> => {
  if (value < 5) {
    return "Low";
  }
  if (value < 7.5) {
    return "Borderline";
  }
  if (value < 20) {
    return "Intermediate";
  }
  return "High";
};

const getPercentFromOutput = (output?: {
  name: string;
  value: string;
  value_text: string;
  message: string;
}) => {
  if (!output) {
    return null;
  }
  return (
    parsePercentValue(output.value_text) ?? parsePercentValue(output.value)
  );
};

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ");

const parsePreventBreakdown = (message: string) => {
  const cleaned = stripHtml(message);
  const entries: Array<[RegExp, string]> = [
    [/10-?Year ASCVD Risk:\s*([0-9.]+)%/i, "ascvd"],
    [/10-?Year Heart Failure Risk:\s*([0-9.]+)%/i, "hf"],
    [/10-?Year Coronary Heart Disease Risk:\s*([0-9.]+)%/i, "chd"],
    [/10-?Year Stroke Risk:\s*([0-9.]+)%/i, "stroke"],
  ];

  const result: Partial<Record<string, number>> = {};
  for (const [regex, key] of entries) {
    const match = cleaned.match(regex);
    if (match && match[1]) {
      result[key] = Number.parseFloat(match[1]);
    }
  }

  return result;
};

const formatUpdatedLabel = (date: Date) =>
  `Updated ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

const formatRiskFactorLabel = (value: string) => {
  const normalized = value.toLowerCase();

  if (normalized.includes("total cholesterol")) {
    return "Total cholesterol";
  }
  if (normalized.includes("hdl")) {
    return "HDL";
  }
  if (normalized.includes("systolic") || normalized.includes("sbp")) {
    return "Systolic BP";
  }
  if (normalized.includes("egfr")) {
    return "eGFR";
  }
  if (normalized.includes("body mass") || normalized.includes("bmi")) {
    return "BMI";
  }
  if (normalized.includes("diabetes")) {
    return "Diabetes";
  }
  if (normalized.includes("smoker")) {
    return "Smoking";
  }
  if (normalized.includes("statin")) {
    return "Statin";
  }
  if (
    normalized.includes("bp treatment") ||
    normalized.includes("anti-hypertensive") ||
    normalized.includes("antihypertensive")
  ) {
    return "Antihypertensive";
  }
  if (normalized.includes("age")) {
    return "Age";
  }

  return value;
};

const readJsonResponse = async <T,>(
  response: Response,
  fallbackMessage: string,
) => {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    void error;
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    const errorPayload = payload as { error?: unknown };
    const errorMessage =
      errorPayload && typeof errorPayload.error === "string"
        ? errorPayload.error
        : fallbackMessage;
    throw new Error(errorMessage);
  }

  return payload as T;
};

export default function RiskAssessment() {
  const profileData = useQuery(api.patients.getProfile);
  const intakeData = useQuery(api.intake.getIntake);
  const updatedLabel = useMemo(() => formatUpdatedLabel(new Date()), []);

  const birthDate = useMemo(() => {
    if (!profileData) {
      return null;
    }

    return parseDateFromYMD(profileData.dateOfBirth) ?? null;
  }, [profileData]);
  const age = useMemo(() => {
    if (!birthDate) {
      return null;
    }

    return getAgeInYears(birthDate);
  }, [birthDate]);
  const validationError = useMemo(() => {
    if (profileData === undefined || intakeData === undefined) {
      return null;
    }

    if (!profileData || !intakeData) {
      return null;
    }

    if (!birthDate) {
      return "Date of birth is invalid.";
    }

    if (typeof age !== "number" || !Number.isFinite(age) || age <= 0) {
      return "Age could not be calculated from the profile.";
    }

    return null;
  }, [profileData, intakeData, birthDate, age]);

  const [assessmentStatus, setAssessmentStatus] =
    useState<TAssessmentStatus>("idle");
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [mdCalcAssessments, setMdCalcAssessments] = useState<
    TmdCalcCalculateRiskAssessmentResponseDTO["assessments"] | null
  >(null);
  const [clinCalcContributions, setClinCalcContributions] = useState<
    TClinCalcCalculateRiskAssessmentResponseDTO["contributions"] | null
  >(null);

  const mdCalcPayload =
    useMemo<TmdCalcCalculateRiskAssessmentRequestDTO | null>(() => {
      if (!profileData || !intakeData || typeof age !== "number") {
        return null;
      }

      if (validationError) {
        return null;
      }

      return {
        body: {
          UOMSYSTEM: true,
          model: 0,
          sex: profileData.sexAtBirth === "MALE" ? 1 : 0,
          age,
          tc: intakeData.totalCholesterol,
          hdl: intakeData.hdlCholesterol,
          sbp: intakeData.systolicBP,
          diabetes: intakeData.isDiabetes ? 1 : 0,
          smoker: intakeData.isSmoker ? 1 : 0,
          egfr: intakeData.eGFR,
          htn_med: intakeData.isTakingAntihypertensive ? 1 : 0,
          statin: intakeData.isTakingStatin ? 1 : 0,
          bmi: intakeData.bmi,
        },
      };
    }, [profileData, intakeData, age, validationError]);

  const clinCalcPayload =
    useMemo<TClinCalcCalculateRiskAssessmentRequestDTO | null>(() => {
      if (!profileData || !intakeData || typeof age !== "number") {
        return null;
      }

      if (validationError) {
        return null;
      }

      return {
        body: {
          age,
          gender: profileData.sexAtBirth === "MALE" ? "male" : "female",
          totalCholesterol: intakeData.totalCholesterol,
          hdlCholesterol: intakeData.hdlCholesterol,
          systolicBP: intakeData.systolicBP,
          bmi: intakeData.bmi,
          eGFR: intakeData.eGFR,
          diabetes: intakeData.isDiabetes,
          smoker: intakeData.isSmoker,
          takingAntihypertensive: intakeData.isTakingAntihypertensive,
          takingStatin: intakeData.isTakingStatin,
        },
      };
    }, [profileData, intakeData, age, validationError]);

  useEffect(() => {
    if (!mdCalcPayload || !clinCalcPayload) {
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;

    const fetchAssessments = async () => {
      setAssessmentStatus("loading");
      setAssessmentError(null);

      const mdCalcPromise = fetch("/api/v1/mdcalc/prevent-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mdCalcPayload),
        cache: "no-store",
        signal: controller.signal,
      }).then((response) =>
        readJsonResponse<TmdCalcCalculateRiskAssessmentResponseDTO>(
          response,
          "MdCalc request failed.",
        ),
      );

      const clinCalcPromise = fetch("/api/v1/clincalc/prevent-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinCalcPayload),
        cache: "no-store",
        signal: controller.signal,
      }).then((response) =>
        readJsonResponse<TClinCalcCalculateRiskAssessmentResponseDTO>(
          response,
          "ClinCalc request failed.",
        ),
      );

      const [mdCalcResult, clinCalcResult] = await Promise.allSettled([
        mdCalcPromise,
        clinCalcPromise,
      ]);

      if (!isCurrent || controller.signal.aborted) {
        return;
      }

      const errors: string[] = [];

      if (mdCalcResult.status === "fulfilled") {
        setMdCalcAssessments(mdCalcResult.value.assessments);
      } else {
        setMdCalcAssessments(null);
        errors.push(
          mdCalcResult.reason instanceof Error
            ? mdCalcResult.reason.message
            : "MdCalc request failed.",
        );
      }

      if (clinCalcResult.status === "fulfilled") {
        setClinCalcContributions(clinCalcResult.value.contributions);
      } else {
        setClinCalcContributions(null);
        errors.push(
          clinCalcResult.reason instanceof Error
            ? clinCalcResult.reason.message
            : "ClinCalc request failed.",
        );
      }

      if (errors.length === 0) {
        setAssessmentStatus("success");
        return;
      }

      setAssessmentError(errors.join(" "));
      if (
        mdCalcResult.status === "fulfilled" ||
        clinCalcResult.status === "fulfilled"
      ) {
        setAssessmentStatus("partial");
      } else {
        setAssessmentStatus("error");
      }
    };

    void fetchAssessments();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [mdCalcPayload, clinCalcPayload]);

  const displayMdCalcAssessments =
    mdCalcPayload && assessmentStatus !== "loading" ? mdCalcAssessments : null;
  const displayClinCalcContributions =
    clinCalcPayload && assessmentStatus !== "loading"
      ? clinCalcContributions
      : null;

  const totalRiskPercent = useMemo(() => {
    if (!displayMdCalcAssessments?.output?.length) {
      return null;
    }

    const outputs = displayMdCalcAssessments.output;
    const tenYearOutputs = outputs.filter((output) =>
      /10\s?-?\s?(year|yr)/i.test(`${output.name} ${output.message}`),
    );
    const outputsToSearch = tenYearOutputs.length ? tenYearOutputs : outputs;
    const totalOutput =
      outputsToSearch.find((output) =>
        /cvd|cardiovascular/i.test(`${output.name} ${output.message}`),
      ) ?? outputsToSearch[0];

    return getPercentFromOutput(totalOutput);
  }, [displayMdCalcAssessments]);

  const breakdownFromMessage = useMemo(() => {
    if (!displayMdCalcAssessments?.output?.length) {
      return null;
    }

    const detailedOutput = displayMdCalcAssessments.output.find((output) =>
      /10-?year ascvd risk/i.test(stripHtml(output.message)),
    );

    if (!detailedOutput) {
      return null;
    }

    return parsePreventBreakdown(detailedOutput.message);
  }, [displayMdCalcAssessments]);

  const eventBreakdown = useMemo<TEventBreakdown[]>(() => {
    const outputs = displayMdCalcAssessments?.output ?? [];
    const tenYearOutputs = outputs.filter((output) =>
      /10\s?-?\s?(year|yr)/i.test(`${output.name} ${output.message}`),
    );
    const outputsToSearch = tenYearOutputs.length ? tenYearOutputs : outputs;

    const rows = eventBreakdownConfig.map((event, index) => {
      const parsedValue = breakdownFromMessage?.[event.key];
      if (typeof parsedValue === "number") {
        return {
          label: event.label,
          description: event.description,
          value: formatPercent(parsedValue),
          numericValue: parsedValue,
          index,
        };
      }

      const output = outputsToSearch.find((entry) =>
        event.keywords.some((keyword) =>
          keyword.test(`${entry.name} ${entry.message}`),
        ),
      );
      const numericValue = getPercentFromOutput(output);
      return {
        label: event.label,
        description: event.description,
        value: formatPercent(numericValue),
        numericValue,
        index,
      };
    });

    return rows
      .sort((a, b) => {
        const aValue = a.numericValue ?? -1;
        const bValue = b.numericValue ?? -1;
        if (aValue === bValue) {
          return a.index - b.index;
        }
        return bValue - aValue;
      })
      .map(({ label, description, value }) => ({ label, description, value }));
  }, [displayMdCalcAssessments, breakdownFromMessage]);

  const riskFactors = useMemo<TRiskFactor[]>(() => {
    if (
      !displayClinCalcContributions ||
      displayClinCalcContributions.length === 0
    ) {
      return [];
    }

    const sorted = [...displayClinCalcContributions].sort(
      (a, b) => Math.abs(b.value) - Math.abs(a.value),
    );
    const topFactors = sorted.slice(0, 5);
    const maxAbs = Math.max(
      ...topFactors.map((factor) => Math.abs(factor.value)),
      0,
    );

    return topFactors.map((factor) => {
      const impact: TRiskFactorImpact =
        factor.value >= 0 ? "Harmful" : "Protective";
      const strength =
        maxAbs === 0 ? 0 : Math.round((Math.abs(factor.value) / maxAbs) * 100);

      return {
        label: formatRiskFactorLabel(factor.factor),
        impact,
        delta: formatSignedPercent(factor.value),
        strength,
      };
    });
  }, [displayClinCalcContributions]);

  const isQueryLoading = profileData === undefined || intakeData === undefined;
  const isMissingData = profileData === null || intakeData === null;
  const isAssessmentLoading = assessmentStatus === "loading";
  const combinedError = validationError ?? assessmentError;
  const interpretation: TRiskCategory =
    totalRiskPercent === null
      ? "Unknown"
      : getInterpretationLabel(totalRiskPercent);
  const interpretationDescription =
    interpretation === "Unknown"
      ? "Complete your intake to see your risk category."
      : interpretationDescriptions[interpretation];
  const absoluteRiskDisplay = formatPercent(totalRiskPercent);
  const riskProgressValue =
    totalRiskPercent === null ? 0 : Math.min(100, totalRiskPercent);
  const statusMessage = isMissingData
    ? "Complete your intake to generate a risk assessment."
    : combinedError;
  const showStatusMessage = Boolean(statusMessage);
  const statusMessageClassName = isMissingData
    ? "text-sm text-muted-foreground"
    : "text-sm text-destructive";
  const interpretationBadgeVariant =
    interpretation === "Unknown" ? "outline" : "default";
  const interpretationBadgeClassName =
    interpretation === "Unknown"
      ? "w-fit border-muted-foreground/30 text-muted-foreground"
      : "w-fit bg-amber-500 text-white hover:bg-amber-500";

  const showAbsoluteRiskLoading =
    isQueryLoading ||
    isAssessmentLoading ||
    (assessmentStatus === "idle" && mdCalcPayload !== null);
  const showEventBreakdownLoading =
    isQueryLoading ||
    isAssessmentLoading ||
    (assessmentStatus === "idle" && mdCalcPayload !== null);
  const showRiskFactorLoading =
    isQueryLoading ||
    isAssessmentLoading ||
    (assessmentStatus === "idle" && clinCalcPayload !== null);

  const riskFactorEmptyMessage = isMissingData
    ? "Complete your intake to see risk factor contributions."
    : showRiskFactorLoading
      ? "Calculating risk factor contributions..."
      : "Risk factor contributions are unavailable.";

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
          <CardHeader className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{updatedLabel}</Badge>
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
              {showStatusMessage ? (
                <p className={statusMessageClassName}>{statusMessage}</p>
              ) : null}
              <div className="flex flex-wrap items-end gap-4">
                {showAbsoluteRiskLoading ? (
                  <Skeleton className="h-12 w-28" />
                ) : (
                  <div className="text-5xl font-semibold tracking-tight">
                    {absoluteRiskDisplay}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  <span>Absolute risk</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>20%</span>
                  <span>40%</span>
                </div>
                <Progress value={riskProgressValue} className="h-3" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-lg border bg-background/70 px-3 py-2">
                  <p className="text-muted-foreground">Model</p>
                  <p className="font-medium">PREVENT 2023</p>
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
              According to American Heart Association risk categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Badge
              variant={interpretationBadgeVariant}
              className={interpretationBadgeClassName}
            >
              {interpretation}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {interpretationDescription}
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
                {showEventBreakdownLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={`event-loading-${index}`}>
                        <TableCell>
                          <Skeleton className="h-4 w-10" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-4 w-12" />
                        </TableCell>
                      </TableRow>
                    ))
                  : eventBreakdown.map((event) => (
                      <TableRow key={event.label}>
                        <TableCell className="font-medium">
                          {event.label}
                        </TableCell>
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
            {showRiskFactorLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`risk-factor-loading-${index}`}>
                  <Skeleton className="h-4 w-28" />
                </div>
              ))
            ) : riskFactors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {riskFactorEmptyMessage}
              </p>
            ) : (
              riskFactors.map((factor, index) => (
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
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
