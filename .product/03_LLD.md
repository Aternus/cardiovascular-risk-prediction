# Cardiovascular Risk Prediction System - Low Level Design

## Tech Stack

1. Backend: Convex
   1. Easy to use, real-time Backend.
   2. Includes multi-model DB (Document based + Relational + Key Value, similar to PostgreSQL).
   3. Transactional.
   4. Great DX with LLMs.
2. Frontend: Next.js
   1. Easy to use, highly standardized Frontend (React) with Backend capabilities.

## Data collection

### PREVENT 2023: Fields and Valid Values

Note: values outside the stated ranges should be clamped to the nearest valid value by the calculator; risk estimates may be less accurate.

Required fields:

- age (integer, years)
  - valid range: 30–79
- gender (string)
  - allowed values: "male", "female"
- totalCholesterol (float, mg/dL)
  - valid range: 130–320
- hdlCholesterol (float, mg/dL)
  - valid range: 20–100
- systolicBP (float, mmHg)
  - valid range: 90–200
- bmi (float, kg/m2)
  - valid range: 18.5–39.9
- eGFR (float, mL/min/1.73 m2) — CKD‑EPI 2021
  - valid range: 15–150
- diabetes (boolean)
- smoker (boolean)
- takingAntihypertensive (boolean)
- takingStatin (boolean)

Example:

```json
{
  "age": 55,
  "gender": "male",
  "totalCholesterol": 190,
  "hdlCholesterol": 50,
  "systolicBP": 130,
  "bmi": 27.4,
  "eGFR": 85,
  "diabetes": false,
  "smoker": true,
  "takingAntihypertensive": false,
  "takingStatin": true
}
```

## DB

To simplify the implementation we will focus on single tenant - patient can be assigned to a single user.

### Patients

Keeps track of all the core patient profiles. IMPORTANT since we want a single Clinician to be able to work with multiple patients.

Fields:

1. id (UUID unique)
2. ownerUserId
3. firstName
4. lastName
5. sexAtBirth
6. dateOfBirth
7. isActive
8. createdAt
9. updatedAt

### Patient Measurements

Time series facts. Keeps track of all the measurements performed per patient profile.

Fields:

1. id (UUID unique)
2. patientId (UUID foreign key)
3. kind: "TOTAL_CHOLESTEROL" | "HDL_CHOLESTEROL" | "SYSTOLIC_BP" | "BMI" | "EGFR"
4. value
5. unit
6. measuredAt
7. source: "CLINICIAN" | "IMPORT"
8. createdAt

### Patient Clinical Events

Time series facts. Keep track of the the clinical events associated with the patient.

Fields:

1. id (UUID unique)
2. patientId (UUID foreign key)
3. kind: "DIABETES" | "SMOKING_STATUS" | "ON_ANTIHYPERTENSIVE" | "ON_STATIN"
4. source: "CLINICIAN" | "IMPORT"
5. createdAt

### Risk Assessments

Each time we compute PREVENT, write an assessment record.

Fields:

1. id (UUID unique)
2. patientId (UUID foreign key)
3. model: "PREVENT"
4. modelVersion: "2023"
5. timeHorizon: "10_YEARS"
6. inputSnapshot: denormalized JSON
7. result: JSON
8. createdAt

### Recommendations

Keep track of all the inferred (rule based) recommendations per patient and assessment.

Fields:

1. id (UUID unique)
2. patientId (UUID foreign key)
3. assessmentId (UUID foreign key)
4. rulesetId: e.g. "CVD_RECOMMENDATIONS_20260111"
5. items: RecommendationItem[]
6. createdAt

RecommendationItem example:

```json
[
  {
    "code": "STOP_SMOKING",
    "title": "Advise smoking cessation",
    "summary": "Recommend cessation resources and pharmacotherapy as appropriate.",
    "rationale": "Smoking substantially increases cardiovascular risk; cessation reduces risk.",
    "priority": 1, // 1-3
    "tags": ["lifestyle", "smoking"],
    "ruleHits": ["rule_smoking_current"]
  }
]
```

## APIs

Bulk API convention: any resource that needs to accept an array of entities should use a dedicated endpoint, example: `POST /api/v1/patients/{patientId}/measurements/bulk`. This allows consistent visibility into the API structure and properly separation between single and bulk logic.

### External

We will utilize the MdCalc API for main functionality and ClinCalc API for Risk Factor Contribution.

### Calculate Risk using MdCalc API

We can use the following request to get a result (MdCalcPREVENTAssessmentRequestDTO):

```shell
curl --location 'https://www.mdcalc.com/api/v1/calc/10491/calculate' \
--header 'Content-Type: application/json' \
--data '{
    "UOMSYSTEM": true,
    "model": 0,
    "sex": 1,
    "age": 36,
    "tc": 150,
    "hdl": 60,
    "sbp": 120,
    "diabetes": 0,
    "smoker": 0,
    "egfr": 100,
    "htn_med": 0,
    "statin": 0,
    "bmi": 22.6
}'
```

