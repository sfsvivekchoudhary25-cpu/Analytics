import type { Metadata } from "next";
import { Fragment } from "react";
import { LegalLayout, LEGAL_EMAIL, LegalLink, LegalList, LegalNote, LegalP, LegalSteps, type LegalSection } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Data deletion instructions",
  description: "How to delete your Fabroniee account and the data we hold, step by step.",
};

const sections: LegalSection[] = [
  {
    id: "in-app",
    title: "Delete it yourself (fastest)",
    body: (
      <Fragment key="f1">
        <LegalSteps
          items={[
            <Fragment key="f2">
              Sign in at <LegalLink href="https://analytics-delta-sage.vercel.app">analytics-delta-sage.vercel.app</LegalLink>.
            </Fragment>,
            <Fragment key="f3">
              Open <strong className="font-medium text-slate-900">Settings</strong> in the left menu (<LegalLink href="/settings">direct link</LegalLink>).
            </Fragment>,
            <Fragment key="f4">
              Click <strong className="font-medium text-slate-900">Delete</strong> in the &ldquo;Delete account&rdquo; row.
            </Fragment>,
            "Type DELETE to confirm.",
          ]}
        />
        <LegalNote title="It happens immediately and cannot be undone." tone="rose">
          Everything listed under &ldquo;What is erased&rdquo; below is deleted from our database at once.
        </LegalNote>
      </Fragment>
    ),
  },
  {
    id: "email",
    title: "Ask us by email",
    body: (
      <Fragment key="f5">
        <LegalSteps
          items={[
            <Fragment key="f6">
              Email <LegalLink href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</LegalLink> with the subject <strong className="font-medium text-slate-900">&ldquo;Delete my data&rdquo;</strong>.
            </Fragment>,
            "Include the Instagram username or Facebook Page name that was connected.",
            "We erase your records and confirm by email within 48 hours.",
          ]}
        />
      </Fragment>
    ),
  },
  {
    id: "meta",
    title: "Remove the app in Facebook or Instagram",
    body: (
      <Fragment key="f7">
        <LegalSteps
          items={[
            <Fragment key="f8">
              In Facebook, go to <strong className="font-medium text-slate-900">Settings &amp; privacy → Settings → Apps and websites</strong>. In Instagram, go to <strong className="font-medium text-slate-900">Settings → Apps and websites</strong>.
            </Fragment>,
            <Fragment key="f9">
              Find <strong className="font-medium text-slate-900">Fabroniee</strong> and click <strong className="font-medium text-slate-900">Remove</strong>.
            </Fragment>,
            "Choose to delete the data it holds when Meta offers that.",
          ]}
        />
        <LegalP>
          Removing the app deletes our access tokens, so we can no longer act for your account. If you also ask Meta to delete the data, Meta sends us a signed request. We erase what we hold for that Instagram account and reply with a confirmation code and a page where you can see the status.
        </LegalP>
      </Fragment>
    ),
  },
  {
    id: "erased",
    title: "What is erased",
    body: (
      <LegalList
        items={[
          "Your login and profile.",
          "Your Instagram and Facebook Page connections and access tokens.",
          "Comments, conversations and any stored messages.",
          "Automations, automatic replies, settings and their logs.",
          "Customer photos, stories, voice notes, saved reels and uploaded images.",
        ]}
      />
    ),
  },
  {
    id: "kept",
    title: "What is not erased",
    body: (
      <LegalList
        items={[
          "Posts, comments and messages that live on Instagram itself. We do not control them, and you manage them in Instagram.",
          "Copies in our database provider's routine backups, which are overwritten as those backups expire.",
          "Anything we are required by law to keep.",
        ]}
      />
    ),
  },
];

export default function DataDeletionPage() {
  return (
    <LegalLayout
      page="data-deletion"
      eyebrow="Data deletion"
      title="Delete your data, step by step."
      intro={
        <Fragment key="f10">
          You can erase your <strong className="font-medium text-slate-900">Fabroniee</strong> account and everything we hold about it. There are three ways to do it, and the first takes under a minute.
        </Fragment>
      }
      highlights={[
        { title: "Instant", text: "Settings → Delete account removes everything straight away." },
        { title: "One confirmation", text: "You type DELETE once, so it can’t happen by accident." },
        { title: "By email", text: "Ask us and we confirm within 48 hours." },
        { title: "Through Meta", text: "Removing the app in Facebook or Instagram also works." },
      ]}
      sections={sections}
    />
  );
}
