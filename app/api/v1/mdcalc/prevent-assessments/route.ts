import {
  mdCalcCalculateRiskAssessmentRequestDTOSchema,
  mdCalcPreventResponseSchema,
} from "@/contracts/v1/mdcalc";
import { NextRequest, NextResponse } from "next/server";

import type {
  TmdCalcCalculateRiskAssessmentResponseDTO,
  TMdCalcPREVENTAssessmentRequestDTO,
} from "@/contracts/v1/mdcalc";

const MD_CALC_URL = "https://www.mdcalc.com/api/v1/calc/10491/calculate";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const parsedPayload =
    mdCalcCalculateRiskAssessmentRequestDTOSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        issues: parsedPayload.error.flatten(),
      },
      { status: 400 },
    );
  }

  const requestBody: TMdCalcPREVENTAssessmentRequestDTO =
    parsedPayload.data.body;

  let mdCalcResponse: Response;
  try {
    mdCalcResponse = await fetch(MD_CALC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: "Failed to reach MdCalc." },
      { status: 502 },
    );
  }

  if (!mdCalcResponse.ok) {
    return NextResponse.json(
      {
        error: "MdCalc responded with an error.",
        status: mdCalcResponse.status,
      },
      { status: 502 },
    );
  }

  let mdCalcPayload: unknown;
  try {
    mdCalcPayload = await mdCalcResponse.json();
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: "MdCalc returned invalid JSON." },
      { status: 502 },
    );
  }

  const parsedResponse = mdCalcPreventResponseSchema.safeParse(mdCalcPayload);
  if (!parsedResponse.success) {
    return NextResponse.json(
      {
        error: "MdCalc response shape was unexpected.",
        issues: parsedResponse.error.flatten(),
      },
      { status: 502 },
    );
  }

  const responseBody: TmdCalcCalculateRiskAssessmentResponseDTO = {
    assessment: parsedResponse.data,
  };

  return NextResponse.json(responseBody, { status: 201 });
}
