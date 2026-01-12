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
import { cn } from "@/lib/utils";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RiskCategory = "LOW" | "BORDERLINE" | "INTERMEDIATE" | "HIGH";

type PatientRow = {
  id: string;
  firstName: string;
  lastName: string;
  latestRisk?: {
    riskCategory: RiskCategory;
    totalCVD: string;
  };
};

const patients: PatientRow[] = [
  {
    id: "pt-0231",
    firstName: "Ava",
    lastName: "Chen",
    latestRisk: {
      riskCategory: "LOW",
      totalCVD: "3.8%",
    },
  },
  {
    id: "pt-0714",
    firstName: "Marcus",
    lastName: "Nguyen",
    latestRisk: {
      riskCategory: "INTERMEDIATE",
      totalCVD: "12.4%",
    },
  },
  {
    id: "pt-0933",
    firstName: "Riley",
    lastName: "Patel",
  },
  {
    id: "pt-1188",
    firstName: "Noah",
    lastName: "Garcia",
    latestRisk: {
      riskCategory: "HIGH",
      totalCVD: "24.1%",
    },
  },
  {
    id: "pt-1220",
    firstName: "Sofia",
    lastName: "Ibrahim",
    latestRisk: {
      riskCategory: "BORDERLINE",
      totalCVD: "6.2%",
    },
  },
];

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
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--muted))_0%,_transparent_60%)]">
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
              {patients.length} active patients
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
              <Input placeholder="Search by name" className="sm:w-[220px]" />
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
                {patients.map((patient) => (
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
  return (
    <Sheet>
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
        <form className="flex-1 space-y-6 overflow-y-auto pr-2">
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
                <Input id="first-name" placeholder="Jane" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" placeholder="Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-of-birth">Date of birth</Label>
                <Input id="date-of-birth" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex-at-birth">Sex at birth</Label>
                <Input
                  id="sex-at-birth"
                  placeholder="FEMALE or MALE"
                  list="sex-options"
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
                <Input id="total-cholesterol" placeholder="190 mg/dL" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hdl">HDL cholesterol</Label>
                <Input id="hdl" placeholder="50 mg/dL" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systolic">Systolic BP</Label>
                <Input id="systolic" placeholder="128 mmHg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bmi">BMI</Label>
                <Input id="bmi" placeholder="26.8 kg/m2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="egfr">eGFR</Label>
                <Input id="egfr" placeholder="86 mL/min/1.73" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="measured-at">Measured at</Label>
                <Input id="measured-at" type="date" />
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
                <Checkbox id="diabetes" />
                <Label htmlFor="diabetes">Diabetes</Label>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 p-3">
                <Checkbox id="smoker" />
                <Label htmlFor="smoker">Current smoker</Label>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 p-3">
                <Checkbox id="antihypertensive" />
                <Label htmlFor="antihypertensive">
                  Taking antihypertensive
                </Label>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 p-3">
                <Checkbox id="statin" />
                <Label htmlFor="statin">Taking statin</Label>
              </div>
            </div>
          </section>
        </form>
        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button type="button">Create patient</Button>
        </SheetFooter>
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
