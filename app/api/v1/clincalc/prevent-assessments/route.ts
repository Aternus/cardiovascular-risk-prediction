import {
  CLIN_CALC_URL,
  clinCalcCalculateRiskAssessmentRequestDTOSchema,
  clinCalcPreventResponseSchema,
} from "@/contracts/v1/clincalc";
import { NextRequest, NextResponse } from "next/server";

import {
  buildClinCalcFormData,
  fetchClinCalcHiddenFields,
  parseClinCalcContributions,
} from "./_lib/utils";

import type { TClinCalcCalculateRiskAssessmentResponseDTO } from "@/contracts/v1/clincalc";

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
    clinCalcCalculateRiskAssessmentRequestDTOSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        issues: parsedPayload.error.flatten(),
      },
      { status: 400 },
    );
  }

  let hiddenFields: Awaited<ReturnType<typeof fetchClinCalcHiddenFields>>;
  try {
    hiddenFields = await fetchClinCalcHiddenFields();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json(
      {
        error: "Failed to initialize ClinCalc request.",
        details: message,
      },
      { status: 502 },
    );
  }

  const requestBody = parsedPayload.data.body;
  const formBody = buildClinCalcFormData(requestBody, hiddenFields);

  let clinCalcResponse: Response;
  try {
    clinCalcResponse = await fetch(CLIN_CALC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
      cache: "no-store",
    });
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: "Failed to reach ClinCalc." },
      { status: 502 },
    );
  }

  if (!clinCalcResponse.ok) {
    return NextResponse.json(
      {
        error: "ClinCalc responded with an error.",
        status: clinCalcResponse.status,
      },
      { status: 502 },
    );
  }

  let clinCalcPayload: string;
  try {
    clinCalcPayload = await clinCalcResponse.text();
  } catch (error) {
    void error;
    return NextResponse.json(
      { error: "ClinCalc returned unreadable content." },
      { status: 502 },
    );
  }

  let contributions;
  try {
    contributions = parseClinCalcContributions(clinCalcPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json(
      {
        error: "ClinCalc response did not include contribution data.",
        details: message,
      },
      { status: 502 },
    );
  }

  const parsedResponse = clinCalcPreventResponseSchema.safeParse(contributions);
  if (!parsedResponse.success) {
    return NextResponse.json(
      {
        error: "ClinCalc response shape was unexpected.",
        issues: parsedResponse.error.flatten(),
      },
      { status: 502 },
    );
  }

  const responseBody: TClinCalcCalculateRiskAssessmentResponseDTO = {
    contributions: parsedResponse.data,
  };

  return NextResponse.json(responseBody, { status: 201 });
}