Expected response (MdCalcPREVENTAssessmentResponseDTO):

```json
{
  "output": [
    {
      "name": "mini",
      "value": "0.62",
      "value_text": "%",
      "message": "10-Year Total CVD Risk"
    },
    {
      "name": "10491_PREVENT_result (10 years)",
      "value": "0.62",
      "value_text": "%",
      "message": "10-Year Total CVD Risk<br/><br/>10-Year ASCVD Risk: 0.40%<br/>10-Year Heart Failure Risk: 0.26%<br/>10-Year Coronary Heart Disease Risk: 0.16%<br/>10-Year Stroke Risk: 0.28%"
    },
    {
      "name": "10491_PREVENT_result (30 years)",
      "value": "4.75",
      "value_text": "%",
      "message": "30-Year Total CVD Risk<br/><br/>30-Year ASCVD Risk: 2.91%<br/>30-Year Heart Failure Risk: 2.25%<br/>30-Year Coronary Heart Disease Risk: 1.19%<br/>30-Year Stroke Risk: 2.08%"
    }
  ]
}
```

### Calculate Risk using ClinCalc API

ClinCalc doesn't actually have a public API.

We need to access their page at `https://clincalc.com/Cardiology/PREVENT/` and get `__VIEWSTATEGENERATOR`, `__VIEWSTATE`, `__EVENTVALIDATION` values from the page's HTML.

Then we can use the following request to get a result (ClinCalcPREVENTAssessmentRequestDTO):

```shell
curl --location 'https://clincalc.com/Cardiology/PREVENT/' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode '__VIEWSTATE=REDACTED' \
--data-urlencode '__VIEWSTATEGENERATOR=REDACTED' \
--data-urlencode '__EVENTVALIDATION=REDACTED' \
--data-urlencode 'ctl00%24cphMainContent%24txtAge=36' \
--data-urlencode 'ctl00%24cphMainContent%24rdoGender=rdoMale' \
--data-urlencode 'ctl00%24cphMainContent%24txtTC=150' \
--data-urlencode 'ctl00%24cphMainContent%24drpTotalCholesterol=1' \
--data-urlencode 'ctl00%24cphMainContent%24txtHDL=60' \
--data-urlencode 'ctl00%24cphMainContent%24drpHdlCholesterol=1' \
--data-urlencode 'ctl00%24cphMainContent%24txtSBP=120' \
--data-urlencode 'ctl00%24cphMainContent%24hiddenBmi=divBmiManual' \
--data-urlencode 'ctl00%24cphMainContent%24txtBMI=22.6' \
--data-urlencode 'ctl00%24cphMainContent%24txtHeight=' \
--data-urlencode 'ctl00%24cphMainContent%24rdoHeight=rdoIn' \
--data-urlencode 'ctl00%24cphMainContent%24txtWeight=' \
--data-urlencode 'ctl00%24cphMainContent%24rdoWeight=kg' \
--data-urlencode 'ctl00%24cphMainContent%24hiddenEgfr=divEgfrManual' \
--data-urlencode 'ctl00%24cphMainContent%24txteGFR=100' \
--data-urlencode 'ctl00%24cphMainContent%24txtCreatinine=' \
--data-urlencode 'ctl00%24cphMainContent%24drpCreatinineUnits=1' \
--data-urlencode 'ctl00%24cphMainContent%24rdoDM=rdoDMNo' \
--data-urlencode 'ctl00%24cphMainContent%24rdoSmoker=rdoSmokerYes' \
--data-urlencode 'ctl00%24cphMainContent%24rdoBPTreatment=rdoBPTreatmentNo' \
--data-urlencode 'ctl00%24cphMainContent%24rdoStatinTreatment=rdoStatinNo' \
--data-urlencode 'ctl00%24cphMainContent%24rdoSdiType=rdoSdiZip' \
--data-urlencode 'ctl00%24cphMainContent%24hiddenSdi=rdoSdiZip' \
--data-urlencode 'ctl00%24cphMainContent%24txtZIP=' \
--data-urlencode 'ctl00%24cphMainContent%24drpSDI=' \
--data-urlencode 'ctl00%24cphMainContent%24txtA1C=' \
--data-urlencode 'ctl00%24cphMainContent%24txtUACR=' \
--data-urlencode 'ctl00%24cphMainContent%24cmdCalculate=Calculate' \
--data-urlencode 'ctl00%24cphMainContent%24ChangeSIUS_Unit=0' \
--data-urlencode 'ctl00%24txtSearch=' \
--data-urlencode 'ctl00%24txtOffcanvasSearch='
```

The expected response is an HTML page markup (text) -> ClinCalcPREVENTAssessmentResponseDTO.
What we're interested in that page is the `drawChart_ASCVDContribution` function which has the data about the risk factors stored in the `data` constant.

Example:

