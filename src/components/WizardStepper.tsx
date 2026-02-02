"use client";

interface Props {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxReached: number;
}

const steps = ["Pick a Game", "Your System", "Results"];

export default function WizardStepper({ currentStep, onStepClick, maxReached }: Props) {
  return (
    <ul className="steps steps-horizontal w-full">
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
              className={`text-sm ${clickable ? "cursor-pointer hover:underline font-medium" : "cursor-default"} ${active ? "font-bold" : ""}`}
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
