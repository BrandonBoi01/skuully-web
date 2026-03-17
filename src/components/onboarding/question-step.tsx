import type { ReactNode } from "react";

type QuestionStepProps = {
  children: ReactNode;
};

export function QuestionStep({ children }: QuestionStepProps) {
  return <section className="mt-2">{children}</section>;
}