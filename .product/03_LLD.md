# Cardiovascular Risk Prediction System - Low Level Design

## Tech Stack

1. Backend: Convex
   - Multi-model DB + queries/mutations/actions.
   - Mutations are transactional.
2. Frontend: Next.js (App Router)
   - React Framework + TypeScript
   - Use Server Components by default, with Server Actions / Route Handlers for
     server-side calls.
3. UI: shadcn/ui
   - A hybrid between headless components and a component library approach.
   - Allows easy adjustment and extensibility.
4. AuthN/AuthZ: Convex Auth
   - Email and Password authentication.
5. Deployment
   - Backend: Convex managed deployment
   - Frontend: Node.js application on Render

## Data Collection

### PREVENT 2023: Fields and Valid Values

Note: range enforcement happens in the UI first (with visual feedback) and is
re-checked on the backend. The backend returns a list of field errors, and the
UI and backend should share the same validator schema.

Required fields:

- age (integer, years)
  - valid range: 30–79
  - derived from `dateOfBirth` in UTC at assessment time
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

Internal naming note: boolean clinical event fields use the `is` prefix in our
DTOs (e.g., `isDiabetes`). External integrations (MdCalc/ClinCalc) have their
own field names and are mapped in the integration layer.

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

To simplify the implementation, we will focus on a **single patient per user**:

- A signed-in **User** is the **Patient**.
- Each user owns exactly one patient profile record.
- All reads/writes are scoped to the current user; the server resolves the
  user's `patientId` and never accepts cross-patient IDs from the client.

Convex notes:

- Each document has `_id` and `_creationTime` automatically.
- Store all timestamps as `number` unix ms for consistent sorting/filtering.
- The `_creationTime` field is automatically added to the end of every (custom)
  index to ensure a stable ordering. It should not be added explicitly in the
  index definition.
