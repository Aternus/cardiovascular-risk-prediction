"use client";

import {
  readJsonResponse,
  toFriendlyFetchError,
} from "@/app/(authorized)/risk-assessment/_lib/transport";
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
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  eventBreakdownConfig,
  formatPercent,
  formatRiskFactorLabel,
  formatSignedPercent,
  formatUpdatedLabel,
  getInterpretationLabel,
  getPercentFromOutput,
  interpretationDescriptions,
  interpretationLevels,
  parsePreventBreakdown,
  stripHtml,
} from "./_lib/utils";

import type {
  TAssessmentStatus,
  TEventBreakdown,
  TRiskCategory,
  TRiskFactor,
  TRiskFactorImpact,
} from "@/app/(authorized)/risk-assessment/_lib/types";
import type {
  TClinCalcCalculateRiskAssessmentRequestDTO,
  TClinCalcCalculateRiskAssessmentResponseDTO,
} from "@/contracts/v1/clincalc";
import type {
  TmdCalcCalculateRiskAssessmentRequestDTO,
  TmdCalcCalculateRiskAssessmentResponseDTO,
} from "@/contracts/v1/mdcalc";

export default function RiskAssessment() {
  const profileData = useQuery(api.patients.getProfile);
  const intakeData = useQuery(api.intake.getIntake);
  const isQueryResolved = profileData !== undefined && intakeData !== undefined;

  const recordRiskAssessment = useMutation(
    api.riskAssessments.recordRiskAssessment,
  );
  const hasRecordedAssessmentRef = useRef(false);

  const [assessmentStatus, setAssessmentStatus] =
    useState<TAssessmentStatus>("idle");
  const [assessmentErrors, setAssessmentErrors] = useState<string[]>([]);
  const [mdCalcAssessments, setMdCalcAssessments] = useState<
    TmdCalcCalculateRiskAssessmentResponseDTO["assessments"] | null
  >(null);
  const [clinCalcContributions, setClinCalcContributions] = useState<
    TClinCalcCalculateRiskAssessmentResponseDTO["contributions"] | null
  >(null);

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
      setAssessmentErrors([]);

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
        errors.push(toFriendlyFetchError("MdCalc", mdCalcResult.reason));
      }

      if (clinCalcResult.status === "fulfilled") {
        setClinCalcContributions(clinCalcResult.value.contributions);
      } else {
        setClinCalcContributions(null);
        errors.push(toFriendlyFetchError("ClinCalc", clinCalcResult.reason));
      }

      if (errors.length === 0) {
        setAssessmentStatus("success");
        return;
      }

      setAssessmentErrors(Array.from(new Set(errors)));
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

  useEffect(() => {
    if (!isQueryResolved) {
      return;
    }

    if (hasRecordedAssessmentRef.current) {
      return;
    }

    if (assessmentStatus === "loading") {
      return;
    }

    if (assessmentStatus === "idle" && mdCalcPayload && clinCalcPayload) {
      return;
    }

    hasRecordedAssessmentRef.current = true;

    const errors = validationError ? [validationError] : assessmentErrors;
    const inputSnapshot = {
      profile: profileData ?? null,
      intake: intakeData ?? null,
      age,
      mdCalcPayload,
      clinCalcPayload,
    };
    const results = {
      status: assessmentStatus,
      errors,
      mdCalc: mdCalcAssessments,
      clinCalc: clinCalcContributions,
    };

    void recordRiskAssessment({ inputSnapshot, results }).catch(() => {});
  }, [
    isQueryResolved,
    assessmentStatus,
    assessmentErrors,
    validationError,
    profileData,
    intakeData,
    age,
    clinCalcPayload,
    clinCalcContributions,
    mdCalcPayload,
    mdCalcAssessments,
    recordRiskAssessment,
  ]);

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
  const combinedErrors = validationError ? [validationError] : assessmentErrors;
  const hasAssessmentErrors = combinedErrors.length > 0;

  const absoluteRiskDisplay = formatPercent(totalRiskPercent);
  const riskProgressValue =
    totalRiskPercent === null
      ? 0
      : Math.min(100, Math.max(0, (totalRiskPercent / 40) * 100));

  const interpretation: TRiskCategory =
    totalRiskPercent === null
      ? "Unknown"
      : getInterpretationLabel(totalRiskPercent);
  const interpretationDescription =
    interpretation === "Unknown"
      ? "Complete your intake to see your risk category."
      : interpretationDescriptions[interpretation];

  const showStatusCard = hasAssessmentErrors || isMissingData;
  const statusCardTitle = isMissingData
    ? "More information needed"
    : "Assessment unavailable";
  const statusCardDescription = isMissingData
    ? "Complete your intake to generate a risk assessment."
    : "We couldn't retrieve results from the server.";
  const statusMessages = hasAssessmentErrors ? combinedErrors : [];
  const statusCardClassName = isMissingData
    ? "border-chart-4/40 bg-chart-4/15 shadow-md"
    : "border-destructive/40 bg-destructive/10";
  const statusCardTextClassName = isMissingData
    ? "text-foreground"
    : "text-destructive";
  const statusCardTitleClassName = isMissingData
    ? "text-lg font-semibold text-foreground"
    : "text-base text-destructive";

  const interpretationBadgeVariant =
    interpretation === "Unknown" ? "outline" : "default";
  const interpretationBadgeStyles: Record<
    Exclude<TRiskCategory, "Unknown">,
    string
  > = {
    Low: "bg-emerald-700 text-neutral-50 hover:bg-emerald-800",
    Borderline: "bg-yellow-700 text-neutral-50 hover:bg-yellow-800",
    Intermediate: "bg-orange-700 text-neutral-50 hover:bg-orange-800",
    High: "bg-red-700 text-neutral-50 hover:bg-red-800",
  };
  const interpretationBadgeClassName =
    interpretation === "Unknown"
      ? "w-fit border-muted-foreground/30 text-muted-foreground"
      : `w-fit ${interpretationBadgeStyles[interpretation]}`;

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
        <div className="flex flex-col gap-6">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-background via-card to-muted" />
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
                <div className="grid gap-3 text-sm sm:grid-cols-3">
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

          {showStatusCard ? (
            <Card className={statusCardClassName}>
              <CardHeader className="pb-3">
                <CardTitle className={statusCardTitleClassName}>
                  {statusCardTitle}
                </CardTitle>
                <CardDescription className={statusCardTextClassName}>
                  {statusCardDescription}
                </CardDescription>
              </CardHeader>
              {statusMessages.length > 0 ? (
                <CardContent className={`text-sm ${statusCardTextClassName}`}>
                  <div className="flex flex-col gap-1">
                    {statusMessages.map((message, index) => (
                      <span key={`assessment-message-${index}`}>{message}</span>
                    ))}
                  </div>
                </CardContent>
              ) : null}
            </Card>
          ) : null}
        </div>

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
                      ? interpretationBadgeStyles[
                          level.label as Exclude<TRiskCategory, "Unknown">
                        ]
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

      <section className="grid gap-6 overflow-x-auto lg:grid-cols-2">
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
                            ? "bg-green-700 text-green-100 hover:bg-green-900"
                            : "bg-rose-700 text-rose-100 hover:bg-rose-900"
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
