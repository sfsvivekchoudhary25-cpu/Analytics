import type { Metadata } from "next";
import { Fragment } from "react";
import { LegalLayout, LegalLink, LegalList, LegalNote, LegalP, type LegalSection } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using Fabroniee: your account, acceptable use and ending your account.",
};

const sections: LegalSection[] = [
  {
    id: "service",
    title: "The service",
    body: (
      <Fragment key="f1">
        <LegalP>
          Fabroniee provides creator tools: Comment-to-DM funnels, an inbox for your comments and messages, automatic replies and analytics. They run on the official Meta APIs. By connecting an account, building an automation or otherwise using the service, you agree to these terms.
        </LegalP>
      </Fragment>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <LegalList
        items={[
          "Connect only Instagram accounts that you own or are allowed to manage.",
          "Keep your login private. You are responsible for what happens under your account.",
          "Tell us at once if you think someone else has got into your account.",
        ]}
      />
    ),
  },
  {
    id: "meta",
    title: "Meta’s rules also apply",
    body: (
      <Fragment key="f2">
        <LegalP>You agree to follow:</LegalP>
        <LegalList
          items={[
            "Meta's Community Standards and Platform Terms.",
            "Instagram's Terms of Use and messaging policies.",
            "The privacy and consumer laws that apply to you.",
          ]}
        />
        <LegalNote title="Instagram sets limits, and we follow them." tone="butter">
          For example, a customer must message you before you can reply, replies must go out within Instagram&apos;s time window, and a comment can get one private reply. We cannot send what Instagram does not allow.
        </LegalNote>
      </Fragment>
    ),
  },
  {
    id: "use",
    title: "Acceptable use",
    body: (
      <Fragment key="f3">
        <LegalP>You may not use Fabroniee to send:</LegalP>
        <LegalList
          items={[
            "unsolicited spam or bulk messages,",
            "harassment or threats,",
            "fraud, scams or phishing links,",
            "material you do not have the right to use.",
          ]}
        />
        <LegalP>We may suspend or end accounts that do this, with or without notice.</LegalP>
      </Fragment>
    ),
  },
  {
    id: "messages",
    title: "Messages you send",
    body: (
      <LegalList
        items={[
          "Automatic messages are sent in your name, so you are responsible for what they say. Check your rules before you switch them on.",
          "Honour a customer's request to stop hearing from you.",
          "Replies written by AI are drafts of what you asked for. Look at how they read, and keep a person ready to take over.",
        ]}
      />
    ),
  },
  {
    id: "data",
    title: "Your data",
    body: (
      <LegalP>
        What we collect and how we handle it, including your customers&apos; messages, is in our <LegalLink href="/privacy">Privacy Policy</LegalLink>. You can delete your data yourself at any time, as described on the <LegalLink href="/data-deletion">data deletion page</LegalLink>.
      </LegalP>
    ),
  },
  {
    id: "changes",
    title: "Changes and availability",
    body: (
      <LegalP>
        We may change or pause parts of the service, for example because Meta changes its rules. We may also update these terms. If we do, we will change the date at the top, and using the service after that means you accept the new terms.
      </LegalP>
    ),
  },
  {
    id: "ending",
    title: "Ending your account",
    body: (
      <Fragment key="f4">
        <LegalP>
          You can end your account at any time from <strong className="font-medium text-slate-900">Settings → Delete account</strong>. When you do, your tokens, automations and other data are permanently deleted. We may end your account if you break these terms.
        </LegalP>
      </Fragment>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      page="terms"
      eyebrow="Terms of Service"
      title="The rules, kept short."
      intro={
        <Fragment key="f5">
          By using <strong className="font-medium text-slate-900">Fabroniee</strong>, at fabroniee.store, you agree to what is on this page.
        </Fragment>
      }
      highlights={[
        { title: "Your accounts only", text: "Connect Instagram accounts you own or manage." },
        { title: "No spam", text: "No unsolicited bulk messages, harassment or scams." },
        { title: "Meta’s rules apply", text: "Instagram’s messaging limits and policies come first." },
        { title: "Leave any time", text: "Delete your account in Settings whenever you like." },
      ]}
      sections={sections}
    />
  );
}
