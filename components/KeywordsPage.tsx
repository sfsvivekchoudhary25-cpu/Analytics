"use client";

import { AutoReplyCard, type RuleTemplate } from "./AutoReplyCard";

const COMMENT_TEMPLATES: RuleTemplate[] = [
  { name: "Price question", keywords: "price, cost, rate, how much", replyText: "Hi @{username}! For prices, please send us a DM and we'll share the details." },
  { name: "Size or stock", keywords: "size, available, stock", replyText: "Hi @{username}! Send us a DM with your size and we'll confirm availability." },
  { name: "Say thanks", keywords: "", replyText: "Thank you @{username}! 💛" },
];
const MESSAGE_TEMPLATES: RuleTemplate[] = [
  { name: "Greeting", keywords: "hi, hello, hey", replyText: "Hi {username}! Thanks for messaging us. We'll get back to you shortly." },
  { name: "Price question", keywords: "price, cost, rate, how much", replyText: "Hi {username}! Tell us which item you like and we'll share the price." },
  { name: "Order", keywords: "order, buy, purchase", replyText: "Hi {username}! To place an order, please send us the item name and your size." },
  { name: "Away message", keywords: "", replyText: "Thanks {username}! We got your message and will reply as soon as we can." },
];

// One place to see and edit every keyword rule across the account — the same rules that also show up
// inline on the Comments and Conversations pages (this isn't a separate rule system, just a consolidated view).
export function KeywordsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--viz-ink)]">Keywords</h1>
        <p className="mt-0.5 text-sm text-[var(--viz-muted)]">Every keyword-triggered auto-reply rule, for comments and for messages, in one place.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--viz-ink-2)]">Comment keywords</h2>
        <AutoReplyCard
          basePath="/comments/auto-reply"
          noun="comments"
          templates={COMMENT_TEMPLATES}
          keywordsExample="e.g. price, cost, size"
          replyExample="e.g. Hi @{username}! Send us a DM and we'll help."
          maxReplyLength={2200}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--viz-ink-2)]">Message keywords</h2>
        <AutoReplyCard
          basePath="/messages/auto-reply"
          noun="messages"
          templates={MESSAGE_TEMPLATES}
          keywordsExample="e.g. price, order, hello"
          replyExample="e.g. Hi {username}! Thanks for messaging us."
          maxReplyLength={1000}
        />
      </section>
    </div>
  );
}
