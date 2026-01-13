import { useEffect, useState } from "react";

import { readJsonResponse, toFriendlyFetchError } from "../_lib/transport";

import type {
  TClinCalcCalculateRiskAssessmentRequestDTO,
  TClinCalcCalculateRiskAssessmentResponseDTO,
} from "@/contracts/v1/clincalc";
import type {
  TmdCalcCalculateRiskAssessmentRequestDTO,
  TmdCalcCalculateRiskAssessmentResponseDTO,
} from "@/contracts/v1/mdcalc";
import type { TAssessmentStatus } from "../_lib/types";

type TUseGenerateRiskAssessmentParams = {
  mdCalcPayload: TmdCalcCalculateRiskAssessmentRequestDTO | null;
  clinCalcPayload: TClinCalcCalculateRiskAssessmentRequestDTO | null;
};

type TUseGenerateRiskAssessmentResult = {
  assessmentStatus: TAssessmentStatus;
  assessmentErrors: string[];
  mdCalcAssessments:
    | TmdCalcCalculateRiskAssessmentResponseDTO["assessments"]
    | null;
  clinCalcContributions:
    | TClinCalcCalculateRiskAssessmentResponseDTO["contributions"]
    | null;
};

export const useGenerateRiskAssessment = ({
  mdCalcPayload,
  clinCalcPayload,
}: TUseGenerateRiskAssessmentParams): TUseGenerateRiskAssessmentResult => {
  const [assessmentStatus, setAssessmentStatus] =
    useState<TAssessmentStatus>("idle");
  const [assessmentErrors, setAssessmentErrors] = useState<string[]>([]);

  const [mdCalcAssessments, setMdCalcAssessments] = useState<
    TmdCalcCalculateRiskAssessmentResponseDTO["assessments"] | null
  >(null);

  const [clinCalcContributions, setClinCalcContributions] = useState<
    TClinCalcCalculateRiskAssessmentResponseDTO["contributions"] | null
  >(null);

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

  return {
    assessmentStatus,
    assessmentErrors,
    mdCalcAssessments,
    clinCalcContributions,
  };
};
