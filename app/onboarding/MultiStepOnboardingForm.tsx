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
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  firstName: z
    .string()
    .min(1, "First Name is required")
    .min(2, "First Name must be at least 2 characters")
    .max(255, "First Name must be at most 255 characters"),
  lastName: z
    .string()
    .min(1, "Last Name is required")
    .min(2, "Last Name must be at least 2 characters")
    .max(255, "Last Name must be at most 255 characters"),
  gender: z
    .string()
    .min(1, "Gender is required")
    .refine(
      (val) => ["male", "female"].includes(val),
      "Gender must be a valid option",
    ),
  dateOfBirth: z
    .date({
      error: (issue) =>
        issue.input === undefined
          ? "Date of Birth is required"
          : "Invalid date",
    })
    .refine((val) => !Number.isNaN(val.getTime()), "Invalid date"),
  totalCholesterol: z
    .string()
    .min(1, "Total cholesterol is required")
    .max(255, "Total cholesterol must be at most 255 characters"),
  hdlCholesterol: z
    .string()
    .min(1, "HDL cholesterol is required")
    .max(255, "HDL cholesterol must be at most 255 characters"),
  systolicBp: z
    .string()
    .min(1, "Systolic BP is required")
    .max(255, "Systolic BP must be at most 255 characters"),
  bmi: z
    .string()
    .min(1, "BMI is required")
    .max(255, "BMI must be at most 255 characters"),
  egfr: z
    .string()
    .min(1, "eGFR is required")
    .max(255, "eGFR must be at most 255 characters"),
  diabetes: z.boolean(),
  smoker: z.boolean(),
  antiHypertensiveMedication: z.boolean(),
  statins: z.boolean(),
});

type TFormSchema = z.infer<typeof formSchema>;

export const MultiStepOnboardingForm = () => {
  type Step = {
    title: string;
    description: string;
    fields: Array<keyof TFormSchema>;
  };

  const steps: Step[] = [
    {
      title: "Patient Profile",
      description: "",
      fields: ["firstName", "lastName", "gender", "dateOfBirth"],
    },
    {
      title: "Measurements",
      description: "",
      fields: [
        "totalCholesterol",
        "hdlCholesterol",
        "systolicBp",
        "bmi",
        "egfr",
      ],
    },
    {
      title: "Clinical Status",
      description: "",
      fields: ["diabetes", "smoker", "antiHypertensiveMedication", "statins"],
    },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  const currentForm = steps[currentStep];

  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const form = useForm<TFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "",
      dateOfBirth: undefined,
      totalCholesterol: "",
      hdlCholesterol: "",
      systolicBp: "",
      bmi: "",
      egfr: "",
      diabetes: false,
      smoker: false,
      antiHypertensiveMedication: false,
      statins: false,
    },
    mode: "onChange",
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
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Form successfully submitted");

    console.log(values);
  };

  const renderCurrentStepContent = () => {
    switch (currentStep) {
      case 0: {
        return (
          <FieldGroup>
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
              name="gender"
              control={form.control}
              render={({ field, fieldState }) => {
                const options = [
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                ];

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="gender">Gender</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={false}
                    >
                      <SelectTrigger
                        id="gender"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Select an option</SelectLabel>
                          {options.map((item) => (
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
                );
              }}
            />

            <Controller
              name="dateOfBirth"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="dateOfBirth">Date of Birth</FieldLabel>
                  <DatePicker
                    id="dateOfBirth"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder=""
                    disabled={false}
                  />
                  <FieldDescription></FieldDescription>
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
          <FieldGroup>
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
          <FieldGroup>
            <Controller
              name="diabetes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="horizontal"
                >
                  <FieldContent>
                    <FieldLabel htmlFor="diabetes">Diabetes</FieldLabel>
                    <FieldDescription>
                      Are you currently diagnosed with diabetes?
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                  <Switch
                    id="diabetes"
                    name={field.name}
                    disabled={false}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              name="smoker"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="horizontal"
                >
                  <FieldContent>
                    <FieldLabel htmlFor="smoker">Smoker</FieldLabel>
                    <FieldDescription>
                      Are you currently smoking?
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                  <Switch
                    id="smoker"
                    name={field.name}
                    disabled={false}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              name="antiHypertensiveMedication"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="horizontal"
                >
                  <FieldContent>
                    <FieldLabel htmlFor="antiHypertensiveMedication">
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
                    id="antiHypertensiveMedication"
                    name={field.name}
                    disabled={false}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              name="statins"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="horizontal"
                >
                  <FieldContent>
                    <FieldLabel htmlFor="statins">Statins</FieldLabel>
                    <FieldDescription>Are you using statins?</FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                  <Switch
                    id="statins"
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
        <form id="multi-form" onSubmit={form.handleSubmit(onSubmit)}>
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
              form="multi-form"
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
