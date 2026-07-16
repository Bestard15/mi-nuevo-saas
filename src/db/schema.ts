import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ---------------------------------------------------------------------------
// Auth.js (dashboard users: founders / product teams that own an organization)
// ---------------------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ---------------------------------------------------------------------------
// Multi-tenancy: organization -> projects (tenant URL slug) -> boards -> posts
// ---------------------------------------------------------------------------

export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member"]);

export const organizations = pgTable("organization", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const memberships = pgTable(
  "membership",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (m) => [primaryKey({ columns: [m.organizationId, m.userId] })]
);

export const projects = pgTable(
  "project",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Public URL: /p/{slug} — globally unique across tenants.
    slug: text("slug").notNull().unique(),
    // Private boards on every plan: pricing must never gate privacy.
    isPrivate: boolean("is_private").notNull().default(false),
    // HS256 secret the customer's backend uses to sign identify() JWTs.
    // The SQL default covers pre-existing rows; new projects get a fresh
    // secret from the application on creation.
    ssoSecret: text("sso_secret")
      .notNull()
      .default(sql`md5(random()::text) || md5(random()::text)`),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (p) => [index("project_org_idx").on(p.organizationId)]
);

// ---------------------------------------------------------------------------
// Feedback domain
// ---------------------------------------------------------------------------

export const statusCategoryEnum = pgEnum("status_category", [
  "open",
  "planned",
  "in_progress",
  "shipped",
  "closed",
]);

export const statuses = pgTable(
  "status",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: statusCategoryEnum("category").notNull().default("open"),
    color: text("color").notNull().default("#6b7280"),
    position: integer("position").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
  },
  (s) => [index("status_project_idx").on(s.projectId)]
);

export const boards = pgTable(
  "board",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    isPrivate: boolean("is_private").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (b) => [uniqueIndex("board_project_slug_idx").on(b.projectId, b.slug)]
);

