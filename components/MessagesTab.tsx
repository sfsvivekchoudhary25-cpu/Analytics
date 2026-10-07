"use client";

import { useState } from "react";
import { Inbox } from "./Inbox";
import { MessageAutomation } from "./MessageAutomation";

import { Button, Tag } from "antd";
import { ArrowLeftOutlined, ThunderboltOutlined } from "@ant-design/icons";

export function MessagesTab({
  username,
  ownAvatar,
  targetUsername,
  initialMessageText,
}: {
  username?: string;
  ownAvatar?: string | null;
  targetUsername?: string | null;
  initialMessageText?: string | null;
}) {
  const [view, setView] = useState<"inbox" | "auto">("inbox");

  if (view === "auto") {
    return (
      <div className="h-full w-full flex flex-col bg-slate-50/50 overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-6 shadow-2xs">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => setView("inbox")}
            className="!flex !items-center !gap-1.5 !text-xs !font-semibold !text-slate-600 hover:!text-slate-900 !rounded-xl"
          >
            Back to Messages
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800">Automated Responses</span>
            <Tag color="blue" icon={<ThunderboltOutlined />} className="!rounded-full !m-0 !text-[11px]">
              AI & Rules
            </Tag>
          </div>
          <div className="w-24" />
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-8 w-full bg-slate-100/70">
          <div className="w-full">
            <MessageAutomation />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex-1 flex flex-col min-h-0 overflow-hidden">
      <Inbox
        username={username}
        ownAvatar={ownAvatar}
        onOpenAutomations={() => setView("auto")}
        targetUsername={targetUsername}
        initialMessageText={initialMessageText}
      />
    </div>
  );
}
