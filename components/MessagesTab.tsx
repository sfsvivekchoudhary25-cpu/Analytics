"use client";

import { MessageAutomation } from "./MessageAutomation";

export function MessagesTab() {
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-100/70 p-3 sm:p-6 md:p-8">
      <MessageAutomation />
    </div>
  );
}