```js
function drawChart_ASCVDContribution() {
  const data = google.visualization.arrayToDataTable([
    [
      'Risk Factor',
      '% Contribution',
      { type: 'string', role: 'style' },
      { type: 'string', role: 'annotation' },
    ],
    ['Age', -52, '#00ad00', '52%'],
    ['Total Cholesterol', -10, '#00ad00', '10%'],
    ['Systolic BP', -10, '#00ad00', '10%'],
    ['HDL', -5, '#00ad00', '5%'],
    ['eGFR', -1, '#00ad00', '1%'],
    ['Smoking', 22, '#ad0000', '22%'],
  ]);

  // there will be more code here...
}
```

### Internal

#### Patients

```typescript
export type SexAtBirth = 'female' | 'male';

export type PatientDto = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  sexAtBirth: SexAtBirth;
};

export type PatientCreateDto = {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  sexAtBirth: SexAtBirth;
};

export type PatientUpdateDto = Partial<PatientCreateDto>;
```

`POST /api/v1/patients`

Create a patient profile under the current user.

```typescript
export type CreatePatientRequest = {
  body: PatientCreateDto;
};

export type CreatePatientResponse = {
  patient: PatientDto;
};
```

`PATCH /api/v1/patients/{patientId}`

Update a patient profile.
Checks if the patient profile is assigned to the current user.

```typescript
export type UpdatePatientRequest = {
  patientId: string;
  body: PatientUpdateDto;
};

export type UpdatePatientResponse = {
  patient: PatientDto;
};
```

`DELETE /api/v1/patients/{patientId}`

Delete a patient profile.
Checks if the patient profile is assigned to the current user.
Soft delete: removes it from the result of the list queries.

```typescript
export type DeletePatientRequest = {
  patientId: string;
};

export type DeletePatientResponse = {
  deleted: true;
};
```

`GET /api/v1/patients`

Return the list of patient profiles under the current user.

```typescript
export type ListPatientsRequest = {
  query?: {
    search?: string;
    limit?: number;
    cursor?: string;
    sort?: 'createdAt' | '-createdAt';
  };
};

export type ListPatientsResponse = {
  items: PatientDto[];
  nextCursor?: string;
};
```

#### Patient Measurements

```typescript

```

#### Patient Clinical Events

```typescript

```

#### Risk Assessments

`POST /api/v1/risk-assessments`

Assess the risk for a patient.

The handler will use the MdCalc and ClinCalc external APIs (in parallel) to gather the risk data for the patient and construct the risk result. The main data source should be MdCalc as their response is the cleanest with ClinCalc used for Risk Factors extraction (via scraping).

```typescript

```

#### Recommendations

```typescript

```

## Modules

1. API
2. Core
   1. Domains: Patient, Units
   2. Models: PREVENT
   3. Engines: Risk, Recommendation

## Risk Calculator Model Routing

1. Create a `RiskModel` interface and a `ModelRegistry`.
2. For MVP, registry only returns `Prevent2023Model`.
3. Add a `TODO` in a placeholder branch for `SCORE2` (Europe).

## Unit Handling

1. Create functions for converting units from/to US/SI (mg/dL, mmol/L).
   - The functions return value should include the original input and units, e.g.
   ```js
   return {
     original: { value: 1, unit: 'mg/dL' },
     value: 0.056,
     unit: 'mmol/L',
   };
   ```
2. Create functions for calculating `eGFR` and `BMI`.
   - The functions should validate inputs and provide descriptive errors.

## Separate Risk Calculator from Recommendations

Allows us to provide a disclaimer such as:
Calculator is clinically sourced. Suggestions are based on heuristics.

```js
const patientRiskResult = RiskEngine.calculate(patientData);
const patientRecommendation = RecommendationEngine.generate(patientRiskResult);
```

## UI

1. Login Page (login via magic link sent to the email)
2. Patients List Page
   1. Create Patient button: open a side drawer that allows filling in Patients record + Patient Measurements record + Patient Clinical Events record
   2. Patients Table with columns:
      1. First Name
      2. Last Name
      3. If there was a previously performed risk assessment for the patient:
         1. Risk of CVD as Low/Borderline/Intermediate/High using totalCVD value
         2. totalCVD as percentage
      4. View Patient Page button
3. View Patient Page

   1. Provide measurements button: side drawer that adds Patient Measurements record.
   2. Report clinical event button: side drawer that adds Patient Clinical Events record.
   3. Perform Risk Assessment button: invokes analysis which generates Risk Assessments record + Recommendations record and enters the patient page into "loading" state.
   4. If there was a previously performed risk assessment:

      1. Your risk of having a Cardiovascular (CV) Event with the next 10 years is `totalCVD`
      2. According to the AHA Cardiovascular Disease (CVD) interpretation, it is considered:
         1. Low
         2. Borderline
         3. Intermediate
         4. High
      3. Break down of CV events ranked by probability:
         1. CHD
         2. Stroke
         3. HF
      4. Contribution of each Risk Factor (based on ClinCalc API):

         - Each factor affecting 10-year ASCVD risk can be measured on its own, whether it is protective (reducing risk) or harmful (increasing risk).

         1. Age
         2. Total Cholesterol
         3. Systolic BP
         4. HDL
         5. eGFR

      5. Recommendations (rule-based)
