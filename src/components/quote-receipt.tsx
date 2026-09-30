import { durationRange, moneyRange, signedMinutes, signedMoneyRange, duration, money } from "@/lib/format";
import type { Quote, Service } from "@/lib/pricing/types";
import { MeasuredChip, cx } from "./ui";

export function optionSummary(service: Service, options: Quote["options"]) {
  return service.axes
    .map((a) => a.choices.find((c) => c.id === options[a.id])?.label)
    .filter(Boolean)
    .join(" · ");
}

export function QuoteReceipt({
  quote,
  service,
  currency,
  studioName,
  highlight,
  receiptHash,
  className,
}: {
  quote: Quote;
  service: Service;
  currency: string;
  studioName?: string;
  /** Line ids to emphasise (e.g. lines that differ in a comparison). */
  highlight?: Set<string>;
  receiptHash?: string;
  className?: string;
}) {
  const opts = optionSummary(service, quote.options);
  return (
    <div className={cx("overflow-hidden rounded-2xl border border-line bg-surface shadow-card", className)}>
      <div className="px-5 pb-4 pt-5 sm:px-6">
        {studioName ? <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{studioName}</p> : null}
        <h3 className="mt-1 font-display text-xl font-bold">{service.name}</h3>
        {opts ? <p className="text-sm text-muted">{opts}</p> : null}
      </div>

      <ol className="border-t border-dashed border-line-strong px-5 py-2 sm:px-6">
        {quote.lines.map((line) => {
          const zero = line.id !== "base" && line.minutes[0] === 0 && line.minutes[1] === 0 && line.price[0] === 0 && line.price[1] === 0;
          const hot = highlight?.has(line.id);
          return (
            <li
              key={line.id}
              className={cx(
                "-mx-2 rounded-lg px-2 py-2.5 transition-colors",
                hot && "bg-accent-soft",
                zero && "text-ink-2",
              )}
            >
              <div className="flex items-baseline gap-2 text-[0.95rem]">
                <span className={cx("font-medium", line.id === "base" && "font-semibold")}>{line.label}</span>
                <span className="leader" />
                <span className="tabular font-mono font-semibold">
                  {line.id === "base" ? money(line.price[0], currency) : signedMoneyRange(line.price, currency)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className={cx("text-xs", hot ? "text-ink-2" : "text-muted")}>
                  {line.because.type === "measurement" ? (
                    <MeasuredChip>{line.because.youcam}</MeasuredChip>
                  ) : line.because.type === "reported" ? (
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-line-strong px-2 py-0.5 font-medium text-ink-2">{line.because.text}</span>
                      <span className="font-mono text-[0.65rem]">{line.because.youcam}</span>
                    </span>
                  ) : line.because.type === "unmeasured" ? (
                    <span className="text-warn">{line.because.text}</span>
                  ) : (
                    line.because.text
                  )}
                </span>
                <span className={cx("tabular font-mono text-xs", hot ? "text-ink-2" : "text-muted")}>
                  {line.id === "base" ? duration(line.minutes[0]) : signedMinutes(line.minutes)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-line bg-surface-2/60 px-5 py-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Your price</p>
            <p className="tabular font-display text-3xl font-extrabold">{moneyRange(quote.price, currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Chair time</p>
            <p className="tabular font-display text-xl font-bold">{durationRange(quote.minutes)}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-2">
          Your stylist reserves <strong className="font-semibold">{duration(quote.slotMinutes)}</strong> for you · deposit{" "}
          <strong className="font-semibold">{money(quote.deposit, currency)}</strong>
        </p>
        {quote.warnings.filter((w) => w.code === "unmeasured").length ? (
          <p className="mt-2 text-xs text-warn">Some things weren&apos;t measured, so the range is wider. Your stylist will confirm.</p>
        ) : null}
        <p className="mt-3 font-mono text-[0.65rem] text-muted">
          rules {quote.rulesHash}
          {receiptHash ? ` · receipt ${receiptHash.slice(0, 16)}` : ""}
        </p>
      </div>
    </div>
  );
}
