import type { ReactNode } from "react";

interface AuthCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * 登录 / 注册共用的居中卡片外壳。
 */
export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <main className="grid min-h-full place-items-center p-8">
      <div className="w-[360px] max-w-full rounded-2xl border border-border bg-surface/90 p-9 backdrop-blur-md">
        <p className="mb-3 text-[28px] font-bold tracking-tight text-primary">
          AyuChat
        </p>
        {title ? (
          <p className="mb-1 text-lg font-semibold text-fg">{title}</p>
        ) : null}
        {subtitle ? (
          <p className="mb-6 leading-relaxed text-muted">{subtitle}</p>
        ) : (
          <div className="mb-6" />
        )}
        {children}
      </div>
    </main>
  );
}
