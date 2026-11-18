import type { Metadata } from "next";
import { Fragment } from "react";
import { LegalLayout, LegalLink, LegalList, LegalNote, LegalP, type LegalSection } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Fabroniee collects, how your customers' messages are handled, and how to delete your data.",
};

const sections: LegalSection[] = [
  {
    id: "collect",
    title: "What we collect",
    body: (
      <Fragment key="f1">
        <LegalP>When you sign in and connect Instagram, we collect only what the app needs to work:</LegalP>
        <LegalList
          items={[
            <Fragment key="f2">
              <strong className="font-medium text-slate-900">Account details:</strong> your name and email. Your password is kept only as a one-way hash.
            </Fragment>,
            <Fragment key="f3">
              <strong className="font-medium text-slate-900">Instagram details:</strong> your account ID, username, profile picture and the permissions you granted.
            </Fragment>,
            <Fragment key="f4">
              <strong className="font-medium text-slate-900">Access tokens:</strong> the keys that let us act for your account. They are encrypted and you can revoke them at any time.
            </Fragment>,
            <Fragment key="f5">
              <strong className="font-medium text-slate-900">Comments on your posts:</strong> the text and ID of comments, to match your keywords and to show your comments inbox.
            </Fragment>,
            <Fragment key="f6">
              <strong className="font-medium text-slate-900">Your settings and activity log:</strong> your automations, and which comment triggered which DM, when, and whether it was delivered.
            </Fragment>,
            <Fragment key="f7">
              <strong className="font-medium text-slate-900">Files you upload:</strong> images you use in cards and messages.
            </Fragment>,
            <Fragment key="f8">
              <strong className="font-medium text-slate-900">Direct messages:</strong> handled differently, see <a href="#messages" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">your customers&apos; messages</a>.
            </Fragment>,
          ]}
        />
      </Fragment>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <Fragment key="f9">
        <LegalList
          items={[
            "To show your inbox, comments and performance numbers.",
            "To send the automatic DM when a comment matches one of your automations.",
            "To send the automatic replies you switch on, using your keyword rules or, if you turn it on, AI.",
            "To keep conversations in order, avoid sending the same message twice, and decide whether a reply is still needed (for example, not answering something you already answered yourself).",
          ]}
        />
        <LegalP>We do not use your data or your customers&apos; messages for advertising, and we do not build profiles of your customers.</LegalP>
      </Fragment>
    ),
  },
  {
    id: "messages",
    title: "Your customers’ messages",
    body: (
      <Fragment key="f10">
        <LegalNote title="By default, we do not keep the text of direct messages in our database." tone="butter">
          You can choose to keep them, encrypted, from Settings. You can change this at any time.
        </LegalNote>
        <LegalP>
          <strong className="font-medium text-slate-900">When message storage is off (the default for new accounts):</strong>
        </LegalP>
        <LegalList
          items={[
            "Chats are read live from Instagram when you open them.",
            "For automatic replies, the text is held briefly in the server's memory, for up to 24 hours (the length of Instagram's reply window). It is never written to our database.",
            "We keep only small facts: who wrote, when, whether it was sent or received, unread counts, and whether a reply went out. No message text.",
          ]}
        />
        <LegalP>
          <strong className="font-medium text-slate-900">When you choose to store messages:</strong>
        </LegalP>
        <LegalList
          items={[
            "The text, attachment links and chat previews are saved encrypted (AES-256-GCM). The key is kept outside the database, so a copy of the database alone does not reveal them.",
            "They are visible only to your account.",
            "Turning storage off again erases the message text saved so far.",
          ]}
        />
        <LegalP>
          If you turn on AI replies, the customer&apos;s message and the last few messages of that chat are sent to our AI provider to write one reply. They are used for nothing else. The messages themselves also stay in Instagram, which we do not control.
        </LegalP>
      </Fragment>
    ),
  },
  {
    id: "sharing",
    title: "Who else sees it",
    body: (
      <Fragment key="f11">
        <LegalList
          items={[
            <Fragment key="f12">
              <strong className="font-medium text-slate-900">We never sell or rent</strong> your data or your customers&apos; data, and we do not share it with advertisers or data brokers.
            </Fragment>,
            "The companies that run the app (hosting, database and image storage) process data only to provide the service. If you use AI replies, our AI provider does too, as described above.",
            "Meta (Instagram and Facebook) receives the messages and replies you send through the official API, as it always does.",
            "We may disclose information if the law requires it.",
            "Accounts are kept apart: no account can read another account's data.",
          ]}
        />
      </Fragment>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <LegalList
        items={[
          "All traffic uses HTTPS (TLS).",
          "Access tokens are encrypted at rest (AES-256-GCM). So are stored messages, if you choose to keep them.",
          "Each account's data is separated by database-level rules, not only by the app.",
          "You can disconnect Instagram at any time, which removes our access.",
        ]}
      />
    ),
  },
  {
    id: "deleting",
    title: "How long we keep it, and deleting it",
    body: (
      <Fragment key="f13">
        <LegalP>We keep your data while your account is active. You can remove it yourself, at any time:</LegalP>
        <LegalList
          items={[
            "Delete a single conversation from the Conversations page.",
            "Disconnect Instagram from the Account page.",
            <Fragment key="f14">
              Delete your account from <strong className="font-medium text-slate-900">Settings → Delete account</strong>. This erases your login, connections and tokens, comments, messages, automations, logs and uploaded files straight away.
            </Fragment>,
          ]}
        />
        <LegalP>
          If you remove the app in Facebook or Instagram, we delete the access tokens. If Meta sends us a data deletion request for your account, we erase your data. You can also ask by email and we will confirm within 48 hours. Copies in our database provider&apos;s routine backups are overwritten as those backups expire. Full steps are on the <LegalLink href="/data-deletion">data deletion page</LegalLink>.
        </LegalP>
      </Fragment>
    ),
  },
  {
    id: "choices",
    title: "Your choices",
    body: (
      <LegalList
        items={[
          "Turn message storage on or off in Settings.",
          "Disconnect Instagram, which also withdraws our permission to act for your account.",
          "Ask us what we hold about you, or to correct or delete it, by email.",
        ]}
      />
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: <LegalP>If we change how we handle data, we will update this page and the date at the top. For big changes, we will also tell you in the app.</LegalP>,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      page="privacy"
      eyebrow="Privacy Policy"
      title="Your data, in plain words."
      intro={
        <Fragment key="f15">
          This is how <strong className="font-medium text-slate-900">Fabroniee</strong>, at fabroniee.store, handles your information and your customers&apos; messages when you connect Instagram.
        </Fragment>
      }
      highlights={[
        { title: "Messages aren’t kept by default", text: "Customer message text is not saved in our database unless you turn that on." },
        { title: "Encrypted if you keep them", text: "Stored messages and access tokens are encrypted at rest (AES-256-GCM)." },
        { title: "Never sold", text: "We don’t sell or rent your data or your customers’ data." },
        { title: "Delete it yourself", text: "One button in Settings erases your account and everything in it." },
      ]}
      sections={sections}
    />
  );
}
