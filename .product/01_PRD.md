# Cardiovascular Risk Prediction System

## Objective

Build a system that predicts a patient's top 3 most urgent health risks based on
patient data.

You may use any approach, data sources, or existing research you find
appropriate.

## Requirements

- Include a web-based UI where a patient can input their information and see
  their risk prediction
- The system should provide some form of interpretable output (not just a
  black-box number)

## Notes

- Feel free to use assumptions, simplified models, or existing research
- It's okay to stub out parts you'd implement differently with more time
- Document any shortcuts taken due to time constraints

---

## Open Questions

1. Top 3 most urgent risks: which risks are in the candidate list?
2. What is the expected time horizon? (next 30 days? 1 year? 10 years?)
3. How do we combine probability and severity into urgency?
4. What should the system do when data is missing? (ask for more info, fail,
   etc.)

### Answers from Doron

1. Research it a bit and think what makes sense to you, come up with a top X
   list to choose from.
2. Let’s say 10 years.
3. You can come up with some pseudo logic for that, give each a weight, try
   basing it on some common method if it exists.
4. Let’s have the system always give you some feedback, it could also mention
   the degree of certainty or a call to action of what more data you need to
   provide to raise it.

You have the freedom to make assumptions and cut corners. You should keep a list
of assumptions you made and corners cut (since this is a homework exercise) and
how it would be different in an enterprise grade system.

---

## Scope

- Manage patient information
  - web portal with authentication (login) per user
  - web form that will collect information about the patient
  - save patient information to a database
  - allow the patient to edit the information
- Provide personalized suggestions
  - cardiovascular related health risks
  - actionable output/suggestion (e.g., stopping smoking will greatly reduce the
    risk to X)

## Out of Scope

- Manage patient information
  - ability to upload data from a wearable device and extract heart-related data

## Terms

1. Lipid: any of a class of organic compounds that are fatty acids or their
   derivatives and are insoluble in water but soluble in organic solvents. They
   include many natural oils, waxes, and steroids.
2. ApoB: Apolipoprotein B. The number of plaque-forming particles in your blood.
3. LDL-C: Low Density Lipoprotein Cholesterol, aka. "bad" cholesterol.
4. Coronary: relating to or denoting the arteries which surround and supply the
   heart.
5. Aortic: relating to the aorta, the main artery of the body.
6. Atherosclerosis: a specific type of arteriosclerosis. Atherosclerosis is the
   buildup of fats, cholesterol, and other substances in and on the artery
   walls. This buildup is called plaque. The plaque can cause arteries to
   narrow, blocking blood flow. The plaque also can burst, leading to a blood
   clot.
7. ASCVD: Atherosclerotic Cardiovascular Disease is a serious condition caused
   by plaque building up in artery walls, narrowing them, and restricting blood
   flow to organs, leading to heart attacks, strokes, peripheral artery disease
   (PAD), and aneurysms, and is a leading cause of death globally.
   - It's a progressive disease that developers over time, often fueled by
     factors like high cholesterol, diabetes, and hypertension, and includes
     many specific heart and blood vessel problems.
   - Involves:
     - Coronary Heart Disease (CHD): plaque in heart arteries (e.g., heart
       attack, angina).
     - Cerebrovascular Disease: Blockages in brain arteries (e.g., ischemic
       stroke, TIA).
     - Peripheral Artery Disease (PAD): Plaque in leg/limb arteries (e.g.,
       painful cramping).
     - Aortic Disease: Plaque in the aorta (e.g., abdominal aortic aneurysm).
8. SBP: Systolic Blood Pressure, this is the top number in a blood pressure
   reading and measures the pressure in the arteries when the heart beats
   (contracts). A healthy SBP is typically below 120 mmHg.
9. DBP: Diastolic Blood Pressure, this is the bottom number in a blood pressure
   reading and measures the pressure in your arteries when your heart rests and
   refills with blood between beats, reflecting arterial elasticity and vessel
   resistance. A healthy DBP is typically below 80 mmHg.
10. mmHg: In medicine, mmHg stands for millimeters of mercury, a unit used to
    measure pressure, most commonly blood pressure (like 120/80 mmHg) and
    intracranial pressure, representing the height a column of mercury would
    rise under that pressure.
11. EHR: Electronic Health Record.
12. FHIR: Fast Healthcare Interoperability Resources.
13. mmol/L: number of molecules of a substance in a liter of fluid (SI unit).
14. mg/dL: milligrams per deciliter, measures the mass (weight) of a substance
    in a deciliter (one-tenth of a liter) of fluid (commonly used in the US).
15. RR: Relative Risk.
16. Statins: a class of prescription medicines that lower "bad" LDL cholesterol
    in the blood by reducing its production in the liver.

## Overview

Cardiovascular risk = the chance of having a “bad heart/blood-vessel event” over
time.

Most CV events come from damage building up silently for years.

Events:

1. heart attack (myocardial infarction)
2. stroke
3. heart failure
4. sudden cardiac death
5. peripheral artery disease

### Plaque

LDL-C = cargo. ApoB = trucks. More trucks → more “hits” on artery walls over
years → more plaque risk.

## Prediction Model Features for CV Risk (simplified)

- Lipids: LDL-C, non-HDL-C, ApoB, triglycerides, HDL-C, Lp(a)
- Hemodynamics: systolic BP, diastolic BP, meds
- Metabolic: HbA1c, fasting glucose, BMI/waist
- Lifestyle: smoking, activity
- History: age, sex, family history, prior events
