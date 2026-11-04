export default function Stars({ value = 0 }) {
  return (
    <span aria-label={`${value} out of 5`} className="tracking-tight">
      <span className="text-accent">{"★".repeat(value)}</span>
      <span className="text-slate-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}
