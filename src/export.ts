import type { Plan, Schedule } from "./solver";
export function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function toCSV(plan: Plan, result: Schedule) {
  const field = (v: unknown) => {
    let s = String(v ?? "");
    if (/^\s*[=+@\-\t\r\n]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  return [
    ["Learner", "Activity", "Place", "Start minute", "End minute", "Status"],
    ...plan.learners.flatMap((name, i) =>
      plan.tasks.map((t) => {
        const s = result.slots.find((s) => s.learner === i && s.task === t.id);
        return [
          name,
          t.name,
          s ? s.resource + 1 : "",
          s?.start ?? "",
          s?.end ?? "",
          s ? "Scheduled" : "No full turn",
        ];
      }),
    ),
  ]
    .map((row) => row.map(field).join(","))
    .join("\r\n");
}
