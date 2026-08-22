import { cn } from "./cn";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  /** 展示文字（通常取昵称或手机号首字） */
  label: string;
  /** 尺寸 */
  size?: AvatarSize;
  /** 额外 class */
  className?: string;
  /** 作为按钮时可点击 */
  onClick?: () => void;
  /** 无障碍标签 */
  "aria-label"?: string;
}

const sizeClass: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
};

/**
 * 圆形文字头像：取 label 首字符展示。
 */
export function Avatar({
  label,
  size = "sm",
  className,
  onClick,
  "aria-label": ariaLabel,
}: AvatarProps) {
  const initial = label.trim().slice(0, 1) || "?";
  const interactive = onClick != null;

  const baseClass = cn(
    "grid shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-primary",
    interactive &&
      "cursor-pointer transition-colors hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    sizeClass[size],
    className,
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={baseClass}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {initial}
      </button>
    );
  }

  return (
    <span className={baseClass} aria-hidden={ariaLabel ? undefined : true}>
      {initial}
    </span>
  );
}

Avatar.displayName = "Avatar";
