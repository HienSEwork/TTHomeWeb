/** A numbered process. Only use for content that really happens in order. */
export function StepsList({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex flex-col rounded-card border border-line bg-surface p-5">
          <span aria-hidden className="plate tabular grid size-10 place-items-center text-lg font-extrabold">
            {i + 1}
          </span>
          <h3 className="mt-4 font-bold text-ink">{s.title}</h3>
          <p className="mt-1 text-sm text-muted">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
