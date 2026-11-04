export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Month picker as a grid (no sideways scrolling): 6 x 2 on phones, one row on larger screens.
// The chosen month is a filled caramel tile; the current month has a small dot.
export default function MonthFilter({ value, onChange, className = "" }) {
  const now = new Date().getMonth() + 1;
  return (
    <div className={className}>
      <div role="group" aria-label="Choose a month"
        className="grid grid-cols-6 gap-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-line sm:grid-cols-12">
        {MONTHS.map((m, i) => {
          const active = value === i + 1;
          const isNow = now === i + 1;
          return (
            <button key={m} type="button" aria-pressed={active} onClick={() => onChange(i + 1)}
              className={`relative flex flex-col items-center rounded-xl py-2 transition duration-200 active:scale-95 ${
                active ? "bg-gradient-to-b from-brand to-brand-dark text-white shadow-md" : "text-muted hover:bg-sand hover:text-navy"}`}>
              <span className="text-[13px] font-semibold leading-none">{m}</span>
              <span aria-hidden="true" className={`mt-1 h-1 w-1 rounded-full ${isNow ? (active ? "bg-accent" : "bg-brand") : "bg-transparent"}`} />
              {isNow && <span className="sr-only">(this month)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
