import {
  CLIN_CALC_URL,
  fieldNameToKey,
  hiddenFieldNames,
} from "@/contracts/v1/clincalc";

import type {
  TClinCalcHiddenFieldName,
  TClinCalcHiddenFields,
  TClinCalcPREVENTAssessmentRequestDTO,
  TClinCalcRiskFactorContributionDTO,
} from "@/contracts/v1/clincalc";

const extractHiddenInputValue = (
  html: string,
  fieldName: TClinCalcHiddenFieldName,
) => {
  const regex = new RegExp(
    `<input[^>]+name=["']${fieldName}["'][^>]*value=["']([^"']*)["']`,
    "i",
  );
  const match = html.match(regex);
  return match ? match[1] : null;
};

export const fetchClinCalcHiddenFields =
  async (): Promise<TClinCalcHiddenFields> => {
    let response: Response;
    try {
      response = await fetch(CLIN_CALC_URL, { cache: "no-store" });
    } catch (error) {
      void error;
      throw new Error("Failed to reach ClinCalc.");
    }

    if (!response.ok) {
      throw new Error(`ClinCalc responded with status ${response.status}.`);
    }

    const html = await response.text();

    const values: Partial<TClinCalcHiddenFields> = {};

    for (const fieldName of hiddenFieldNames) {
      const value = extractHiddenInputValue(html, fieldName);
      if (!value) {
        throw new Error(`Missing ${fieldName} in ClinCalc response.`);
      }
      values[fieldNameToKey[fieldName]] = value;
    }

    return values as TClinCalcHiddenFields;
  };

export const buildClinCalcFormData = (
  payload: TClinCalcPREVENTAssessmentRequestDTO,
  hiddenFields: TClinCalcHiddenFields,
): URLSearchParams => {
  const params = new URLSearchParams();

  params.set("__VIEWSTATE", hiddenFields.viewState);
  params.set("__VIEWSTATEGENERATOR", hiddenFields.viewStateGenerator);
  params.set("__EVENTVALIDATION", hiddenFields.eventValidation);
  params.set("ctl00$cphMainContent$txtAge", payload.age.toString());
  params.set(
    "ctl00$cphMainContent$rdoGender",
    payload.gender === "male" ? "rdoMale" : "rdoFemale",
  );
  params.set("ctl00$cphMainContent$txtTC", payload.totalCholesterol.toString());
  params.set("ctl00$cphMainContent$drpTotalCholesterol", "1");
  params.set("ctl00$cphMainContent$txtHDL", payload.hdlCholesterol.toString());
  params.set("ctl00$cphMainContent$drpHdlCholesterol", "1");
  params.set("ctl00$cphMainContent$txtSBP", payload.systolicBP.toString());
  params.set("ctl00$cphMainContent$hiddenBmi", "divBmiManual");
  params.set("ctl00$cphMainContent$txtBMI", payload.bmi.toString());
  params.set("ctl00$cphMainContent$txtHeight", "");
  params.set("ctl00$cphMainContent$rdoHeight", "rdoIn");
  params.set("ctl00$cphMainContent$txtWeight", "");
  params.set("ctl00$cphMainContent$rdoWeight", "kg");
  params.set("ctl00$cphMainContent$hiddenEgfr", "divEgfrManual");
  params.set("ctl00$cphMainContent$txteGFR", payload.eGFR.toString());
  params.set("ctl00$cphMainContent$txtCreatinine", "");
  params.set("ctl00$cphMainContent$drpCreatinineUnits", "1");
  params.set(
    "ctl00$cphMainContent$rdoDM",
    payload.diabetes ? "rdoDMYes" : "rdoDMNo",
  );
  params.set(
    "ctl00$cphMainContent$rdoSmoker",
    payload.smoker ? "rdoSmokerYes" : "rdoSmokerNo",
  );
  params.set(
    "ctl00$cphMainContent$rdoBPTreatment",
    payload.takingAntihypertensive ? "rdoBPTreatmentYes" : "rdoBPTreatmentNo",
  );
  params.set(
    "ctl00$cphMainContent$rdoStatinTreatment",
    payload.takingStatin ? "rdoStatinYes" : "rdoStatinNo",
  );
  params.set("ctl00$cphMainContent$rdoSdiType", "rdoSdiZip");
  params.set("ctl00$cphMainContent$hiddenSdi", "rdoSdiZip");
  params.set("ctl00$cphMainContent$txtZIP", "");
  params.set("ctl00$cphMainContent$drpSDI", "");
  params.set("ctl00$cphMainContent$txtA1C", "");
  params.set("ctl00$cphMainContent$txtUACR", "");
  params.set("ctl00$cphMainContent$cmdCalculate", "Calculate");
  params.set("ctl00$cphMainContent$ChangeSIUS_Unit", "0");
  params.set("ctl00$txtSearch", "");
  params.set("ctl00$txtOffcanvasSearch", "");

  return params;
};

export const parseClinCalcContributions = (
  html: string,
): TClinCalcRiskFactorContributionDTO[] => {
  const dataTableRegex = /google\.visualization\.arrayToDataTable\([^)]*?\)/;
  const dataTableMatch = html.match(dataTableRegex);
  if (!dataTableMatch) {
    throw new Error("Missing ASCVD risk factors contribution data table.");
  }

  const [dataTable] = dataTableMatch;

  const contributionsRegex =
    /\[\s*"([^"]+)"\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*"[^"]*"\s*,\s*"([^"]+)"\s*]/g;

  const contributionsIterator = dataTable.matchAll(contributionsRegex);

  const contributions: TClinCalcRiskFactorContributionDTO[] = [];

  for (const contribution of contributionsIterator) {
    contributions.push({
      factor: contribution[1],
      value: Number.parseFloat(contribution[2]),
      annotation: contribution[3],
    });
  }

  if (contributions.length === 0) {
    throw new Error("ClinCalc returned no ASCVD risk factor contributions.");
  }

  return contributions;
};
