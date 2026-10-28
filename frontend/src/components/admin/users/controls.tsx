// Small controls shared by both views; the shared Button is a full-width form button.
export const BTN = {
  primary:
    "h-9 rounded-full bg-gold px-5 text-sm font-semibold text-ink transition duration-200 hover:bg-[#d9ab4d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
  secondary:
    "h-9 rounded-full border border-line px-5 text-sm font-medium transition duration-200 hover:bg-sunken active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
  danger:
    "h-9 rounded-full bg-danger px-5 text-sm font-semibold text-white transition duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60",
};

export const INPUT =
  "h-9 rounded-lg border border-line bg-white px-3 text-sm transition-colors placeholder:text-ink-soft focus:border-gold-deep";

export function TextAction({ danger, ...props }: { danger?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`text-sm font-semibold underline-offset-4 hover:underline active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 ${danger ? "text-danger" : "text-gold-deep"}`}
    />
  );
}

// A native checkbox keeps keyboard and screen-reader behaviour; `changed` outlines an unsaved edit.
export function Check({ changed, ...props }: { changed?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      {...props}
      className={`size-5 cursor-pointer accent-gold-deep transition-transform duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-60 ${changed ? "outline-2 outline-offset-2 outline-gold" : ""}`}
    />
  );
}
