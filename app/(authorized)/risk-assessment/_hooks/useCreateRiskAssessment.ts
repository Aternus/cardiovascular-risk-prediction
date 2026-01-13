import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";

import type {
  TClinCalcCalculateRiskAssessmentRequestDTO,
  TClinCalcCalculateRiskAssessmentResponseDTO,
} from "@/contracts/v1/clincalc";
import type {
  TmdCalcCalculateRiskAssessmentRequestDTO,
  TmdCalcCalculateRiskAssessmentResponseDTO,
} from "@/contracts/v1/mdcalc";
import type { TAssessmentStatus } from "../_lib/types";

type TUseCreateRiskAssessmentParams<TProfile, TIntake> = {
  isQueryResolved: boolean;
  assessmentStatus: TAssessmentStatus;
  assessmentErrors: string[];
  validationError: string | null;
  profileData: TProfile | null | undefined;
  intakeData: TIntake | null | undefined;
  age: number | null;
  mdCalcPayload: TmdCalcCalculateRiskAssessmentRequestDTO | null;
  clinCalcPayload: TClinCalcCalculateRiskAssessmentRequestDTO | null;
  mdCalcAssessments:
    | TmdCalcCalculateRiskAssessmentResponseDTO["assessments"]
    | null;
  clinCalcContributions:
    | TClinCalcCalculateRiskAssessmentResponseDTO["contributions"]
    | null;
};

export const useCreateRiskAssessment = <TProfile, TIntake>({
  isQueryResolved,
  assessmentStatus,
  assessmentErrors,
  validationError,
  profileData,
  intakeData,
  age,
  mdCalcPayload,
  clinCalcPayload,
  mdCalcAssessments,
  clinCalcContributions,
}: TUseCreateRiskAssessmentParams<TProfile, TIntake>) => {
  const createRiskAssessment = useMutation(
    api.riskAssessments.createRiskAssessment,
  );
  const hasCreatedRiskAssessmentRef = useRef(false);

  useEffect(() => {
    if (!isQueryResolved) {
      return;
    }

    if (hasCreatedRiskAssessmentRef.current) {
      return;
    }

    if (assessmentStatus === "loading") {
      return;
    }

    if (
      assessmentStatus === "idle" &&
      mdCalcPayload !== null &&
      clinCalcPayload !== null
    ) {
      return;
    }

    hasCreatedRiskAssessmentRef.current = true;

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

    void createRiskAssessment({ inputSnapshot, results }).catch(() => {});
  }, [
    isQueryResolved,
    assessmentStatus,
    assessmentErrors,
    validationError,
    profileData,
    intakeData,
    age,
    mdCalcPayload,
    clinCalcPayload,
    mdCalcAssessments,
    clinCalcContributions,
    createRiskAssessment,
  ]);
};
