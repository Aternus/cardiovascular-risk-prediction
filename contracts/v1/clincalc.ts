import { z } from "zod";

export const CLIN_CALC_URL = "https://clincalc.com/Cardiology/PREVENT/";

export const hiddenFieldNames = [
  "__VIEWSTATE",
  "__VIEWSTATEGENERATOR",
  "__EVENTVALIDATION",
] as const;

export type TClinCalcHiddenFieldName = (typeof hiddenFieldNames)[number];

export type TClinCalcHiddenFields = {
  viewState: string;
  viewStateGenerator: string;
  eventValidation: string;
};

export const fieldNameToKey: Record<
  TClinCalcHiddenFieldName,
  keyof TClinCalcHiddenFields
> = {
  __VIEWSTATE: "viewState",
  __VIEWSTATEGENERATOR: "viewStateGenerator",
  __EVENTVALIDATION: "eventValidation",
};

const genderSchema = z.enum(["male", "female"]);

const clinCalcPreventSchema = z.object({
  age: z.number().int(),
  gender: genderSchema,
  totalCholesterol: z.number(),
  hdlCholesterol: z.number(),
  systolicBP: z.number(),
  bmi: z.number(),
  eGFR: z.number(),
  diabetes: z.boolean(),
  smoker: z.boolean(),
  takingAntihypertensive: z.boolean(),
  takingStatin: z.boolean(),
});

const clinCalcContributionSchema = z.object({
  factor: z.string(),
  value: z.number(),
  annotation: z.string(),
});

export const clinCalcPreventResponseSchema = z.array(
  clinCalcContributionSchema,
);

export type TClinCalcPREVENTAssessmentRequestDTO = z.infer<
  typeof clinCalcPreventSchema
>;

export type TClinCalcRiskFactorContributionDTO = z.infer<
  typeof clinCalcContributionSchema
>;

export type TClinCalcPREVENTAssessmentResponseDTO = z.infer<
  typeof clinCalcPreventResponseSchema
>;

export const clinCalcCalculateRiskAssessmentRequestDTOSchema = z.object({
  body: clinCalcPreventSchema,
});

export type TClinCalcCalculateRiskAssessmentRequestDTO = {
  body: TClinCalcPREVENTAssessmentRequestDTO;
};

export type TClinCalcCalculateRiskAssessmentResponseDTO = {
  contributions: TClinCalcPREVENTAssessmentResponseDTO;
};
