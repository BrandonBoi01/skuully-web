import type { ReactNode } from "react";

type QuestionStepProps = {
  title: string;
  helper?: string;
  children: ReactNode;
};

export function QuestionStep({
  title,
  helper,
  children,
}: QuestionStepProps) {
  return (
    <section>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {helper ? (
          <p className="mt-3 text-sm leading-7 text-white/52 sm:text-base">
            {helper}
          </p>
        ) : null}
      </div>

      <div className="mt-8">{children}</div>
    </section>
  );
}