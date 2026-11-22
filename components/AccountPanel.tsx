"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  ConfigProvider,
  Descriptions,
  Empty,
  Flex,
  Progress,
  Result,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  type TableProps,
  type ThemeConfig,
} from "antd";
import {
  ApartmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined,
  CustomerServiceOutlined,
  ExportOutlined,
  FacebookOutlined,
  HeartOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  InstagramOutlined,
  LineChartOutlined,
  MessageOutlined,
  MinusCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { api, API_BASE, type ConnectionStatus } from "@/lib/api";

const { Title, Text, Paragraph } = Typography;

const errText = (err: unknown, fallback: string) => (err instanceof Error && err.message) || fallback;

type PermissionDef = {
  scope: string;
  aliasScopes: string[];
  label: string;
  hint: string;
  icon: ReactNode;
  required: boolean;
};

const PERMISSIONS: PermissionDef[] = [
  {
    scope: "instagram_business_manage_messages",
    aliasScopes: ["instagram_manage_messages"],
    label: "Direct messages",
    hint: "Read and reply to customer DMs in real time.",
    icon: <MessageOutlined />,
    required: true,
  },
  {
    scope: "instagram_business_manage_comments",
    aliasScopes: ["instagram_manage_comments"],
    label: "Comments and mentions",
    hint: "Watch comments, auto-reply and moderate spam.",
    icon: <CommentOutlined />,
    required: true,
  },
  {
    scope: "instagram_business_content_publish",
    aliasScopes: ["instagram_content_publish"],
    label: "Content publishing",
    hint: "Publish customer photos and captions to your feed.",
    icon: <UploadOutlined />,
    required: true,
  },
  {
    scope: "instagram_business_manage_insights",
    aliasScopes: ["instagram_manage_insights"],
    label: "Media insights",
    hint: "Fetch reach, impressions and engagement analytics.",
    icon: <LineChartOutlined />,
    required: true,
  },
  {
    scope: "instagram_business_basic",
    aliasScopes: ["instagram_basic"],
    label: "Profile access",
    hint: "Read your Instagram handle, bio and profile picture.",
    icon: <UserOutlined />,
    required: true,
  },
  {
    scope: "instagram_manage_engagement",
    aliasScopes: [],
    label: "Engagement and likes",
    hint: "Like comments and posts from the dashboard.",
    icon: <HeartOutlined />,
    required: false,
  },
  {
    scope: "pages_show_list",
    aliasScopes: [],
    label: "Page discovery",
    hint: "Find the Facebook Pages linked to your Instagram account.",
    icon: <ApartmentOutlined />,
    required: false,
  },
  {
    scope: "pages_read_engagement",
    aliasScopes: [],
    label: "Page engagement",
    hint: "Read page-level engagement, follower metrics and metadata.",
    icon: <LineChartOutlined />,
    required: false,
  },
  {
    scope: "instagram_manage_contents",
    aliasScopes: [],
    label: "Content cleanup",
    hint: "Delete and moderate published feed content.",
    icon: <SafetyCertificateOutlined />,
    required: false,
  },
  {
    scope: "instagram_manage_upcoming_events",
    aliasScopes: [],
    label: "Upcoming events",
    hint: "Attach event countdown reminders to posts.",
    icon: <CalendarOutlined />,
    required: false,
  },
];

// Meta features the app relies on. They are not permissions you grant, so they are listed as information only.
const META_FEATURES = [
  {
    key: "human-agent",
    label: "Human Agent (7 days)",
    hint: "Extends the standard 24-hour DM window to 7 days with Meta's HUMAN_AGENT tag.",
    icon: <CustomerServiceOutlined />,
  },
  {
    key: "user-profile",
    label: "User profile access",
    hint: "Reads real customer names and avatars for personalized replies.",
    icon: <IdcardOutlined />,
  },
];

const TOKEN_LIFETIME_DAYS = 60;
const EXPIRING_SOON_DAYS = 14;

// Scoped to this page: makes stock antd components match the app (black primary, Montserrat, soft borders).
const ACCOUNT_THEME: ThemeConfig = {
  token: {
    colorPrimary: "#0b0b0b",
    fontFamily: "inherit",
    borderRadius: 10,
    borderRadiusLG: 20,
    colorBorderSecondary: "#e9e9ee",
  },
  components: {
    Card: { headerFontSize: 16, bodyPadding: 20, headerPadding: 20 },
    Table: { headerBg: "#F1F3F7", headerColor: "#475569", borderColor: "#e9e9ee" },
    Button: { primaryShadow: "none", defaultShadow: "none", fontWeight: 600 },
  },
};

type Props = {
  status: ConnectionStatus | undefined;
  daysLeft: number | null | undefined;
  notice: string | null;
  error: string | null;
  busy: boolean;
  onConnectInstagram: () => void;
};

type FacebookPageStatus =
  | { connected: false }
  | { connected: true; pageId: string; pageName: string; igUserId: string | null };

type PermissionRow = {
  key: string;
  label: string;
  hint: string;
  scope: string | null;
  icon: ReactNode;
  kind: "required" | "optional" | "extra" | "feature";
  ok: boolean;
};

function StatusTag({ row }: { row: PermissionRow }) {
  if (row.kind === "feature") return <Tag icon={<InfoCircleOutlined />} color="blue">Included</Tag>;
  if (row.ok) return <Tag icon={<CheckCircleOutlined />} color="success">Granted</Tag>;
  if (row.kind === "required") return <Tag icon={<CloseCircleOutlined />} color="error">Missing</Tag>;
  return <Tag icon={<MinusCircleOutlined />}>Not granted</Tag>;
}

const KIND_LABEL: Record<PermissionRow["kind"], string> = {
  required: "Required",
  optional: "Optional",
  extra: "Granted by Meta",
  feature: "Meta feature",
};

const PERMISSION_COLUMNS: TableProps<PermissionRow>["columns"] = [
  {
    title: "Permission",
    dataIndex: "label",
    key: "label",
    render: (_, row) => (
      <Flex gap={12} align="flex-start">
        <Avatar shape="square" size={36} icon={row.icon} style={{ background: "#F1F3F7", color: "#0b0b0b", flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <Text strong>{row.label}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {row.hint}
            </Text>
          </div>
        </div>
      </Flex>
    ),
  },
  {
    title: "Scope",
    dataIndex: "scope",
    key: "scope",
    responsive: ["lg"],
    width: 300,
    render: (scope: string | null) => (scope ? <Text code copyable style={{ fontSize: 12 }}>{scope}</Text> : <Text type="secondary">-</Text>),
  },
  {
    title: "Type",
    dataIndex: "kind",
    key: "kind",
    responsive: ["md"],
    width: 150,
    render: (kind: PermissionRow["kind"]) => <Text type="secondary">{KIND_LABEL[kind]}</Text>,
  },
  {
    title: "Status",
    key: "status",
    width: 130,
    render: (_, row) => <StatusTag row={row} />,
  },
];

export function AccountPanel({ status, daysLeft, notice, error: externalError, busy, onConnectInstagram }: Props) {
  const { message, modal } = App.useApp();

  // Facebook Page state
  const [fbStatus, setFbStatus] = useState<FacebookPageStatus | null>(null);
  const [fbBusy, setFbBusy] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [syncingPerms, setSyncingPerms] = useState(false);

  const connected = status?.connected === true;
  const granted = connected && Array.isArray(status.permissions) ? status.permissions : null;

  const isScopeGranted = (p: PermissionDef) => {
    if (granted === null) return true;
    if (granted.includes(p.scope)) return true;
    return p.aliasScopes.some((alias) => granted.includes(alias));
  };

  const coreScopes = PERMISSIONS.filter((p) => p.required);
  const missing = granted ? coreScopes.filter((p) => !isScopeGranted(p)) : [];
  const coreGranted = coreScopes.length - missing.length;
  const corePercent = Math.round((coreGranted / coreScopes.length) * 100);

  const knownScopes = new Set(PERMISSIONS.flatMap((p) => [p.scope, ...p.aliasScopes]));
  const extraGranted = (granted || []).filter((s) => !knownScopes.has(s));

  const permissionRows: PermissionRow[] = [
    ...PERMISSIONS.map<PermissionRow>((p) => ({
      key: p.scope,
      label: p.label,
      hint: p.hint,
      scope: p.scope,
      icon: p.icon,
      kind: p.required ? "required" : "optional",
      ok: isScopeGranted(p),
    })),
    ...extraGranted.map<PermissionRow>((scope) => ({
      key: scope,
      label: scope.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      hint: "Authorized by Meta for your account.",
      scope,
      icon: <CheckCircleOutlined />,
      kind: "extra",
      ok: true,
    })),
    ...META_FEATURES.map<PermissionRow>((f) => ({
      key: f.key,
      label: f.label,
      hint: f.hint,
      scope: null,
      icon: f.icon,
      kind: "feature",
      ok: true,
    })),
  ];

  const days = daysLeft ?? 0;
  const expiringSoon = days < EXPIRING_SOON_DAYS;
  const cleanUsername = status?.connected ? status.username.replace(/^@/, "") : "";
  const avatarUrl =
    status?.connected && status.profilePictureUrl
      ? status.profilePictureUrl.startsWith("/media/")
        ? `${API_BASE}${status.profilePictureUrl}`
        : status.profilePictureUrl
      : undefined;

  const handleSyncPermissions = async () => {
    setSyncingPerms(true);
    try {
      await api("/instagram/connection/sync-permissions", { method: "POST" });
      message.success("Live permissions synced directly from Meta!");
      window.location.reload();
    } catch (err) {
      message.error(errText(err, "Failed to sync permissions"));
    } finally {
      setSyncingPerms(false);
    }
  };

  // Load Facebook Page status
  const loadFacebookStatus = async () => {
    try {
      const res = await api<FacebookPageStatus>("/facebook-page");
      setFbStatus(res);
    } catch {
      // Ignore initial failure if not configured
    }
  };

  useEffect(() => {
    let live = true;
    api<FacebookPageStatus>("/facebook-page")
      .then((res) => live && setFbStatus(res))
      .catch(() => {
        // Not configured yet
      });
    return () => {
      live = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([api("/instagram/connection/sync-profile", { method: "POST" }).catch(() => null), loadFacebookStatus()]);
      message.success("Account & Meta integration status refreshed");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      setRefreshing(false);
    }
  };

  const handleConnectFacebook = async () => {
    setFbBusy(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { url } = await api<{ url: string }>(`/facebook-page/oauth/url?origin=${encodeURIComponent(origin)}&return_path=/account`);
      window.location.href = url;
    } catch (err) {
      message.error(errText(err, "Failed to initiate Facebook Page connection"));
      setFbBusy(false);
    }
  };

  const handleDisconnectFacebook = () => {
    modal.confirm({
      title: "Disconnect Facebook Page?",
      content: "Comment-to-DM keeps working through your Instagram login. The Page is only an optional backup for sending.",
      okText: "Disconnect",
      okType: "danger",
      cancelText: "Keep connected",
      onOk: async () => {
        setFbBusy(true);
        try {
          await api("/facebook-page", { method: "DELETE" });
          message.info("Facebook Page disconnected");
          await loadFacebookStatus();
        } catch (err) {
          message.error(errText(err, "Failed to disconnect Facebook Page"));
        } finally {
          setFbBusy(false);
        }
      },
    });
  };

  const shell = (children: ReactNode) => (
    <ConfigProvider theme={ACCOUNT_THEME}>
      <div className="mx-auto w-full max-w-6xl pb-12">{children}</div>
    </ConfigProvider>
  );

  // Loading, or the server could not be reached
  if (!status) {
    if (externalError) {
      return shell(
        <Card>
          <Result
            status="error"
            title="Could not reach the server"
            subTitle={externalError}
            extra={
              <Button type="primary" onClick={() => window.location.reload()}>
                Try again
              </Button>
            }
          />
        </Card>,
      );
    }
    return shell(
      <Row gutter={[24, 24]} aria-busy="true" aria-label="Checking Meta connection status">
        <Col xs={24} lg={14}>
          <Card>
            <Skeleton active avatar paragraph={{ rows: 4 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </Col>
      </Row>,
    );
  }

  // Not connected yet
  if (!connected) {
    return shell(
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        {externalError && <Alert type="error" showIcon title={externalError} />}
        <Card>
          <Result
            icon={<InstagramOutlined />}
            title="Connect your Instagram account"
            subTitle="Link your Instagram Professional or Business account to turn on DM automations, comment auto-replies and customer photo publishing."
            extra={[
              <Button key="ig" type="primary" size="large" icon={<InstagramOutlined />} onClick={onConnectInstagram} disabled={busy}>
                Connect with Instagram
              </Button>,
              <Button key="fb" size="large" icon={<FacebookOutlined />} onClick={handleConnectFacebook} loading={fbBusy}>
                Connect via Facebook Page
              </Button>,
            ]}
          />
        </Card>
      </Space>,
    );
  }

  // Connected
  return shell(
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      {/* Header */}
      <Flex wrap justify="space-between" align="center" gap={16}>
        <div style={{ minWidth: 0 }}>
          <Title level={2} style={{ margin: 0 }}>
            Account
          </Title>
          <Text type="secondary">Your Instagram connection, the optional Facebook Page backup, and the permissions Meta has granted.</Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined spin={refreshing} />} onClick={handleRefresh} disabled={refreshing}>
            Refresh status
          </Button>
          <Button href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" icon={<ExportOutlined />}>
            Meta Developer Portal
          </Button>
        </Space>
      </Flex>

      {/* Alerts */}
      {notice && <Alert type="success" showIcon closable title={notice} />}
      {externalError && <Alert type="error" showIcon title="Something went wrong" description={externalError} />}
      {expiringSoon && (
        <Alert
          type="warning"
          showIcon
          title={`Your Instagram access expires in ${days} day${days === 1 ? "" : "s"}`}
          description="Reconnect to renew it, so automations don't stop."
          action={
            <Button size="small" type="primary" onClick={onConnectInstagram} loading={busy}>
              Reconnect
            </Button>
          }
        />
      )}

      {/* Connections */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card
            title="Instagram account"
            style={{ height: "100%" }}
            extra={
              <Button icon={<ReloadOutlined spin={busy} />} onClick={onConnectInstagram} loading={busy}>
                Reconnect
              </Button>
            }
          >
            <Flex gap={16} align="center" wrap>
              <Avatar size={64} src={avatarUrl} icon={<UserOutlined />} alt="">
                {cleanUsername.charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <Flex gap={12} align="center" wrap>
                  <Title level={4} style={{ margin: 0 }}>
                    @{cleanUsername}
                  </Title>
                  <Badge status="success" text="Connected" />
                </Flex>
                <Text type="secondary">Instagram Business account</Text>
              </div>
            </Flex>

            <Descriptions
              column={1}
              size="small"
              style={{ marginTop: 20 }}
              styles={{ label: { width: 150 } }}
              items={[
                {
                  key: "token",
                  label: "Access token",
                  children: (
                    <Flex align="center" gap={8} wrap>
                      <Text strong>
                        {days} day{days === 1 ? "" : "s"} remaining
                      </Text>
                      <Text type="secondary">of {TOKEN_LIFETIME_DAYS}</Text>
                      {expiringSoon ? (
                        <Tag icon={<InfoCircleOutlined />} color="warning" style={{ marginInlineEnd: 0 }}>
                          Expiring soon
                        </Tag>
                      ) : (
                        <Tag icon={<CheckCircleOutlined />} color="success" style={{ marginInlineEnd: 0 }}>
                          Healthy
                        </Tag>
                      )}
                      <Tooltip title="Renewed automatically at 3:00 AM once fewer than 10 days remain.">
                        <Tag icon={<SyncOutlined />} color="blue" style={{ marginInlineEnd: 0 }}>
                          Auto-renewal on
                        </Tag>
                      </Tooltip>
                    </Flex>
                  ),
                },              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="Facebook Page"
            style={{ height: "100%" }}
            extra={
              <Space size="small" wrap>
                {fbStatus?.connected && (
                  <>
                    <Button size="small" onClick={handleConnectFacebook} loading={fbBusy}>
                      Switch Page
                    </Button>
                    <Button size="small" danger onClick={handleDisconnectFacebook} loading={fbBusy}>
                      Disconnect
                    </Button>
                  </>
                )}
                <Tag style={{ marginInlineEnd: 0 }}>Optional</Tag>
              </Space>
            }
          >
            <Paragraph
              type="secondary"
              style={{ fontSize: 13 }}
              ellipsis={{ rows: 1, tooltip: "Comment-to-DM already sends through your Instagram login. A connected Page is only used as a backup way to send." }}
            >
              Comment-to-DM already sends via your Instagram login. A Page is only a backup.
            </Paragraph>
            {fbStatus?.connected ? (
              <Descriptions
                column={1}
                size="small"
                styles={{ label: { width: 110 } }}
                items={[
                  { key: "page", label: "Page", children: <Text strong>{fbStatus.pageName}</Text> },
                  { key: "id", label: "Page ID", children: <Text code>{fbStatus.pageId}</Text> },
                  { key: "state", label: "Status", children: <Badge status="success" text="Connected" /> },
                ]}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No Page connected">
                <Button type="primary" icon={<FacebookOutlined />} onClick={handleConnectFacebook} loading={fbBusy}>
                  Connect Facebook Page
                </Button>
              </Empty>
            )}
          </Card>
        </Col>
      </Row>

      {/* Permissions */}
      <Card
        title="Permissions"
        extra={
          <Button icon={<SyncOutlined spin={syncingPerms} />} onClick={handleSyncPermissions} loading={syncingPerms}>
            Sync from Meta
          </Button>
        }
      >
        <Flex gap={16} align="center" wrap style={{ marginBottom: 16 }}>
          <Progress
            type="circle"
            size={64}
            percent={corePercent}
            strokeColor={missing.length === 0 ? "#10b981" : "#f59e0b"}
            aria-label={`${coreGranted} of ${coreScopes.length} required permissions granted`}
          />
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ fontSize: 16 }}>
              {coreGranted} of {coreScopes.length} required permissions granted
            </Text>
            <div>
              <Text type="secondary">What Meta has authorized for your Instagram account. Required permissions are needed for automations to work.</Text>
            </div>
          </div>
        </Flex>

        {missing.length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            title={`Missing: ${missing.map((p) => p.label).join(", ")}`}
            description="Reconnect your Instagram account and approve every permission, or sync if you just granted them."
            action={
              <Button size="small" type="primary" onClick={onConnectInstagram} loading={busy}>
                Reconnect
              </Button>
            }
          />
        )}

        <Table<PermissionRow>
          size="middle"
          pagination={false}
          rowKey="key"
          columns={PERMISSION_COLUMNS}
          dataSource={permissionRows}
        />
      </Card>
    </Space>,
  );
}
