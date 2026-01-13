"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import {
  getDateYearsAgo,
  getTodayDate,
  rangedNumberField,
} from "@/lib/form.utils";
import {
  PATIENT_PROFILE_LIMITS,
  patientProfileSchema,
  SEX_AT_BIRTH_OPTIONS,
} from "@/lib/validators/patientProfile";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import type { FieldError as FieldErrorType } from "@/lib/validators/types";

const FIELD_RANGES = {
  age: PATIENT_PROFILE_LIMITS.age,
  totalCholesterol: { min: 130, max: 320 },
  hdlCholesterol: { min: 20, max: 100 },
  systolicBp: { min: 90, max: 200 },
  bmi: { min: 18.5, max: 39.9 },
  egfr: { min: 15, max: 150 },
} as const;

const formatDateToYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateFromYmd = (value: string) => {
  if (!value) {
    return undefined;
  }

  const parts = value.split("-");
  if (parts.length !== 3) {
    return undefined;
  }

  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
};

const getFieldErrors = (error: unknown): FieldErrorType[] => {
  if (!(error instanceof ConvexError)) {
    return [];
  }

  const data = error.data;
  if (!data || typeof data !== "object") {
    return [];
  }

  const errorData = data as { fieldErrors?: unknown };
  if (Array.isArray(errorData.fieldErrors)) {
    return errorData.fieldErrors as FieldErrorType[];
  }

  return [];
};

const formSchema = patientProfileSchema.extend({
  totalCholesterol: rangedNumberField(
    "Total cholesterol",
    FIELD_RANGES.totalCholesterol,
  ),
  hdlCholesterol: rangedNumberField(
    "HDL cholesterol",
    FIELD_RANGES.hdlCholesterol,
  ),
  systolicBp: rangedNumberField("Systolic BP", FIELD_RANGES.systolicBp),
  bmi: rangedNumberField("BMI", FIELD_RANGES.bmi),
  egfr: rangedNumberField("eGFR", FIELD_RANGES.egfr),
  isDiabetes: z.boolean(),
  isSmoker: z.boolean(),
  isAntiHypertensiveMedication: z.boolean(),
  isStatins: z.boolean(),
});

type TFormSchema = z.output<typeof formSchema>;
type TFormInput = z.input<typeof formSchema>;

type Step = {
  title: string;
  description: string;
  fields: Array<keyof TFormInput>;
};

const steps: Step[] = [
  {
    title: "Patient Profile",
    description: "",
    fields: ["firstName", "lastName", "sexAtBirth", "dateOfBirth"],
  },
  {
    title: "Measurements",
    description: "",
    fields: ["totalCholesterol", "hdlCholesterol", "systolicBp", "bmi", "egfr"],
  },
  {
    title: "Clinical Status",
    description: "",
    fields: [
      "isDiabetes",
      "isSmoker",
      "isAntiHypertensiveMedication",
      "isStatins",
    ],
  },
];

