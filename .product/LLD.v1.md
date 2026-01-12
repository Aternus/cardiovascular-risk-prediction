# Cardiovascular Risk Prediction System - Low Level Design

## Tech Stack

1. Backend: Convex
   - Multi-model DB + queries/mutations/actions.
   - Mutations are transactional.
   - HTTP Actions via `httpRouter()` to expose a versioned REST API when needed.
2. Frontend: Next.js (App Router)
   - React Framework + TypeScript
   - Use Server Components by default, with Server Actions / Route Handlers for server-side calls.
3. UI: shadcn/ui
   - A hybrid between headless components and a component library approaches.
   - Allows easy adjustment and extensibility.
4. AuthN/AuthZ: Convex Auth (Magic Link)
   - Passwordless email “magic link” flow.
5. Deployment
   - Backend: Convex managed deployment
   - Frontend: Node.js application on Render

## Data Collection

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

To simplify the implementation we will focus on **single tenant per user**:

- A signed-in **User** (clinician) owns multiple **Patients**.
- Every read/write checks `ownerUserId` (from auth) matches the patient’s `ownerUserId`.

Convex notes:

- Each document has `_id` and `_creationTime` automatically.
- Store all timestamps as `number` unix ms for consistent sorting/filtering.

### Table: `patients`

Core patient profiles.

Fields:

- \_id
- ownerUserId (string; e.g. auth `tokenIdentifier`)
- firstName (string)
- lastName (string)
- sexAtBirth ("FEMALE" | "MALE")
- dateOfBirth (YYYY-MM-DD string)
- isActive (boolean; soft delete sets false)

Indexes (recommended):

- by_ownerUserId
- by_ownerUserId_isActive_createdAt (optional composite via fields you store)

### Table: `patientMeasurements`

Time-series numeric facts.

Fields:

- \_id
- patientId (ref `patients`)
- kind ("TOTAL_CHOLESTEROL" | "HDL_CHOLESTEROL" | "SYSTOLIC_BP" | "BMI" | "EGFR")
- value (number)
- unit (string; store submitted unit, normalize at compute time)
- measuredAt (unix ms)
- source ("CLINICIAN" | "IMPORT")

Indexes (recommended):

- by_patientId_measuredAt
- by_patientId_kind_measuredAt

### Table: `patientClinicalEvents`

Time-series **boolean flags** required by the PREVENT model.  
Use an append-only timeline and treat the **latest** event per `kind` as the current value.

Fields:

- \_id
- patientId (ref `patients`)
- kind ("DIABETES" | "SMOKER" | "ON_ANTIHYPERTENSIVE" | "ON_STATIN")
- value (boolean)
- recordedAt (unix ms)
- source ("CLINICIAN" | "IMPORT")

Indexes (recommended):

- by_patientId_recordedAt
- by_patientId_kind_recordedAt

### Table: `riskAssessments`

Each time we compute PREVENT, write an assessment record.

Fields:

- \_id
- patientId (ref `patients`)
- model ("PREVENT")
- modelVersion ("2023")
- inputSnapshot (denormalized JSON; exactly what was sent to the calculator after normalization)
- results (JSON; 10y + 30y sets)

Indexes (recommended):

- by_patientId_createdAt

### Table: `recommendations`

Rule-based recommendations derived from an assessment.

Fields:

- \_id
- patientId (ref `patients`)
- assessmentId (ref `riskAssessments`)
- rulesetId (e.g. "CVD_RECOMMENDATIONS_20260112")
- items (RecommendationItem[])

Indexes (recommended):

- by_patientId_assessmentId

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

Bulk API convention: any resource that needs to accept an array of entities should use a dedicated endpoint, example: `POST /api/v1/patients/{patientId}/measurements/bulk`. This allows consistent visibility into the API structure and proper separation between single and bulk logic.

Implementation (selected stack):

- **Convex HTTP Actions** define the REST endpoints (e.g. in `convex/http.ts` using `httpRouter()`).
- **Next.js App Router** may optionally proxy these endpoints via Route Handlers if you want “same-origin” requests from the browser, but the canonical implementation lives in Convex.

