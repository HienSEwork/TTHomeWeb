import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "plate" | "wall" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.1em] [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "bg-surface text-ink ring-1 ring-inset ring-line-strong hover:bg-wash",
  ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
  plate: "bg-plate text-white hover:bg-plate-dark",
  wall: "bg-wall text-ink hover:brightness-95",
  danger: "bg-danger text-white hover:bg-[#912018]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 rounded-lg px-3 text-sm",
  md: "h-10 rounded-[10px] px-4 text-[0.9375rem]",
  lg: "h-12 rounded-xl px-6 text-base",
};

/** Class names for anything that should look like a button, including links. */
export function buttonStyles(options: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  const { variant = "primary", size = "md", className } = options;
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
