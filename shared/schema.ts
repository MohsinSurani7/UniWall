import { pgTable, text, integer, boolean, timestamp, varchar, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uniqueId: text("unique_id").notNull().unique(),
  secretKey: text("secret_key").notNull().unique(),
  displayName: text("display_name").notNull().default("Anonymous"),
  gender: text("gender").notNull().default("other"),
  university: text("university").notNull(),
  bio: text("bio"),
  profilePhoto: text("profile_photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  uniqueId: text("unique_id").notNull().unique(),
  text: text("text").notNull(),
  university: text("university").notNull(),
  identityTag: text("identity_tag").notNull(),
  displayName: text("display_name").notNull().default("Anonymous"),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  reported: boolean("reported").notNull().default(false),
  imageUri: text("image_uri"),
  userId: text("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  uniqueId: text("unique_id").notNull().unique(),
  postId: text("post_id").notNull(),
  text: text("text").notNull(),
  displayName: text("display_name").notNull().default("Anonymous"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  uniqueId: text("unique_id").notNull().unique(),
  participant1: text("participant1").notNull(),
  participant2: text("participant2").notNull(),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  uniqueId: text("unique_id").notNull().unique(),
  chatId: text("chat_id").notNull(),
  senderId: text("sender_id").notNull(),
  text: text("text").notNull().default(""),
  imageUri: text("image_uri"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  uniqueId: text("unique_id").notNull().unique(),
  title: text("title").notNull(),
  type: text("type").notNull().default("banner"),
  imageUri: text("image_uri"),
  videoUri: text("video_uri"),
  linkUrl: text("link_url"),
  placement: text("placement").notNull().default("feed"),
  active: boolean("active").notNull().default(true),
  priority: integer("priority").notNull().default(0),
  university: text("university"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reels = pgTable("reels", {
  id: serial("id").primaryKey(),
  uniqueId: text("unique_id").notNull().unique(),
  userId: text("user_id").notNull(),
  displayName: text("display_name").notNull().default("Anonymous"),
  university: text("university").notNull(),
  caption: text("caption"),
  videoData: text("video_data"),
  videoUri: text("video_uri"),
  duration: integer("duration").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertPostSchema = createInsertSchema(posts);
export const insertCommentSchema = createInsertSchema(comments);
export const insertAdSchema = createInsertSchema(ads);
export const insertReelSchema = createInsertSchema(reels);

export interface Post {
  id: string;
  text: string;
  university: string;
  identityTag: string;
  displayName: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  reported: boolean;
  imageUri?: string;
  userId?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  text: string;
  displayName: string;
  createdAt: string;
}

export interface CreatePostInput {
  text: string;
  university: string;
  identityTag: string;
  displayName: string;
  imageUri?: string;
  userId?: string;
}

export interface CreateCommentInput {
  postId: string;
  text: string;
  displayName: string;
}

export interface VoteInput {
  type: 'upvote' | 'downvote';
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  imageUri?: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  secretKey: string;
  displayName: string;
  gender: string;
  university: string;
  bio?: string;
  profilePhoto?: string;
  createdAt: string;
}

export interface Ad {
  id: string;
  title: string;
  type: string;
  imageUri?: string;
  videoUri?: string;
  linkUrl?: string;
  placement: string;
  active: boolean;
  priority: number;
  university?: string;
  createdAt: string;
}

export interface Reel {
  id: string;
  userId: string;
  displayName: string;
  university: string;
  caption?: string;
  videoUri?: string;
  duration: number;
  likes: number;
  views: number;
  createdAt: string;
}
