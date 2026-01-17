# Baseline Management Directive

## The "Active Baseline" Concept
In Project A.P.E.X., we maintain a stable, known-good state called the **Active Baseline**. This represents the current best version of our system, workflows, and prompts.

## The Promotion Process
We do not modify the Active Baseline directly. Instead, we experiment in isolated separate branches or "lab" environments.

1.  **Experiment**: Create a new variation or feature in a sandbox.
2.  **Validate**: Test the new setup against defined metrics.
3.  **Promote**: Only when the experiment demonstrably outperforms the current baseline do we "promote" it to become the new Active Baseline.

> **Rule:** The Active Baseline is sacred. It only changes through a deliberate promotion event.
