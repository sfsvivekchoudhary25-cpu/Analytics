"use client";

import { useEffect, useState } from "react";
import { App, Button, Input, Modal, Switch } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { activeAccount, api, auth, type ConnectionStatus } from "@/lib/api";

// Settings: privacy of your customers' messages, and your data. (Connections, tokens and integrations stay in Account.)
export function SettingsPanel({ status }: { status: ConnectionStatus | undefined }) {
  const { message, modal } = App.useApp();

  // "Don't store my messages" switch (null = not loaded yet, or no Instagram account connected)
  const [storeMessages, setStoreMessages] = useState<boolean | null>(null);
  const [privacySaving, setPrivacySaving] = useState(false);

  // Permanent account deletion (typed confirmation)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const username = status?.connected ? status.username : "";
  useEffect(() => {
    if (!status?.connected) {
      setStoreMessages(null);
      return;
    }
    let live = true;
    api<{ connected: boolean; storeMessages: boolean }>("/messages/privacy")
      .then((r) => live && setStoreMessages(r.connected ? r.storeMessages : null))
      .catch(() => live && setStoreMessages(null));
    return () => {
      live = false;
    };
  }, [status?.connected, username]);

  const savePrivacy = async (store: boolean) => {
    setPrivacySaving(true);
    try {
      const r = await api<{ storeMessages: boolean; scrubbed: number }>("/messages/privacy", {
        method: "POST",
        body: JSON.stringify({ storeMessages: store }),
      });
      setStoreMessages(r.storeMessages);
      message.success(
        store
          ? "Messages will be stored again (encrypted)."
          : `Message text is no longer stored.${r.scrubbed ? ` Erased the text of ${r.scrubbed} saved message(s).` : ""}`,
      );
    } catch (err: any) {
      message.error(err?.message || "Could not change this setting.");
    } finally {
      setPrivacySaving(false);
    }
  };

  const onTogglePrivacy = (store: boolean) => {
    if (store) return void savePrivacy(true);
    modal.confirm({
      title: "Stop storing message text?",
      content:
        "Customer messages will be read live from Instagram instead of our database, and the message text already saved for your account will be erased. Chats may open a little slower, and you can't search old messages. Automatic replies keep working.",
      okText: "Stop storing",
      okButtonProps: { danger: true },
      cancelText: "Keep storing",
      onOk: () => savePrivacy(false),
    });
  };

  // Calls the server to delete everything for the signed-in user. Only signs out if the server says it worked.
  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api("/account/delete", { method: "POST", body: JSON.stringify({ confirm: deleteText.trim() }) });
      message.success("Your account and all its data have been permanently deleted.");
      auth.clear();
      activeAccount.clear();
      setTimeout(() => {
        window.location.href = "/login";
      }, 800);
    } catch (err: any) {
      message.error(err?.message || "Could not delete your account. Nothing was changed.");
      setDeleting(false);
    }
  };

  return (
    <div className="w-full pb-12">
      <div className="pb-2">
        <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">Privacy of your customers&apos; messages, and your data.</p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-6 py-4 border-b border-slate-200/70">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900">Don&apos;t store my messages</div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{storeMessages === null ? "Connect an Instagram account in Account to use this." : storeMessages ? "Messages are saved in our database, encrypted. Turn on to keep no message text; chats are read live from Instagram." : "Message text is not saved. Chats are read live from Instagram, so they open a little slower and old messages can&apos;t be searched."}</p>
          </div>
          <div className="shrink-0">
            <Switch
              checked={storeMessages === null ? false : !storeMessages}
              disabled={storeMessages === null}
              loading={privacySaving}
              onChange={(on) => onTogglePrivacy(!on)}
              aria-label="Don't store my messages"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-6 py-4 border-b border-slate-200/70">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900">Privacy Policy</div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">How we handle your data and your customers&apos; messages.</p>
          </div>
          <div className="shrink-0">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50"
            >
              View
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between gap-6 py-4 border-b border-slate-200/70">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900">Data deletion instructions</div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Step by step: how to have your data erased.</p>
          </div>
          <div className="shrink-0">
            <a
              href="/data-deletion"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50"
            >
              View
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between gap-6 py-4 border-b border-slate-200/70">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900">Terms of Service</div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">The rules for using the app.</p>
          </div>
          <div className="shrink-0">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50"
            >
              View
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between gap-6 py-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900">Delete account</div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Permanently erase your login, connections, messages, automations and files. This cannot be undone.</p>
          </div>
          <div className="shrink-0">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                setDeleteText("");
                setDeleteOpen(true);
              }}
              className="!h-8 !rounded-lg !text-xs !font-medium"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        title="Permanently delete your account?"
        onCancel={() => !deleting && setDeleteOpen(false)}
        okText="Delete everything"
        okType="danger"
        okButtonProps={{ disabled: deleteText.trim() !== "DELETE", loading: deleting }}
        cancelButtonProps={{ disabled: deleting }}
        onOk={confirmDeleteAccount}
        mask={{ closable: false }}
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>This cannot be undone. The following is erased from our database:</p>
          <ul className="list-disc space-y-1 pl-5 text-xs">
            <li>Your login and profile</li>
            <li>Your Instagram and Facebook Page connections and access tokens</li>
            <li>All comments, conversations and messages</li>
            <li>All automations, auto-replies, settings and their logs</li>
            <li>Customer photos, stories, voice notes and saved reels</li>
          </ul>
          <p className="text-xs">Posts and messages already on Instagram are not touched.</p>
          <p className="text-xs font-semibold text-slate-800">Type DELETE to confirm:</p>
          <Input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="DELETE" autoComplete="off" />
        </div>
      </Modal>
    </div>
  );
}