### External

For the MVP:

- **MdCalc** is used to compute PREVENT risks (clean JSON response).
- **ClinCalc** contribution breakdown is implemented as best-effort scraping (no public API). This is brittle and may be restricted by their terms; treat it as a prototype integration; prefer a licensed/official source in a production system.

All external calls are performed server-side (Convex actions / HTTP Actions) to avoid leaking keys/cookies and to sidestep browser CORS.

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

Implementation note (selected stack):

- **Primary**: the UI talks to **Convex queries/mutations/actions** directly (best DX).
- **Optional REST layer**: expose a versioned REST API (`/api/v1/...`) using **Convex HTTP Actions** (via `httpRouter()`), mainly for:
  - a stable contract for external clients,
  - or proxying through Next.js Route Handlers for “same-origin” calls.

Below is the REST surface (versioned) plus the DTOs. Convex function names can mirror these operations 1:1.

---

#### Common types

```typescript
export type CursorDto = string;

export type SortDirDto = 'asc' | 'desc';

export type PaginationQueryDto = {
  limit?: number; // default 50
  cursor?: CursorDto;
};

export type AuditDto = {
  createdAt: number; // unix ms (maps to Convex _creationTime)
  updatedAt?: number; // unix ms (if you choose to maintain explicitly)
};
```

---

#### Patients

```typescript
export type SexAtBirthDto = 'female' | 'male';

export type PatientDto = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  sexAtBirth: SexAtBirthDto;
  isActive: boolean;
} & AuditDto;

export type PatientCreateDto = {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  sexAtBirth: SexAtBirthDto;
};

export type PatientUpdateDto = Partial<PatientCreateDto> & {
  isActive?: boolean;
};
```

`POST /api/v1/patients`

```typescript
export type CreatePatientRequestDTO = { body: PatientCreateDto };
export type CreatePatientResponseDTO = { patient: PatientDto };
```

`GET /api/v1/patients`

```typescript
export type ListPatientsRequestDTO = {
  query?: PaginationQueryDto & {
    search?: string;
    sort?: 'createdAt' | '-createdAt';
  };
};

export type ListPatientsResponseDTO = {
  items: PatientDto[];
  nextCursor?: CursorDto;
};
```

`GET /api/v1/patients/{patientId}`

```typescript
export type GetPatientRequestDTO = { patientId: string };
export type GetPatientResponseDTO = { patient: PatientDto };
```

`PATCH /api/v1/patients/{patientId}`

```typescript
export type UpdatePatientRequestDTO = {
  patientId: string;
  body: PatientUpdateDto;
};
export type UpdatePatientResponseDTO = { patient: PatientDto };
```

`DELETE /api/v1/patients/{patientId}` (soft delete)

```typescript
export type DeletePatientRequestDTO = { patientId: string };
export type DeletePatientResponseDTO = { deleted: true };
```

---

#### Patient Measurements

These are time-series numeric facts (lab / vitals). We keep a _kind + value + unit + measuredAt_ record.

```typescript
export type MeasurementKindDto =
  | 'TOTAL_CHOLESTEROL'
  | 'HDL_CHOLESTEROL'
  | 'SYSTOLIC_BP'
  | 'BMI'
  | 'EGFR';

export type MeasurementSourceDto = 'PATIENT' | 'CLINICIAN' | 'IMPORT';

export type PatientMeasurementDto = {
  id: string;
  patientId: string;
  kind: MeasurementKindDto;
  value: number;
  unit: string; // store the unit submitted; normalize at compute time
  measuredAt: number; // unix ms
  source: MeasurementSourceDto;
} & AuditDto;

export type PatientMeasurementCreateDto = Omit<
  PatientMeasurementDto,
  'id' | 'createdAt' | 'updatedAt'
>;

export type PatientMeasurementUpdateDto = Partial<
  Pick<PatientMeasurementCreateDto, 'value' | 'unit' | 'measuredAt' | 'source'>
>;
```

