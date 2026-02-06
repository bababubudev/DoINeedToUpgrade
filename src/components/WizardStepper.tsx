"use client";

interface Props {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxReached: number;
  steps?: string[];
}

const defaultSteps = ["Pick a Game", "Your System", "Results"];

export default function WizardStepper({ currentStep, onStepClick, maxReached, steps = defaultSteps }: Props) {
  return (
    <ul className="steps steps-horizontal w-full max-w-xl mx-auto mb-6">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const completed = stepNum < currentStep;
        const active = stepNum === currentStep;
        const clickable = stepNum <= maxReached && stepNum !== currentStep;

        return (
          <li
            key={label}
            className={`step ${completed || active ? "step-primary" : ""}`}
          >
            <button
              className={`text-sm font-light ${clickable ? "cursor-pointer hover:underline" : "cursor-default"}`}
              onClick={() => clickable && onStepClick(stepNum)}
              disabled={!clickable}
            >
              {label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
