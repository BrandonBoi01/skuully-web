"use client";

import { usePrograms } from "../hooks/usePrograms";

export function ProgramList() {
  const { data, isLoading } = usePrograms();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.data?.map((program: any) => (
        <div key={program.id}>{program.name}</div>
      ))}
    </div>
  );
}