`POST /api/v1/patients/{patientId}/measurements`

```typescript
export type CreatePatientMeasurementRequestDTO = {
  patientId: string;
  body: Omit<PatientMeasurementCreateDto, 'patientId'>;
};

export type CreatePatientMeasurementResponseDTO = {
  measurement: PatientMeasurementDto;
};
```

`POST /api/v1/patients/{patientId}/measurements/bulk`

```typescript
export type CreatePatientMeasurementsBulkRequestDTO = {
  patientId: string;
  body: Array<Omit<PatientMeasurementCreateDto, 'patientId'>>;
};

export type CreatePatientMeasurementsBulkResponseDTO = {
  items: PatientMeasurementDto[];
};
```

`GET /api/v1/patients/{patientId}/measurements`

```typescript
export type ListPatientMeasurementsRequestDTO = {
  patientId: string;
  query?: PaginationQueryDto & {
    kind?: MeasurementKindDto;
    measuredAfter?: number; // unix ms
    measuredBefore?: number; // unix ms
    sort?: 'measuredAt' | '-measuredAt';
  };
};

export type ListPatientMeasurementsResponseDTO = {
  items: PatientMeasurementDto[];
  nextCursor?: CursorDto;
};
```

`PATCH /api/v1/patients/{patientId}/measurements/{measurementId}`

```typescript
export type UpdatePatientMeasurementRequestDTO = {
  patientId: string;
  measurementId: string;
  body: PatientMeasurementUpdateDto;
};

export type UpdatePatientMeasurementResponseDTO = {
  measurement: PatientMeasurementDto;
};
```

`DELETE /api/v1/patients/{patientId}/measurements/{measurementId}`

```typescript
export type DeletePatientMeasurementRequestDTO = {
  patientId: string;
  measurementId: string;
};

export type DeletePatientMeasurementResponseDTO = { deleted: true };
```

---

#### Patient Clinical Events (boolean flags)

```typescript
export type ClinicalEventKindDto =
  | 'DIABETES'
  | 'SMOKER'
  | 'ON_ANTIHYPERTENSIVE'
  | 'ON_STATIN';

export type ClinicalEventSourceDto = 'PATIENT' | 'CLINICIAN' | 'IMPORT';

export type PatientClinicalEventDto = {
  id: string;
  patientId: string;
  kind: ClinicalEventKindDto;
  value: boolean;
  recordedAt: number; // unix ms
  source: ClinicalEventSourceDto;
} & AuditDto;

export type PatientClinicalEventCreateDto = Omit<
  PatientClinicalEventDto,
  'id' | 'createdAt' | 'updatedAt'
>;
```

`POST /api/v1/patients/{patientId}/clinical-events`

```typescript
export type CreatePatientClinicalEventRequestDTO = {
  patientId: string;
  body: Omit<PatientClinicalEventCreateDto, 'patientId'>;
};

export type CreatePatientClinicalEventResponseDTO = {
  event: PatientClinicalEventDto;
};
```

`POST /api/v1/patients/{patientId}/clinical-events/bulk`

```typescript
export type CreatePatientClinicalEventsBulkRequestDTO = {
  patientId: string;
  body: Array<Omit<PatientClinicalEventCreateDto, 'patientId'>>;
};

export type CreatePatientClinicalEventsBulkResponseDTO = {
  items: PatientClinicalEventDto[];
};
```

`GET /api/v1/patients/{patientId}/clinical-events`

```typescript
export type ListPatientClinicalEventsRequestDTO = {
  patientId: string;
  query?: PaginationQueryDto & {
    kind?: ClinicalEventKindDto;
    sort?: 'recordedAt' | '-recordedAt';
  };
};

export type ListPatientClinicalEventsResponseDTO = {
  items: PatientClinicalEventDto[];
  nextCursor?: CursorDto;
};
```

---

#### Risk Assessments

A risk assessment is computed from a **snapshot** (latest measurement per kind + latest clinical flag per kind + computed age).

