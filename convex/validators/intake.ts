export const PATIENT_MEASUREMENT_LIMITS = {
  totalCholesterol: { min: 130, max: 320 },
  hdlCholesterol: { min: 20, max: 100 },
  systolicBP: { min: 90, max: 200 },
  bmi: { min: 18.5, max: 39.9 },
  eGFR: { min: 15, max: 150 },
} as const;