export const MultiStepOnboardingForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const upsertProfile = useMutation(api.patients.upsertProfile);
  const upsertIntake = useMutation(api.intake.upsertIntake);

  const today = getTodayDate();
  const minDateOfBirth = getDateYearsAgo(FIELD_RANGES.age.max, today);
  const maxDateOfBirth = getDateYearsAgo(FIELD_RANGES.age.min, today);

  const currentForm = steps[currentStep];

  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const form = useForm<TFormInput, unknown, TFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      sexAtBirth: "",
      dateOfBirth: "",
      totalCholesterol: "",
      hdlCholesterol: "",
      systolicBp: "",
      bmi: "",
      egfr: "",
      isDiabetes: false,
      isSmoker: false,
      isAntiHypertensiveMedication: false,
      isStatins: false,
    },
    mode: "onChange",
    shouldUnregister: false,
  });

  const handleNextButton = async () => {
    const currentFields = steps[currentStep].fields;

    const isValid = await form.trigger(currentFields);

    if (isValid && !isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBackButton = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (values: TFormSchema) => {
    form.clearErrors();

    try {
      await upsertProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        sexAtBirth: values.sexAtBirth,
        dateOfBirth: values.dateOfBirth,
      });

      await upsertIntake({
        totalCholesterol: values.totalCholesterol,
        hdlCholesterol: values.hdlCholesterol,
        systolicBP: values.systolicBp,
        bmi: values.bmi,
        eGFR: values.egfr,
        isDiabetes: values.isDiabetes,
        isSmoker: values.isSmoker,
        isTakingAntihypertensive: values.isAntiHypertensiveMedication,
        isTakingStatin: values.isStatins,
      });

      toast.success("Patient information saved");
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors.length > 0) {
        const fieldMap: Record<string, keyof TFormInput> = {
          firstName: "firstName",
          lastName: "lastName",
          sexAtBirth: "sexAtBirth",
          dateOfBirth: "dateOfBirth",
          totalCholesterol: "totalCholesterol",
          hdlCholesterol: "hdlCholesterol",
          systolicBP: "systolicBp",
          bmi: "bmi",
          eGFR: "egfr",
          isDiabetes: "isDiabetes",
          isSmoker: "isSmoker",
          isTakingAntihypertensive: "isAntiHypertensiveMedication",
          isTakingStatin: "isStatins",
        };

        for (const fieldError of fieldErrors) {
          const fieldName = fieldMap[fieldError.field];
          if (fieldName) {
            form.setError(fieldName, {
              type: "server",
              message: fieldError.message,
            });
          }
        }

        toast.error("Please review the highlighted fields.");
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to save patient information";

      toast.error(message);
    }
  };

  const renderCurrentStepContent = () => {
    switch (currentStep) {
      case 0: {
        return (
          <FieldGroup key="step-0">
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                  <Input
                    {...field}
                    id="firstName"
                    aria-invalid={fieldState.invalid}
                    placeholder="Kiril"
                    autoComplete="off"
                    disabled={false}
                  />
                  <FieldDescription></FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                  <Input
                    {...field}
                    id="lastName"
                    aria-invalid={fieldState.invalid}
                    placeholder="Reznik"
                    autoComplete="off"
                    disabled={false}
                  />
                  <FieldDescription></FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="sexAtBirth"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sexAtBirth">Sex at birth</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={false}
                  >
                    <SelectTrigger
                      id="sexAtBirth"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select an option</SelectLabel>
                        {SEX_AT_BIRTH_OPTIONS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription></FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="dateOfBirth"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="dateOfBirth">Date of Birth</FieldLabel>
                  <DatePicker
                    id="dateOfBirth"
                    value={parseDateFromYmd(field.value)}
                    onChange={(date) => {
                      field.onChange(date ? formatDateToYmd(date) : "");
                    }}
                    placeholder=""
                    minDate={minDateOfBirth}
                    maxDate={maxDateOfBirth}
                    disabled={false}
                  />
                  <FieldDescription>
                    Age {FIELD_RANGES.age.min}–{FIELD_RANGES.age.max} years
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        );
      }

      case 1: {
        return (
          <FieldGroup key="step-1">
            <Controller
              name="totalCholesterol"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="totalCholesterol">
                    Total cholesterol
                  </FieldLabel>
                  <Input
                    {...field}
                    id="totalCholesterol"
                    aria-invalid={fieldState.invalid}
                    placeholder=""
                    autoComplete="off"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={FIELD_RANGES.totalCholesterol.min}
                    max={FIELD_RANGES.totalCholesterol.max}
                    disabled={false}
                  />
                  <FieldDescription>130–320 mg/dL</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="hdlCholesterol"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="hdlCholesterol">
                    HDL cholesterol
                  </FieldLabel>
                  <Input
                    {...field}
                    id="hdlCholesterol"
                    aria-invalid={fieldState.invalid}
                    placeholder=""
                    autoComplete="off"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={FIELD_RANGES.hdlCholesterol.min}
                    max={FIELD_RANGES.hdlCholesterol.max}
                    disabled={false}
                  />
                  <FieldDescription>20–100 mg/dL</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="systolicBp"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="systolicBp">Systolic BP</FieldLabel>
                  <Input
                    {...field}
                    id="systolicBp"
                    aria-invalid={fieldState.invalid}
                    placeholder=""
                    autoComplete="off"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={FIELD_RANGES.systolicBp.min}
                    max={FIELD_RANGES.systolicBp.max}
                    disabled={false}
                  />
                  <FieldDescription>90–200 mmHg</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="bmi"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bmi">BMI</FieldLabel>
                  <Input
                    {...field}
                    id="bmi"
                    aria-invalid={fieldState.invalid}
                    placeholder=""
                    autoComplete="off"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={FIELD_RANGES.bmi.min}
                    max={FIELD_RANGES.bmi.max}
                    disabled={false}
                  />
                  <FieldDescription>18.5–39.9 kg/m2</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="egfr"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="egfr">eGFR</FieldLabel>
                  <Input
                    {...field}
                    id="egfr"
                    aria-invalid={fieldState.invalid}
                    placeholder=""
                    autoComplete="off"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={FIELD_RANGES.egfr.min}
                    max={FIELD_RANGES.egfr.max}
                    disabled={false}
                  />
                  <FieldDescription>15–150 mL/min/1.73 m2</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        );
      }

      case 2: {
        return (
          <FieldGroup key="step-2">
            <Controller
              name="isDiabetes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="horizontal"
                >
                  <FieldContent>
                    <FieldLabel htmlFor="isDiabetes">Diabetes</FieldLabel>
                    <FieldDescription>
                      Are you currently diagnosed with diabetes?
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                  <Switch
                    id="isDiabetes"
                    name={field.name}
                    disabled={false}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              name="isSmoker"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="horizontal"
                >
                  <FieldContent>
                    <FieldLabel htmlFor="isSmoker">Smoker</FieldLabel>
                    <FieldDescription>
                      Are you currently smoking?
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                  <Switch
                    id="isSmoker"
                    name={field.name}
                    disabled={false}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              name="isAntiHypertensiveMedication"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="horizontal"
                >
                  <FieldContent>
                    <FieldLabel htmlFor="isAntiHypertensiveMedication">
                      Anti-hypertensive medication
                    </FieldLabel>
                    <FieldDescription>
                      Are you using anti-hypertensive medication?
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                  <Switch
                    id="isAntiHypertensiveMedication"
                    name={field.name}
                    disabled={false}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              name="isStatins"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="horizontal"
                >
                  <FieldContent>
                    <FieldLabel htmlFor="isStatins">Statins</FieldLabel>
                    <FieldDescription>Are you using statins?</FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                  <Switch
                    id="isStatins"
                    name={field.name}
                    disabled={false}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
          </FieldGroup>
        );
      }

      default: {
        return null;
      }
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle>{currentForm.title}</CardTitle>
            <p className="text-muted-foreground text-xs">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
          <CardDescription>{currentForm.description}</CardDescription>
        </div>
        <Progress value={progress} />
      </CardHeader>
      <CardContent>
        <form id="multi-step-onboarding" onSubmit={form.handleSubmit(onSubmit)}>
          {renderCurrentStepContent()}
        </form>
      </CardContent>
      <CardFooter>
        <Field className="justify-between" orientation="horizontal">
          {currentStep > 0 && (
            <Button type="button" variant="ghost" onClick={handleBackButton}>
              <ChevronLeft /> Back
            </Button>
          )}
          {!isLastStep && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleNextButton}
            >
              Next
              <ChevronRight />
            </Button>
          )}
          {isLastStep && (
            <Button
              type="submit"
              form="multi-step-onboarding"
              disabled={form.formState.isSubmitting}
              className="cursor-pointer"
            >
              {form.formState.isSubmitting ? <Spinner /> : "Submit"}
            </Button>
          )}
        </Field>
      </CardFooter>
    </Card>
  );
};