```typescript
export type RiskModelDto = 'PREVENT';
export type RiskModelVersionDto = '2023';
export type TimeHorizonDto = '10_YEARS' | '30_YEARS';

export type PreventRiskSetDto = {
  totalCVD: string;
  ASCVD: string;
  heartFailure: string;
  coronaryHeartDisease: string;
  stroke: string;
};

export type RiskAssessmentResultDto = {
  timeHorizon: TimeHorizonDto;
  setName: 'RISKS';
  setUnits: '%';
  data: PreventRiskSetDto;
};

export type RiskAssessmentDto = {
  id: string;
  patientId: string;
  model: RiskModelDto;
  modelVersion: RiskModelVersionDto;
  inputSnapshot: Record<string, unknown>;
  results: RiskAssessmentResultDto[]; // typically 10y + 30y
} & AuditDto;
```

`POST /api/v1/patients/{patientId}/risk-assessments`

Computes a new assessment using external sources and stores it.

```typescript
export type CreateRiskAssessmentRequestDTO = {
  patientId: string;
  body?: {
    // optional override; if omitted, server derives snapshot from DB
    inputSnapshotOverride?: Record<string, unknown>;
  };
};

export type CreateRiskAssessmentResponseDTO = {
  assessment: RiskAssessmentDto;
};
```

`GET /api/v1/patients/{patientId}/risk-assessments`

```typescript
export type ListRiskAssessmentsRequestDTO = {
  patientId: string;
  query?: PaginationQueryDto & {
    sort?: 'createdAt' | '-createdAt';
  };
};

export type ListRiskAssessmentsResponseDTO = {
  items: RiskAssessmentDto[];
  nextCursor?: CursorDto;
};
```

`GET /api/v1/patients/{patientId}/risk-assessments/{assessmentId}`

```typescript
export type GetRiskAssessmentRequestDTO = {
  patientId: string;
  assessmentId: string;
};

export type GetRiskAssessmentResponseDTO = {
  assessment: RiskAssessmentDto;
};
```

---

#### Recommendations

Recommendations are produced from:

1. the risk results AND
2. rule-based logic

```typescript
export type RecommendationPriorityDto = 1 | 2 | 3;

export type RecommendationItemDto = {
  code: string; // stable identifier, e.g. STOP_SMOKING
  title: string;
  summary: string;
  rationale: string;
  priority: RecommendationPriorityDto;
  tags: string[];
  ruleHits: string[];
};

export type RecommendationsDto = {
  id: string;
  patientId: string;
  assessmentId: string;
  rulesetId: string; // e.g. CVD_RECOMMENDATIONS_20260112
  items: RecommendationItemDto[];
} & AuditDto;
```

`GET /api/v1/patients/{patientId}/risk-assessments/{assessmentId}/recommendations`

```typescript
export type GetRecommendationsRequestDTO = {
  patientId: string;
  assessmentId: string;
};

export type GetRecommendationsResponseDTO = {
  recommendations: RecommendationsDto | null; // null if not generated
};
```

`POST /api/v1/patients/{patientId}/risk-assessments/{assessmentId}/recommendations`

(Re)generate recommendations for an assessment (idempotent per `rulesetId`).

```typescript
export type UpsertRecommendationsRequestDTO = {
  patientId: string;
  assessmentId: string;
  body?: {
    rulesetId?: string; // optional override; otherwise server picks latest
  };
};

export type UpsertRecommendationsResponseDTO = {
  recommendations: RecommendationsDto;
};
```

## Modules

1. Convex (backend)
   1. `patients` (queries/mutations)
   2. `measurements` (queries/mutations)
   3. `clinicalEvents` (queries/mutations)
   4. `riskAssessments` (actions + queries)
   5. `recommendations` (mutations + queries)
   6. `http` (HTTP Actions router: REST endpoints + webhooks)
2. Core (shared logic)
   1. Domains: Patient, Units
   2. Models: PREVENT (routing-ready)
   3. Engines: Risk, Recommendation
3. Next.js (frontend)
   1. Auth UI (magic link)
   2. Patients UI
   3. Patient detail & assessment UI

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
