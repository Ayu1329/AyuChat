type ClassValue = string | false | null | undefined;

/**
 * 合并 className，过滤空值。
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