- The `by_creation_time` index is created automatically (and is what is used in
  database queries that don't specify an index).
- The `by_id` index is reserved.

### Table: `patients`

Patient profile for the current user.

Fields:

- \_id
- userId (string; auth `tokenIdentifier`)
- firstName (string)
- lastName (string)
- sexAtBirth ("FEMALE" | "MALE")
- dateOfBirth (YYYY-MM-DD string)

Note: `sexAtBirth` is the value collected from the user and is mapped to the
external calculators' sex/gender input fields.

Indexes:

- by_userId (unique)

### Table: `patientMeasurements`

Time-series numeric facts (self-reported through the portal). The latest value
per `kind` is used for calculations.

Fields:

- \_id
- patientId (ref `patients`)
- kind ("TOTAL_CHOLESTEROL" | "HDL_CHOLESTEROL" | "SYSTOLIC_BP" | "BMI" |
  "EGFR")
- value (number)
- unit (string; store submitted unit, normalize at compute time)
- source ("PATIENT" | "IMPORT")

Indexes:

- by_patientId
- by_patientId_kind

Note: use `_creationTime` as the measurement timestamp for ordering and recency.

### Table: `patientClinicalEvents`

Time-series **boolean flags** required by the PREVENT model. Use an append-only
timeline and treat the **latest** event per `kind` as the current value.

Fields:

- \_id
- patientId (ref `patients`)
- kind ("DIABETES" | "SMOKING" | "ANTIHYPERTENSIVE" | "STATIN")
- value (boolean)
- source ("PATIENT" | "IMPORT")

Note: use `_creationTime` as the event timestamp for ordering and recency.

Indexes:

- by_patientId
- by_patientId_kind

### Table: `riskAssessments`

Each time we compute a risk assessment, write an assessment record.

Fields:

- \_id
- patientId (ref `patients`)
- model ("PREVENT")
- modelVersion ("2023")
- inputSnapshot (denormalized JSON; exactly what was sent to the calculator
  after normalization)
- results (JSON; 10-years result, including contributing factors)

Indexes:

- by_patientId

## APIs

### External

For the MVP:

- **MdCalc** is used to compute PREVENT risks (clean JSON response).
- **ClinCalc** contribution breakdown is implemented as best-effort scraping (no
  public API). This is brittle and may be restricted by their terms; treat it as
  a prototype integration; prefer a licensed/official source in a production
  system.

All external calls are performed server-side to avoid leaking keys/cookies and
to sidestep browser CORS.

### Calculate Risk using MdCalc API

We can use the following request to get a result
(MdCalcPREVENTAssessmentRequestDTO):

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

Note: we only use the 10-year outputs from MdCalc. Any 30-year data is ignored.

### Calculate Risk using ClinCalc API

ClinCalc doesn't actually have a public API.

We need to access their page at `https://clincalc.com/Cardiology/PREVENT/` and
get `__VIEWSTATEGENERATOR`, `__VIEWSTATE`, `__EVENTVALIDATION` values from the
page's HTML.

Then we can use the following request to get a result
(ClinCalcPREVENTAssessmentRequestDTO):

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

The expected response is an HTML page markup (text)
(ClinCalcPREVENTAssessmentResponseDTO).

What we're interested in that page is the `drawChart_ASCVDContribution` function
which has the data about the risk factors stored in the `data` constant.

Example:

```js
function drawChart_ASCVDContribution() {
  const data = google.visualization.arrayToDataTable([
    [
      "Risk Factor",
      "% Contribution",
      { type: "string", role: "style" },
      { type: "string", role: "annotation" },
    ],
    ["Age", -52, "#00ad00", "52%"],
    ["Total Cholesterol", -10, "#00ad00", "10%"],
    ["Systolic BP", -10, "#00ad00", "10%"],
    ["HDL", -5, "#00ad00", "5%"],
    ["eGFR", -1, "#00ad00", "1%"],
    ["Smoking", 22, "#ad0000", "22%"],
  ]);

  // there will be more code here...
}
```

### Internal

Implementation notes:

- **Primary**: the UI talks to **Convex queries/mutations/actions** directly
  (the best DX).
- **REST layer**: expose a versioned REST API (`/api/v1/...`) using Next.js
  Route Handlers for MdCalc / ClinCalc calls.
- ClinCalc is required for the risk assessment. If the ClinCalc request fails,
  the entire risk assessment creation fails (intake/profile data remains
  persisted).

Below is the REST surface (versioned) plus the DTOs. All endpoints are scoped to
**the current user** (patient); the server resolves `patientId` from the auth
context.

---

#### Common types

```typescript
export type CursorDTO = string;

export type SortDirDTO = "ASC" | "DESC";

export type PaginationQueryDTO = {
  limit?: number; // default 50
  cursor?: CursorDTO;
};

export type AuditDTO = {
  updatedAt: number; // unix ms, default: creation time
};
```

---

#### Profile (Current User)

```typescript
export type SexAtBirthDTO = "FEMALE" | "MALE";

export type PatientProfileDTO = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  sexAtBirth: SexAtBirthDTO;
} & AuditDTO;

export type PatientProfileUpsertDTO = {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  sexAtBirth: SexAtBirthDTO;
};
```

`GET /api/v1/me/profile`

```typescript
export type GetProfileRequestDTO = {};
export type GetProfileResponseDTO = { profile: PatientProfileDTO | null };
```

`POST /api/v1/me/profile` (create or update)

```typescript
export type UpsertProfileRequestDTO = { body: PatientProfileUpsertDTO };
export type UpsertProfileResponseDTO = { profile: PatientProfileDTO };
```

---

#### Intake (Current User)

The intake payload maps directly to the PREVENT model inputs. The server
normalizes units and stores time-series entries under the hood.

```typescript
export type PatientIntakeDTO = {
  totalCholesterol: number; // mg/dL
  hdlCholesterol: number; // mg/dL
  systolicBP: number; // mmHg
  bmi: number; // kg/m2
  eGFR: number; // mL/min/1.73 m2
  isDiabetes: boolean;
  isSmoker: boolean;
  isTakingAntihypertensive: boolean;
  isTakingStatin: boolean;
} & AuditDTO;

export type PatientIntakeUpsertDTO = Omit<PatientIntakeDTO, AuditDTO>;
```

`GET /api/v1/me/intake`

```typescript
export type GetIntakeRequestDTO = {};
export type GetIntakeResponseDTO = { intake: PatientIntakeDTO | null };
```

`POST /api/v1/me/intake` (create or update)

```typescript
export type UpsertIntakeRequestDTO = { body: PatientIntakeUpsertDTO };
export type UpsertIntakeResponseDTO = { intake: PatientIntakeDTO };
```

---

#### Risk Assessments (Current User)

A risk assessment is computed from a **snapshot** (latest measurement per kind +
latest clinical state per kind + computed age from `dateOfBirth` in UTC at
assessment creation).

⚠️ WE ALWAYS CREATE A NEW Assessment. WE DO NOT SUPPORT UPDATES OR DELETES.

```typescript
export type RiskModelDTO = "PREVENT";
export type RiskModelVersionDTO = "2023";
export type TimeHorizonDTO = "10_YEARS";

export type PREVENTRiskSetDTO = {
  totalCVD: string;
  ASCVD: string;
  heartFailure: string;
  coronaryHeartDisease: string;
  stroke: string;
};

export type RiskFactorContributionDTO = {
  factor: string; // e.g, `Age`
  value: number; // signed value returned from ClinCalc, e.g, `-52`
  direction: "PROTECTIVE" | "HARMFUL"; // based on the signed value returned from ClinCalc (minus is PROTECTIVE, plus is HARMFUL), e.g, `PROTECTIVE`
};

export type RiskAssessmentResultDTO = {
  timeHorizon: TimeHorizonDTO;
  setName: "RISKS";
  setUnits: "%";
  data: PREVENTRiskSetDTO;
  contributions?: RiskFactorContributionDTO[]; // 10-year ASCVD factors only
};

export type RiskAssessmentDTO = {
  id: string;
  model: RiskModelDTO;
  modelVersion: RiskModelVersionDTO;
  inputSnapshot: Record<string, unknown>;
  results: RiskAssessmentResultDTO[];
} & AuditDTO;
```

`POST /api/v1/me/risk-assessments`

Computes a new assessment using external sources and stores it.

```typescript
export type CreateRiskAssessmentRequestDTO = {
  body?: {
    // optional override; if omitted, server derives snapshot from DB
    inputSnapshotOverride?: Record<string, unknown>;
  };
};

export type CreateRiskAssessmentResponseDTO = {
  assessment: RiskAssessmentDTO;
};
```

`GET /api/v1/me/risk-assessments`

```typescript
export type ListRiskAssessmentsRequestDTO = {
  query?: PaginationQueryDTO & {
    sort?: "createdAt" | "-createdAt";
  };
};

export type ListRiskAssessmentsResponseDTO = {
  items: RiskAssessmentDTO[];
  nextCursor?: CursorDTO;
};
```

`GET /api/v1/me/risk-assessments/{assessmentId}`

```typescript
export type GetRiskAssessmentRequestDTO = {
  assessmentId: string;
};

export type GetRiskAssessmentResponseDTO = {
  assessment: RiskAssessmentDTO;
};
```

## Modules

1. Convex (backend)
   1. `patients` (profile queries/mutations)
   2. `intake` (upsert + read of patient inputs)
   3. `riskAssessments` (actions + queries)
2. Core (shared logic)
   1. Domains: Patient, Units
   2. Models: PREVENT (routing-ready)
   3. Engines: Risk
3. Next.js (frontend)
   1. Auth UI (Email + Password)
   2. Patient Profile + Intake Form UI
   3. Risk Results UI

## Risk Calculator Model Routing

1. Create a `RiskModel` interface and a `ModelRegistry`.
2. For MVP, registry only returns `Prevent2023Model`.
3. Add a `TODO` in a placeholder branch for `SCORE2` (Europe).

## Unit Handling

1. Create functions for converting units from/to US/SI (mg/dL, mmol/L).
   - The functions return value should include the original input and units,
     e.g.
   ```js
   return {
     original: { value: 1, unit: "mg/dL" },
     value: 0.056,
     unit: "mmol/L",
   };
   ```
2. Create functions for calculating `eGFR` and `BMI`.
   - The functions should validate inputs and provide descriptive errors.

## UI

1. Login Page (login via email and password)

2. Onboarding Page (multistep form)
   1. Patient Profile inputs (name, DOB, sex at birth).
   2. Capture PREVENT inputs in a single form.
   3. When submitted, a risk assessment is automatically triggered, when it has
      finished, the user is redirected to a Risk Assessment Page.

3. Risk Assessment Page
   1. If the patient profile is incomplete or PREVENT inputs are incomplete
      1. Redirect the user to the Onboarding Page
   2. Else, show the Results
      1. Your risk of having a Cardiovascular (CV) Event with the next 10 years
         is `totalCVD`
      2. According to the AHA Cardiovascular Disease (CVD) interpretation, it is
         considered:
         1. Low
         2. Borderline
         3. Intermediate
         4. High
      3. Break down of CV events ranked by probability:
         1. CHD
         2. Stroke
         3. HF
      4. Contribution of each Risk Factor:
         - Each factor affecting 10-year ASCVD risk can be measured on its own,
           whether it is protective (reducing risk) or harmful (increasing
           risk).
         - Examples:
           - Age
           - Total Cholesterol
           - Systolic BP
           - HDL
           - eGFR
