import { useEffect, useState } from "react";
import { LogOut, Settings2, SlidersHorizontal } from "lucide-react";
import {
  Avatar,
  Button,
  ConfirmDialog,
  Dialog,
  Input,
  cn,
} from "@/ui";
import type { User } from "@ayuchat/connect";
import { updateProfile } from "@/ayuapi";
import { updateSessionUser } from "@/auth/session";
import { userDisplayLabel } from "../ChatComponent/friendTypes";

export type SettingsSection = "general" | "preferences";

interface SettingsDialogProps {
  open: boolean;
  user: User;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
}

const navItemClass = cn(
  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
);

function EditNameDialog({
  open,
  initialName,
  onClose,
  onSaved,
}: {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onSaved: (user: User) => void;
}) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setError(null);
      setSaving(false);
    }
  }, [open, initialName]);

  async function handleSave() {
    const trimmed = name.trim();
    if (trimmed.length > 32) {
      setError("昵称不能超过 32 字");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfile({
        name: trimmed.length > 0 ? trimmed : null,
      });
      updateSessionUser(updated);
      onSaved(updated);
      onClose();
    } catch {
      setError("保存失败，请稍后重试");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="修改昵称" size="sm">
      <div className="px-4 py-4">
        <Input
          label="昵称"
          placeholder="输入昵称"
          value={name}
          maxLength={32}
          onChange={(event) => setName(event.target.value)}
          error={error}
          hint="留空将显示为掩码手机号"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button size="sm" loading={saving} onClick={() => void handleSave()}>
            保存
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * 设置弹窗：左侧导航 + 右侧内容区。
 */
export default function SettingsDialog({
  open,
  user,
  onClose,
  onUserUpdated,
  onLogout,
}: SettingsDialogProps) {
  const [section, setSection] = useState<SettingsSection>("general");
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!open) {
      setSection("general");
      setEditNameOpen(false);
      setLogoutConfirmOpen(false);
      setLoggingOut(false);
    }
  }, [open]);

  const displayName = userDisplayLabel(user);
  const rawName = user.name?.trim() ?? "";

  function handleLogoutConfirm() {
    setLoggingOut(true);
    onLogout();
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="设置"
        size="lg"
        className="min-h-[400px] max-h-[min(520px,90vh)]"
      >
        <div className="flex min-h-[320px]">
          <nav
            className="flex w-[168px] shrink-0 flex-col gap-1 border-r border-border bg-bg/50 p-3"
            aria-label="设置导航"
          >
            <button
              type="button"
              className={cn(
                navItemClass,
                section === "general"
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-fg hover:bg-border/40",
              )}
              onClick={() => setSection("general")}
            >
              <Settings2 className="size-4 shrink-0" />
              通用
            </button>
            <button
              type="button"
              disabled
              className={cn(
                navItemClass,
                "cursor-not-allowed text-muted opacity-60",
              )}
              title="即将推出"
            >
              <SlidersHorizontal className="size-4 shrink-0" />
              偏好
            </button>
            <div className="mt-auto pt-2">
              <button
                type="button"
                className={cn(
                  navItemClass,
                  "text-danger hover:bg-danger/10 hover:text-danger",
                )}
                onClick={() => setLogoutConfirmOpen(true)}
              >
                <LogOut className="size-4 shrink-0" />
                退出
              </button>
            </div>
          </nav>

          <div className="min-w-0 flex-1 p-5">
            {section === "general" ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-fg">账号信息</h3>
                  <p className="mt-1 text-xs text-muted">
                    管理你的昵称与展示名称
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Avatar label={displayName} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">{displayName}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {user.country_code} {user.phone}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-bg/40 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg">昵称</p>
                      <p className="mt-1 truncate text-sm text-muted">
                        {rawName || "未设置"}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditNameOpen(true)}
                    >
                      修改昵称
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Dialog>

      <EditNameDialog
        open={editNameOpen}
        initialName={rawName}
        onClose={() => setEditNameOpen(false)}
        onSaved={onUserUpdated}
      />

      <ConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => {
          if (!loggingOut) setLogoutConfirmOpen(false);
        }}
        onConfirm={handleLogoutConfirm}
        title="确认退出"
        description="退出后需重新登录才能继续使用。"
        confirmText="退出登录"
        confirmVariant="danger"
        loading={loggingOut}
      />
    </>
  );
}
