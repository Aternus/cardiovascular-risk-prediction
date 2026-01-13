import type { TRiskCategory } from "@/app/(authorized)/risk-assessment/_lib/types";

export const interpretationLevels = [
  { label: "Low", range: "0-5%" },
  { label: "Borderline", range: "5-7.5%" },
  { label: "Intermediate", range: "7.5-20%" },
  { label: "High", range: "20%+" },
];

export const interpretationDescriptions: Record<
  Exclude<TRiskCategory, "Unknown">,
  string
> = {
  Low: "Your 10-year risk is low. Keep up healthy habits and routine checkups.",
  Borderline:
    "Your 10-year risk is borderline. Consider lifestyle changes and discuss options with your care team.",
  Intermediate:
    "Your 10-year risk is intermediate. Review preventive therapy and lifestyle changes with your care team.",
  High: "Your 10-year risk is high. Discuss preventive therapy and follow up with your care team.",
};

export const eventBreakdownConfig = [
  {
    label: "CHD",
    description: "Coronary heart disease",
    key: "chd",
    keywords: [/coronary/i, /\bchd\b/i, /myocard/i],
  },
  {
    label: "Stroke",
    description: "Ischemic or hemorrhagic",
    key: "stroke",
    keywords: [/stroke/i],
  },
  {
    label: "HF",
    description: "Heart failure",
    key: "hf",
    keywords: [/heart failure/i, /\bhf\b/i],
  },
] as const;

export const parsePercentValue = (value: string) => {
  const match = value.match(/-?\d+(\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
};

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatPercent = (value: number | null) =>
  value === null ? "N/A" : `${percentFormatter.format(value)}%`;

export const formatSignedPercent = (value: number) => {
  const rounded = value.toFixed(1);
  return `${value >= 0 ? "+" : ""}${rounded}%`;
};

export const getInterpretationLabel = (
  value: number,
): Exclude<TRiskCategory, "Unknown"> => {
  if (value < 5) {
    return "Low";
  }
  if (value < 7.5) {
    return "Borderline";
  }
  if (value < 20) {
    return "Intermediate";
  }
  return "High";
};

export const getPercentFromOutput = (output?: {
  name: string;
  value: string;
  value_text: string;
  message: string;
}) => {
  if (!output) {
    return null;
  }
  return (
    parsePercentValue(output.value_text) ?? parsePercentValue(output.value)
  );
};

export const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ");

export const parsePreventBreakdown = (message: string) => {
  const cleaned = stripHtml(message);
  const entries: Array<[RegExp, string]> = [
    [/10-?Year ASCVD Risk:\s*([0-9.]+)%/i, "ascvd"],
    [/10-?Year Heart Failure Risk:\s*([0-9.]+)%/i, "hf"],
    [/10-?Year Coronary Heart Disease Risk:\s*([0-9.]+)%/i, "chd"],
    [/10-?Year Stroke Risk:\s*([0-9.]+)%/i, "stroke"],
  ];

  const result: Partial<Record<string, number>> = {};
  for (const [regex, key] of entries) {
    const match = cleaned.match(regex);
    if (match && match[1]) {
      result[key] = Number.parseFloat(match[1]);
    }
  }

  return result;
};

export const formatUpdatedLabel = (date: Date) =>
  `Updated ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

export const formatRiskFactorLabel = (value: string) => {
  const normalized = value.toLowerCase();

  if (normalized.includes("total cholesterol")) {
    return "Total cholesterol";
  }
  if (normalized.includes("hdl")) {
    return "HDL";
  }
  if (normalized.includes("systolic") || normalized.includes("sbp")) {
    return "Systolic BP";
  }
  if (normalized.includes("egfr")) {
    return "eGFR";
  }
  if (normalized.includes("body mass") || normalized.includes("bmi")) {
    return "BMI";
  }
  if (normalized.includes("diabetes")) {
    return "Diabetes";
  }
  if (normalized.includes("smoker")) {
    return "Smoking";
  }
  if (normalized.includes("statin")) {
    return "Statin";
  }
  if (
    normalized.includes("bp treatment") ||
    normalized.includes("anti-hypertensive") ||
    normalized.includes("antihypertensive")
  ) {
    return "Antihypertensive";
  }
  if (normalized.includes("age")) {
    return "Age";
  }

  return value;
};
