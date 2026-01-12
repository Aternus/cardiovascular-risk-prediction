"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type RiskCategory = "LOW" | "BORDERLINE" | "INTERMEDIATE" | "HIGH";

type PatientRow = {
  id: string;
  firstName: string;
  lastName: string;
  latestRisk?: {
    riskCategory: RiskCategory;
    totalCVD: string;
  } | null;
};

type CreatePatientFormState = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sexAtBirth: string;
  totalCholesterol: string;
  hdlCholesterol: string;
  systolicBp: string;
  bmi: string;
  egfr: string;
  measuredAt: string;
  diabetes: boolean;
  smoker: boolean;
  antihypertensive: boolean;
  statin: boolean;
};

const initialFormState: CreatePatientFormState = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  sexAtBirth: "",
  totalCholesterol: "",
  hdlCholesterol: "",
  systolicBp: "",
  bmi: "",
  egfr: "",
  measuredAt: "",
  diabetes: false,
  smoker: false,
  antihypertensive: false,
  statin: false,
};

const riskBadgeClasses: Record<RiskCategory, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  BORDERLINE: "border-amber-200 bg-amber-50 text-amber-700",
  INTERMEDIATE: "border-orange-200 bg-orange-50 text-orange-700",
  HIGH: "border-rose-200 bg-rose-50 text-rose-700",
};

const riskLabels: Record<RiskCategory, string> = {
  LOW: "Low",
  BORDERLINE: "Borderline",
  INTERMEDIATE: "Intermediate",
  HIGH: "High",
};

export default function PatientsListPage() {
  const patients = useQuery(api.patients.listPatients);
  const patientRows = patients ?? [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--muted))_0%,transparent_60%)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Clinical workspace
              </p>
              <h1 className="text-3xl font-semibold text-foreground">
                Patients
              </h1>
              <p className="text-sm text-muted-foreground">
                Track cardiovascular risk, intake new profiles, and jump into
                individual charts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SignOutButton />
              <CreatePatientSheet />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {patientRows.length} active patients
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              10-year PREVENT model
            </Badge>
          </div>
        </header>

        <Card className="border-border/70 bg-background/80 shadow-lg shadow-muted/30 backdrop-blur-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Patient roster</CardTitle>
              <CardDescription>
                Latest risk category and total CVD percentage.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Input placeholder="Search by name" className="sm:w-55" />
              <Button variant="secondary" className="sm:w-auto">
                Filter
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>First name</TableHead>
                  <TableHead>Last name</TableHead>
                  <TableHead>Latest risk</TableHead>
                  <TableHead className="text-right">Patient page</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientRows.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {patient.firstName}
                    </TableCell>
                    <TableCell>{patient.lastName}</TableCell>
                    <TableCell>
                      <RiskSummary risk={patient.latestRisk} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                      >
                        <Link href={`/patients/${patient.id}`}>
                          View
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RiskSummary({ risk }: { risk?: PatientRow["latestRisk"] }) {
  if (!risk) {
    return <span className="text-sm text-muted-foreground">Not assessed</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant="outline"
        className={cn("border", riskBadgeClasses[risk.riskCategory])}
      >
        {riskLabels[risk.riskCategory]}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {risk.totalCVD} total CVD
      </span>
    </div>
  );
}

