import { CLINICAL_EVENT_KIND, PATIENT_MEASUREMENT_KIND } from "./consts";

export type TPatientMeasurementKind = (typeof PATIENT_MEASUREMENT_KIND)[number];

export type TClinicalEventKind = (typeof CLINICAL_EVENT_KIND)[number];