// End users: the customers of our customers, identified via the widget/SDK
// (JWT identify). They carry revenue attributes so posts can be prioritized
// by revenue impact instead of raw vote count.
export const endUsers = pgTable(
  "end_user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    email: text("email"),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    company: text("company"),
    plan: text("plan"),
    mrr: numeric("mrr", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (e) => [uniqueIndex("end_user_project_external_idx").on(e.projectId, e.externalId)]
);

export const posts = pgTable(
  "post",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    boardId: text("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    statusId: text("status_id").references(() => statuses.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    content: text("content"),
    // A post is authored either by an end user (widget/public board) or by a
    // team member (dashboard); exactly one of these should be set.
    authorEndUserId: text("author_end_user_id").references(() => endUsers.id, {
      onDelete: "set null",
    }),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    // Denormalized aggregates, kept in sync on vote writes, so board sorting
    // (by votes or by revenue impact) never needs a join.
    voteCount: integer("vote_count").notNull().default(0),
    revenueImpact: numeric("revenue_impact", { precision: 14, scale: 2 }).notNull().default("0"),
    isPinned: boolean("is_pinned").notNull().default(false),
    // Set the first time the post reaches a "shipped" status, so voters are
    // never notified twice even if the status is toggled back and forth.
    shippedNotifiedAt: timestamp("shipped_notified_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (p) => [
    index("post_board_idx").on(p.boardId),
    index("post_status_idx").on(p.statusId),
    index("post_board_votes_idx").on(p.boardId, p.voteCount),
    index("post_board_revenue_idx").on(p.boardId, p.revenueImpact),
  ]
);

export const votes = pgTable(
  "vote",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    endUserId: text("end_user_id").references(() => endUsers.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    // Snapshot of the voter's MRR at vote time; summed into post.revenueImpact.
    mrrSnapshot: numeric("mrr_snapshot", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (v) => [
    uniqueIndex("vote_post_end_user_idx").on(v.postId, v.endUserId),
    uniqueIndex("vote_post_user_idx").on(v.postId, v.userId),
  ]
);

export const comments = pgTable(
  "comment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    body: text("body").notNull(),
    authorEndUserId: text("author_end_user_id").references(() => endUsers.id, {
      onDelete: "set null",
    }),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    isTeamReply: boolean("is_team_reply").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (c) => [index("comment_post_idx").on(c.postId)]
);

// Changelog: announcements the team publishes when features ship. An entry
// is a draft until published_at is set.
export const changelogEntries = pgTable(
  "changelog_entry",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    publishedAt: timestamp("published_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (c) => [index("changelog_project_idx").on(c.projectId, c.publishedAt)]
);

// ---------------------------------------------------------------------------
// Public API + webhooks (Fase 5)
// ---------------------------------------------------------------------------

// API keys authenticate the public REST API (Authorization: Bearer eb_...).
// Only a SHA-256 hash is stored; the plaintext is shown once at creation.
// The prefix (first chars) lets the dashboard display which key is which.
export const apiKeys = pgTable(
  "api_key",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (k) => [index("api_key_project_idx").on(k.projectId)]
);

// Outbound webhook endpoints. Every delivery is signed with the endpoint's
// secret (HMAC-SHA256 over "<timestamp>.<body>") so receivers can verify
// authenticity and reject replays.
export const webhookEndpoints = pgTable(
  "webhook_endpoint",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    // Subscribed event names ("post.created", ...). Empty array = all events.
    events: text("events").array().notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),
    // Observability for the dashboard: outcome of the most recent delivery.
    lastStatus: integer("last_status"),
    lastAttemptAt: timestamp("last_attempt_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (w) => [index("webhook_project_idx").on(w.projectId)]
);

// ---------------------------------------------------------------------------
// Relations (drizzle query API)
// ---------------------------------------------------------------------------

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  projects: many(projects),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  boards: many(boards),
  statuses: many(statuses),
  endUsers: many(endUsers),
  changelogEntries: many(changelogEntries),
  apiKeys: many(apiKeys),
  webhookEndpoints: many(webhookEndpoints),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  project: one(projects, { fields: [apiKeys.projectId], references: [projects.id] }),
}));

export const webhookEndpointsRelations = relations(webhookEndpoints, ({ one }) => ({
  project: one(projects, { fields: [webhookEndpoints.projectId], references: [projects.id] }),
}));

export const changelogEntriesRelations = relations(changelogEntries, ({ one }) => ({
  project: one(projects, {
    fields: [changelogEntries.projectId],
    references: [projects.id],
  }),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  project: one(projects, { fields: [boards.projectId], references: [projects.id] }),
  posts: many(posts),
}));

export const statusesRelations = relations(statuses, ({ one, many }) => ({
  project: one(projects, { fields: [statuses.projectId], references: [projects.id] }),
  posts: many(posts),
}));

export const endUsersRelations = relations(endUsers, ({ one, many }) => ({
  project: one(projects, { fields: [endUsers.projectId], references: [projects.id] }),
  votes: many(votes),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  board: one(boards, { fields: [posts.boardId], references: [boards.id] }),
  status: one(statuses, { fields: [posts.statusId], references: [statuses.id] }),
  authorEndUser: one(endUsers, { fields: [posts.authorEndUserId], references: [endUsers.id] }),
  authorUser: one(users, { fields: [posts.authorUserId], references: [users.id] }),
  votes: many(votes),
  comments: many(comments),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  post: one(posts, { fields: [votes.postId], references: [posts.id] }),
  endUser: one(endUsers, { fields: [votes.endUserId], references: [endUsers.id] }),
  user: one(users, { fields: [votes.userId], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  authorEndUser: one(endUsers, {
    fields: [comments.authorEndUserId],
    references: [endUsers.id],
  }),
  authorUser: one(users, { fields: [comments.authorUserId], references: [users.id] }),
}));
