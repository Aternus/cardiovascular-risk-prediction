import { z } from "zod";

const binaryFlagSchema = z.union([z.literal(0), z.literal(1)]);

const mdCalcPreventSchema = z.object({
  UOMSYSTEM: z.boolean(),
  model: z.number().int(),
  sex: binaryFlagSchema,
  age: z.number().int(),
  tc: z.number(),
  hdl: z.number(),
  sbp: z.number(),
  diabetes: binaryFlagSchema,
  smoker: binaryFlagSchema,
  egfr: z.number(),
  htn_med: binaryFlagSchema,
  statin: binaryFlagSchema,
  bmi: z.number(),
});

export const mdCalcPreventResponseSchema = z.object({
  output: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      value_text: z.string(),
      message: z.string(),
    }),
  ),
});

export type TMdCalcPREVENTAssessmentRequestDTO = z.infer<
  typeof mdCalcPreventSchema
>;

export type TMdCalcPREVENTAssessmentResponseDTO = z.infer<
  typeof mdCalcPreventResponseSchema
>;

export const mdCalcCalculateRiskAssessmentRequestDTOSchema = z.object({
  body: mdCalcPreventSchema,
});

export type TmdCalcCalculateRiskAssessmentResponseDTO = {
  assessment: TMdCalcPREVENTAssessmentResponseDTO;
};