function CreatePatientSheet() {
  const createPatient = useMutation(api.patients.createPatientWithIntake);
  const [open, setOpen] = useState(false);
  const [formState, setFormState] =
    useState<CreatePatientFormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasRequiredFields =
    formState.firstName.trim().length > 0 &&
    formState.lastName.trim().length > 0 &&
    formState.dateOfBirth.length > 0 &&
    ["FEMALE", "MALE"].includes(formState.sexAtBirth.trim().toUpperCase());

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setFormState(initialFormState);
      setError(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!hasRequiredFields) {
      setError("Complete the required patient details before saving.");
      return;
    }

    const measuredAt = formState.measuredAt
      ? Date.parse(formState.measuredAt)
      : Date.now();
    if (Number.isNaN(measuredAt)) {
      setError("Measured at date is invalid.");
      return;
    }

    const measurementsInput = [
      {
        label: "Total cholesterol",
        kind: "TOTAL_CHOLESTEROL",
        value: formState.totalCholesterol,
        defaultUnit: "mg/dL",
      },
      {
        label: "HDL cholesterol",
        kind: "HDL_CHOLESTEROL",
        value: formState.hdlCholesterol,
        defaultUnit: "mg/dL",
      },
      {
        label: "Systolic BP",
        kind: "SYSTOLIC_BP",
        value: formState.systolicBp,
        defaultUnit: "mmHg",
      },
      {
        label: "BMI",
        kind: "BMI",
        value: formState.bmi,
        defaultUnit: "kg/m2",
      },
      {
        label: "eGFR",
        kind: "EGFR",
        value: formState.egfr,
        defaultUnit: "mL/min/1.73",
      },
    ] as const;

    const measurements: Array<{
      kind:
        | "TOTAL_CHOLESTEROL"
        | "HDL_CHOLESTEROL"
        | "SYSTOLIC_BP"
        | "BMI"
        | "EGFR";
      value: number;
      unit: string;
      measuredAt: number;
      source: "CLINICIAN";
    }> = [];

    for (const measurement of measurementsInput) {
      const parsed = parseMeasurementInput(
        measurement.value,
        measurement.defaultUnit,
      );
      if (measurement.value.trim() && parsed === null) {
        setError(`${measurement.label} should be a number.`);
        return;
      }
      if (parsed) {
        measurements.push({
          kind: measurement.kind,
          value: parsed.value,
          unit: parsed.unit,
          measuredAt,
          source: "CLINICIAN",
        });
      }
    }

    const recordedAt = Date.now();
    const clinicalEvents: Array<{
      kind: "DIABETES" | "SMOKING_STATUS" | "ON_ANTIHYPERTENSIVE" | "ON_STATIN";
      value: boolean;
      recordedAt: number;
      source: "CLINICIAN";
    }> = [
      {
        kind: "DIABETES",
        value: formState.diabetes,
        recordedAt,
        source: "CLINICIAN",
      },
      {
        kind: "SMOKING_STATUS",
        value: formState.smoker,
        recordedAt,
        source: "CLINICIAN",
      },
      {
        kind: "ON_ANTIHYPERTENSIVE",
        value: formState.antihypertensive,
        recordedAt,
        source: "CLINICIAN",
      },
      {
        kind: "ON_STATIN",
        value: formState.statin,
        recordedAt,
        source: "CLINICIAN",
      },
    ];

    setIsSubmitting(true);
    try {
      await createPatient({
        patient: {
          firstName: formState.firstName.trim(),
          lastName: formState.lastName.trim(),
          dateOfBirth: formState.dateOfBirth,
          sexAtBirth: formState.sexAtBirth.trim().toUpperCase() as
            | "FEMALE"
            | "MALE",
        },
        measurements: measurements.length > 0 ? measurements : undefined,
        clinicalEvents,
      });
      setOpen(false);
      setFormState(initialFormState);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Unable to create the patient.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create patient
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>New patient intake</SheetTitle>
          <SheetDescription>
            Capture the patient profile, baseline measurements, and clinical
            flags in one step.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <form
          className="flex-1 space-y-6 overflow-y-auto pr-2"
          onSubmit={handleSubmit}
        >
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Patient details
              </h3>
              <p className="text-xs text-muted-foreground">
                Required profile fields for the patient record.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  placeholder="Jane"
                  value={formState.firstName}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      firstName: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  placeholder="Doe"
                  value={formState.lastName}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      lastName: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-of-birth">Date of birth</Label>
                <Input
                  id="date-of-birth"
                  type="date"
                  value={formState.dateOfBirth}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      dateOfBirth: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex-at-birth">Sex at birth</Label>
                <Input
                  id="sex-at-birth"
                  placeholder="FEMALE or MALE"
                  list="sex-options"
                  value={formState.sexAtBirth}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      sexAtBirth: event.target.value,
                    }))
                  }
                />
                <datalist id="sex-options">
                  <option value="FEMALE" />
                  <option value="MALE" />
                </datalist>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Baseline measurements
              </h3>
              <p className="text-xs text-muted-foreground">
                Store the most recent lab and vitals snapshot.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="total-cholesterol">Total cholesterol</Label>
                <Input
                  id="total-cholesterol"
                  placeholder="190 mg/dL"
                  value={formState.totalCholesterol}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      totalCholesterol: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hdl">HDL cholesterol</Label>
                <Input
                  id="hdl"
                  placeholder="50 mg/dL"
                  value={formState.hdlCholesterol}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      hdlCholesterol: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systolic">Systolic BP</Label>
                <Input
                  id="systolic"
                  placeholder="128 mmHg"
                  value={formState.systolicBp}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      systolicBp: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bmi">BMI</Label>
                <Input
                  id="bmi"
                  placeholder="26.8 kg/m2"
                  value={formState.bmi}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      bmi: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="egfr">eGFR</Label>
                <Input
                  id="egfr"
                  placeholder="86 mL/min/1.73"
                  value={formState.egfr}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      egfr: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="measured-at">Measured at</Label>
                <Input
                  id="measured-at"
                  type="date"
                  value={formState.measuredAt}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      measuredAt: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Clinical events
              </h3>
              <p className="text-xs text-muted-foreground">
                Current flags required by the PREVENT model.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 p-3">
                <Checkbox
                  id="diabetes"
                  checked={formState.diabetes}
                  onCheckedChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      diabetes: Boolean(value),
                    }))
                  }
                />
                <Label htmlFor="diabetes">Diabetes</Label>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 p-3">
                <Checkbox
                  id="smoker"
                  checked={formState.smoker}
                  onCheckedChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      smoker: Boolean(value),
                    }))
                  }
                />
                <Label htmlFor="smoker">Current smoker</Label>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 p-3">
                <Checkbox
                  id="antihypertensive"
                  checked={formState.antihypertensive}
                  onCheckedChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      antihypertensive: Boolean(value),
                    }))
                  }
                />
                <Label htmlFor="antihypertensive">
                  Taking antihypertensive
                </Label>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 p-3">
                <Checkbox
                  id="statin"
                  checked={formState.statin}
                  onCheckedChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      statin: Boolean(value),
                    }))
                  }
                />
                <Label htmlFor="statin">Taking statin</Label>
              </div>
            </div>
          </section>
          <SheetFooter className="mt-6">
            <SheetClose asChild>
              <Button variant="outline" disabled={isSubmitting} type="button">
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" disabled={!hasRequiredFields || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create patient"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      onClick={() =>
        void signOut().then(() => {
          router.push("/signin");
        })
      }
    >
      Sign out
    </Button>
  );
}

function parseMeasurementInput(input: string, defaultUnit: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(?:\s*([^\s]+))?$/);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  if (Number.isNaN(value)) {
    return null;
  }

  return {
    value,
    unit: match[2] ?? defaultUnit,
  };
}
