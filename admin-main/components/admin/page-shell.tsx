import * as React from "react";

export function PageShell(props: { title: string; description?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{props.title}</h1>
          {props.description ? <p className="text-sm text-zinc-600">{props.description}</p> : null}
        </div>
        {props.right}
      </div>
      {props.children}
    </div>
  );
}
