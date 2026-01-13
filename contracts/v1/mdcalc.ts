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

export type TMdCalcBinaryFlagDTO = 0 | 1;

export type TMdCalcPREVENTAssessmentRequestDTO = {
  UOMSYSTEM: boolean;
  model: number;
  sex: TMdCalcBinaryFlagDTO;
  age: number;
  tc: number;
  hdl: number;
  sbp: number;
  diabetes: TMdCalcBinaryFlagDTO;
  smoker: TMdCalcBinaryFlagDTO;
  egfr: number;
  htn_med: TMdCalcBinaryFlagDTO;
  statin: TMdCalcBinaryFlagDTO;
  bmi: number;
};

export type TMdCalcPREVENTAssessmentOutputDTO = {
  name: string;
  value: string;
  value_text: string;
  message: string;
};

export type TMdCalcPREVENTAssessmentResponseDTO = {
  output: TMdCalcPREVENTAssessmentOutputDTO[];
};

export type TCreateMdCalcPreventAssessmentResponseDTO = {
  assessment: TMdCalcPREVENTAssessmentResponseDTO;
};

// TODO: Figure out the best practice with `request: NextRequest`

export const createMdCalcPreventAssessmentSchema = z.object({
  body: mdCalcPreventSchema,
});
