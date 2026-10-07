"use client";

import { Badge, Button, Avatar, Tooltip } from "antd";
import { BellOutlined, UserOutlined } from "@ant-design/icons";

export function NotificationBell({
  pendingPhotos,
  onClick,
}: {
  pendingPhotos: number;
  onClick: () => void;
}) {
  return (
    <Tooltip title={pendingPhotos > 0 ? `${pendingPhotos} photo${pendingPhotos === 1 ? "" : "s"} awaiting review` : "No new notifications"}>
      <Badge count={pendingPhotos} size="small" offset={[-2, 4]} color="#2563eb">
        <Button
          shape="circle"
          icon={<BellOutlined className="text-base text-slate-600" />}
          onClick={onClick}
          aria-label={
            pendingPhotos > 0
              ? `${pendingPhotos} photo${pendingPhotos === 1 ? "" : "s"} awaiting approval`
              : "No photos awaiting approval"
          }
          className="!flex !h-9 !w-9 !items-center !justify-center !border-slate-200 !bg-white hover:!border-blue-400 hover:!bg-blue-50/50 shadow-xs transition-all"
        />
      </Badge>
    </Tooltip>
  );
}

export function AccountAvatar({
  username,
  onClick,
}: {
  username: string;
  onClick: () => void;
}) {
  const initial = username.replace(/^@/, "").charAt(0).toUpperCase();

  return (
    <Tooltip title={`@${username.replace(/^@/, "")} • Account settings`}>
      <button
        onClick={onClick}
        aria-label="Account settings"
        className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 focus:outline-none"
      >
        <Avatar
          size={36}
          className="!font-semibold !shadow-xs !transition-all group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2"
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "#ffffff",
          }}
        >
          {initial || <UserOutlined />}
        </Avatar>
      </button>
    </Tooltip>
  );
}

