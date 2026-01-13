export type TAssessmentStatus =
  | "idle"
  | "loading"
  | "success"
  | "partial"
  | "error";

export type TRiskCategory =
  | "Low"
  | "Borderline"
  | "Intermediate"
  | "High"
  | "Unknown";

export type TRiskFactorImpact = "Harmful" | "Protective";

export type TRiskFactor = {
  label: string;
  impact: TRiskFactorImpact;
  delta: string;
  strength: number;
};

export type TEventBreakdown = {
  label: string;
  description: string;
  value: string;
};
