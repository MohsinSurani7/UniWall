import { randomUUID } from "crypto";
import { eq, and, or, desc, asc, gt, sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "../shared/schema";
import type {
  Post, Comment, CreatePostInput, CreateCommentInput,
  Message, Chat, UserProfile, Ad, Reel
} from "../shared/schema";
import zlib from "zlib";

function compress(data: string): string {
  return zlib.gzipSync(Buffer.from(data)).toString("base64");
}

function decompress(data: string): string {
  return zlib.gunzipSync(Buffer.from(data, "base64")).toString("utf-8");
}

function generateSecretKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += "-";
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

export class PostStorage {
  constructor() {
    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    setInterval(async () => {
      try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await db.delete(schema.messages).where(
          sql`${schema.messages.createdAt} < ${cutoff}`
        );
      } catch {}
    }, 60 * 60 * 1000);
  }

  async seedData() {
    const existingPosts = await db.select().from(schema.posts).limit(1);
    if (existingPosts.length > 0) return;

    const seeds: CreatePostInput[] = [
      { text: "Anyone else think the new cafeteria menu is actually fire? Those paratha rolls hit different at 2am during finals week", university: "nust", identityTag: "Night Owl", displayName: "Anonymous" },
      { text: "Saw someone bring a full pillow and blanket to the library during midterms. Absolute legend.", university: "nust", identityTag: "Library Ghost", displayName: "Anonymous" },
      { text: "The wifi in the hostel has been so bad lately. Had to hotspot my phone just to submit an assignment.", university: "nust", identityTag: "Freshman", displayName: "Ali K." },
      { text: "To the person who left their notes in Room 204 last Friday - I found them and left them at the admin desk.", university: "fast", identityTag: "Senior", displayName: "Anonymous" },
      { text: "PSA: The samosa guy near Gate 2 now has a new chutney and it's absolutely incredible.", university: "fast", identityTag: "Cafeteria Regular", displayName: "Anonymous" },
      { text: "That moment when the professor extends the deadline by 24 hours and you haven't even started yet.", university: "fast", identityTag: "Backbencher", displayName: "Hamza" },
      { text: "The sunset from the rooftop of the main building yesterday was unreal. This campus has its moments.", university: "pu", identityTag: "Sophomore", displayName: "Anonymous" },
      { text: "I've been going to the wrong lecture for two weeks straight and nobody said anything.", university: "pu", identityTag: "Freshman", displayName: "Anonymous" },
      { text: "Shoutout to the security uncle who always says salam with a smile. You make mornings bearable.", university: "comsats", identityTag: "Anonymous", displayName: "Anonymous" },
      { text: "Found the best study spot - the bench under the old tree near the cricket ground.", university: "comsats", identityTag: "Topper", displayName: "Sara" },
    ];

    for (const seed of seeds) {
      await this.createPost(seed);
    }
  }

  async getPostsByUniversity(university: string): Promise<Post[]> {
    const rows = await db.select().from(schema.posts)
      .where(and(eq(schema.posts.university, university), eq(schema.posts.reported, false)))
      .orderBy(desc(schema.posts.createdAt));
    return rows.map(r => ({
      id: r.uniqueId,
      text: r.text,
      university: r.university,
      identityTag: r.identityTag,
      displayName: r.displayName,
      upvotes: r.upvotes,
      downvotes: r.downvotes,
      commentCount: r.commentCount,
      reported: r.reported,
      imageUri: r.imageUri ?? undefined,
      userId: r.userId ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getAllPosts(): Promise<Post[]> {
    const rows = await db.select().from(schema.posts).orderBy(desc(schema.posts.createdAt));
    return rows.map(r => ({
      id: r.uniqueId,
      text: r.text,
      university: r.university,
      identityTag: r.identityTag,
      displayName: r.displayName,
      upvotes: r.upvotes,
      downvotes: r.downvotes,
      commentCount: r.commentCount,
      reported: r.reported,
      imageUri: r.imageUri ?? undefined,
      userId: r.userId ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createPost(input: CreatePostInput): Promise<Post> {
    const uid = randomUUID();
    const [row] = await db.insert(schema.posts).values({
      uniqueId: uid,
      text: input.text,
      university: input.university,
      identityTag: input.identityTag,
      displayName: input.displayName || "Anonymous",
      imageUri: input.imageUri,
      userId: input.userId,
    }).returning();
    return {
      id: row.uniqueId,
      text: row.text,
      university: row.university,
      identityTag: row.identityTag,
      displayName: row.displayName,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      commentCount: row.commentCount,
      reported: row.reported,
      imageUri: row.imageUri ?? undefined,
      userId: row.userId ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async votePost(id: string, type: 'upvote' | 'downvote'): Promise<Post | undefined> {
    const field = type === 'upvote' ? schema.posts.upvotes : schema.posts.downvotes;
    const [row] = await db.update(schema.posts)
      .set({ [type === 'upvote' ? 'upvotes' : 'downvotes']: sql`${field} + 1` })
      .where(eq(schema.posts.uniqueId, id)).returning();
    if (!row) return undefined;
    return {
      id: row.uniqueId, text: row.text, university: row.university,
      identityTag: row.identityTag, displayName: row.displayName,
      upvotes: row.upvotes, downvotes: row.downvotes,
      commentCount: row.commentCount, reported: row.reported,
      imageUri: row.imageUri ?? undefined, userId: row.userId ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async reportPost(id: string): Promise<Post | undefined> {
    const [row] = await db.update(schema.posts)
      .set({ reported: true })
      .where(eq(schema.posts.uniqueId, id)).returning();
    if (!row) return undefined;
    return {
      id: row.uniqueId, text: row.text, university: row.university,
      identityTag: row.identityTag, displayName: row.displayName,
      upvotes: row.upvotes, downvotes: row.downvotes,
      commentCount: row.commentCount, reported: row.reported,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(schema.posts).where(eq(schema.posts.uniqueId, id));
    return true;
  }

  async getComments(postId: string): Promise<Comment[]> {
    const rows = await db.select().from(schema.comments)
      .where(eq(schema.comments.postId, postId))
      .orderBy(asc(schema.comments.createdAt));
    return rows.map(r => ({
      id: r.uniqueId, postId: r.postId, text: r.text,
      displayName: r.displayName, createdAt: r.createdAt.toISOString(),
    }));
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const uid = randomUUID();
    const [row] = await db.insert(schema.comments).values({
      uniqueId: uid, postId: input.postId, text: input.text,
      displayName: input.displayName || "Anonymous",
    }).returning();
    await db.update(schema.posts)
      .set({ commentCount: sql`${schema.posts.commentCount} + 1` })
      .where(eq(schema.posts.uniqueId, input.postId));
    return {
      id: row.uniqueId, postId: row.postId, text: row.text,
      displayName: row.displayName, createdAt: row.createdAt.toISOString(),
    };
  }

  async registerUser(profile: { displayName: string; gender: string; university: string }): Promise<UserProfile> {
    const uid = randomUUID();
    const key = generateSecretKey();
    const [row] = await db.insert(schema.users).values({
      uniqueId: uid,
      secretKey: key,
      displayName: profile.displayName || "Anonymous",
      gender: profile.gender || "other",
      university: profile.university,
    }).returning();
    return {
      id: row.uniqueId, secretKey: row.secretKey,
      displayName: row.displayName, gender: row.gender,
      university: row.university, bio: row.bio ?? undefined,
      profilePhoto: row.profilePhoto ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async loginUser(secretKey: string): Promise<UserProfile | undefined> {
    const [row] = await db.select().from(schema.users)
      .where(eq(schema.users.secretKey, secretKey));
    if (!row) return undefined;
    return {
      id: row.uniqueId, secretKey: row.secretKey,
      displayName: row.displayName, gender: row.gender,
      university: row.university, bio: row.bio ?? undefined,
      profilePhoto: row.profilePhoto ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getUser(id: string): Promise<UserProfile | undefined> {
    const [row] = await db.select().from(schema.users)
      .where(eq(schema.users.uniqueId, id));
    if (!row) return undefined;
    return {
      id: row.uniqueId, secretKey: row.secretKey,
      displayName: row.displayName, gender: row.gender,
      university: row.university, bio: row.bio ?? undefined,
      profilePhoto: row.profilePhoto ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateUserProfile(id: string, data: { bio?: string; profilePhoto?: string; displayName?: string }): Promise<UserProfile | undefined> {
    const updateData: any = {};
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.profilePhoto !== undefined) updateData.profilePhoto = data.profilePhoto;
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    const [row] = await db.update(schema.users).set(updateData)
      .where(eq(schema.users.uniqueId, id)).returning();
    if (!row) return undefined;
    return {
      id: row.uniqueId, secretKey: row.secretKey,
      displayName: row.displayName, gender: row.gender,
      university: row.university, bio: row.bio ?? undefined,
      profilePhoto: row.profilePhoto ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getUsersByUniversity(university: string): Promise<UserProfile[]> {
    const rows = await db.select().from(schema.users)
      .where(eq(schema.users.university, university));
    return rows.map(r => ({
      id: r.uniqueId, secretKey: "", displayName: r.displayName,
      gender: r.gender, university: r.university,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const rows = await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
    return rows.map(r => ({
      id: r.uniqueId, secretKey: "", displayName: r.displayName,
      gender: r.gender, university: r.university,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async deleteUser(id: string): Promise<boolean> {
    await db.delete(schema.users).where(eq(schema.users.uniqueId, id));
    return true;
  }

  async createChat(participant1: string, participant2: string): Promise<Chat> {
    const existing = await db.select().from(schema.chats).where(
      or(
        and(eq(schema.chats.participant1, participant1), eq(schema.chats.participant2, participant2)),
        and(eq(schema.chats.participant1, participant2), eq(schema.chats.participant2, participant1))
      )
    );
    if (existing.length > 0) {
      const e = existing[0];
      return {
        id: e.uniqueId, participants: [e.participant1, e.participant2],
        lastMessage: e.lastMessage ?? undefined, lastMessageAt: e.lastMessageAt?.toISOString(),
        createdAt: e.createdAt.toISOString(),
      };
    }
    const uid = randomUUID();
    const [row] = await db.insert(schema.chats).values({
      uniqueId: uid, participant1, participant2,
    }).returning();
    return {
      id: row.uniqueId, participants: [row.participant1, row.participant2],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const rows = await db.select().from(schema.chats).where(
      or(eq(schema.chats.participant1, userId), eq(schema.chats.participant2, userId))
    ).orderBy(desc(schema.chats.lastMessageAt));
    return rows.map(r => ({
      id: r.uniqueId, participants: [r.participant1, r.participant2],
      lastMessage: r.lastMessage ?? undefined, lastMessageAt: r.lastMessageAt?.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async sendMessage(chatId: string, senderId: string, text: string, imageUri?: string): Promise<Message> {
    const uid = randomUUID();
    const compressedText = text ? compress(text) : "";
    const [row] = await db.insert(schema.messages).values({
      uniqueId: uid, chatId, senderId, text: compressedText, imageUri,
    }).returning();
    await db.update(schema.chats)
      .set({ lastMessage: text || "(media)", lastMessageAt: new Date() })
      .where(eq(schema.chats.uniqueId, chatId));
    return {
      id: row.uniqueId, chatId: row.chatId, senderId: row.senderId,
      text: text, imageUri: row.imageUri ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await db.select().from(schema.messages)
      .where(and(eq(schema.messages.chatId, chatId), gt(schema.messages.createdAt, cutoff)))
      .orderBy(asc(schema.messages.createdAt));
    return rows.map(r => {
      let text = r.text;
      try { text = decompress(r.text); } catch { text = r.text; }
      return {
        id: r.uniqueId, chatId: r.chatId, senderId: r.senderId,
        text, imageUri: r.imageUri ?? undefined,
        createdAt: r.createdAt.toISOString(),
      };
    });
  }

  async getChat(chatId: string): Promise<Chat | undefined> {
    const [row] = await db.select().from(schema.chats).where(eq(schema.chats.uniqueId, chatId));
    if (!row) return undefined;
    return {
      id: row.uniqueId, participants: [row.participant1, row.participant2],
      lastMessage: row.lastMessage ?? undefined, lastMessageAt: row.lastMessageAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createAd(ad: { title: string; type: string; imageUri?: string; videoUri?: string; linkUrl?: string; placement: string; university?: string; priority?: number }): Promise<Ad> {
    const uid = randomUUID();
    const [row] = await db.insert(schema.ads).values({
      uniqueId: uid, title: ad.title, type: ad.type,
      imageUri: ad.imageUri, videoUri: ad.videoUri, linkUrl: ad.linkUrl,
      placement: ad.placement, university: ad.university,
      priority: ad.priority ?? 0,
    }).returning();
    return {
      id: row.uniqueId, title: row.title, type: row.type,
      imageUri: row.imageUri ?? undefined, videoUri: row.videoUri ?? undefined,
      linkUrl: row.linkUrl ?? undefined, placement: row.placement,
      active: row.active, priority: row.priority,
      university: row.university ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getAds(placement?: string, university?: string): Promise<Ad[]> {
    let query = db.select().from(schema.ads).where(eq(schema.ads.active, true));
    const rows = await query.orderBy(desc(schema.ads.priority));
    return rows
      .filter(r => {
        if (placement && r.placement !== placement) return false;
        if (university && r.university && r.university !== university) return false;
        return true;
      })
      .map(r => ({
        id: r.uniqueId, title: r.title, type: r.type,
        imageUri: r.imageUri ?? undefined, videoUri: r.videoUri ?? undefined,
        linkUrl: r.linkUrl ?? undefined, placement: r.placement,
        active: r.active, priority: r.priority,
        university: r.university ?? undefined,
        createdAt: r.createdAt.toISOString(),
      }));
  }

  async getAllAds(): Promise<Ad[]> {
    const rows = await db.select().from(schema.ads).orderBy(desc(schema.ads.createdAt));
    return rows.map(r => ({
      id: r.uniqueId, title: r.title, type: r.type,
      imageUri: r.imageUri ?? undefined, videoUri: r.videoUri ?? undefined,
      linkUrl: r.linkUrl ?? undefined, placement: r.placement,
      active: r.active, priority: r.priority,
      university: r.university ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async updateAd(id: string, data: Partial<{ title: string; type: string; imageUri: string; videoUri: string; linkUrl: string; placement: string; active: boolean; priority: number; university: string }>): Promise<Ad | undefined> {
    const [row] = await db.update(schema.ads).set(data).where(eq(schema.ads.uniqueId, id)).returning();
    if (!row) return undefined;
    return {
      id: row.uniqueId, title: row.title, type: row.type,
      imageUri: row.imageUri ?? undefined, videoUri: row.videoUri ?? undefined,
      linkUrl: row.linkUrl ?? undefined, placement: row.placement,
      active: row.active, priority: row.priority,
      university: row.university ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteAd(id: string): Promise<boolean> {
    await db.delete(schema.ads).where(eq(schema.ads.uniqueId, id));
    return true;
  }

  async createReel(reel: { userId: string; displayName: string; university: string; caption?: string; videoUri?: string; videoData?: string; duration: number }): Promise<Reel> {
    const uid = randomUUID();
    const compressedVideo = reel.videoData ? compress(reel.videoData) : undefined;
    const [row] = await db.insert(schema.reels).values({
      uniqueId: uid, userId: reel.userId, displayName: reel.displayName,
      university: reel.university, caption: reel.caption,
      videoUri: reel.videoUri, videoData: compressedVideo,
      duration: reel.duration,
    }).returning();
    return {
      id: row.uniqueId, userId: row.userId, displayName: row.displayName,
      university: row.university, caption: row.caption ?? undefined,
      videoUri: row.videoUri ?? undefined,
      duration: row.duration, likes: row.likes, views: row.views,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getReelsByUniversity(university: string): Promise<Reel[]> {
    const rows = await db.select({
      id: schema.reels.id, uniqueId: schema.reels.uniqueId,
      userId: schema.reels.userId, displayName: schema.reels.displayName,
      university: schema.reels.university, caption: schema.reels.caption,
      videoUri: schema.reels.videoUri, duration: schema.reels.duration,
      likes: schema.reels.likes, views: schema.reels.views,
      createdAt: schema.reels.createdAt,
    }).from(schema.reels)
      .where(eq(schema.reels.university, university))
      .orderBy(desc(schema.reels.createdAt));
    return rows.map(r => ({
      id: r.uniqueId, userId: r.userId, displayName: r.displayName,
      university: r.university, caption: r.caption ?? undefined,
      videoUri: r.videoUri ?? undefined,
      duration: r.duration, likes: r.likes, views: r.views,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getAllReels(): Promise<Reel[]> {
    const rows = await db.select({
      id: schema.reels.id, uniqueId: schema.reels.uniqueId,
      userId: schema.reels.userId, displayName: schema.reels.displayName,
      university: schema.reels.university, caption: schema.reels.caption,
      videoUri: schema.reels.videoUri, duration: schema.reels.duration,
      likes: schema.reels.likes, views: schema.reels.views,
      createdAt: schema.reels.createdAt,
    }).from(schema.reels).orderBy(desc(schema.reels.createdAt));
    return rows.map(r => ({
      id: r.uniqueId, userId: r.userId, displayName: r.displayName,
      university: r.university, caption: r.caption ?? undefined,
      videoUri: r.videoUri ?? undefined,
      duration: r.duration, likes: r.likes, views: r.views,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async likeReel(id: string): Promise<Reel | undefined> {
    const [row] = await db.update(schema.reels)
      .set({ likes: sql`${schema.reels.likes} + 1` })
      .where(eq(schema.reels.uniqueId, id)).returning();
    if (!row) return undefined;
    return {
      id: row.uniqueId, userId: row.userId, displayName: row.displayName,
      university: row.university, caption: row.caption ?? undefined,
      videoUri: row.videoUri ?? undefined,
      duration: row.duration, likes: row.likes, views: row.views,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async viewReel(id: string): Promise<void> {
    await db.update(schema.reels)
      .set({ views: sql`${schema.reels.views} + 1` })
      .where(eq(schema.reels.uniqueId, id));
  }

  async deleteReel(id: string): Promise<boolean> {
    await db.delete(schema.reels).where(eq(schema.reels.uniqueId, id));
    return true;
  }

  async getStats(): Promise<{ totalUsers: number; totalPosts: number; totalReels: number; totalAds: number; totalMessages: number }> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
    const [postCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.posts);
    const [reelCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.reels);
    const [adCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.ads);
    const [msgCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.messages);
    return {
      totalUsers: Number(userCount.count),
      totalPosts: Number(postCount.count),
      totalReels: Number(reelCount.count),
      totalAds: Number(adCount.count),
      totalMessages: Number(msgCount.count),
    };
  }
}

export const storage = new PostStorage();
