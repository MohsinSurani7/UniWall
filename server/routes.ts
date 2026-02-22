import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "UniWall@Admin2026";

function requireAdmin(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  await storage.seedData();

  app.get("/api/posts", async (req, res) => {
    const university = req.query.university as string;
    if (!university) return res.status(400).json({ message: "University parameter required" });
    const posts = await storage.getPostsByUniversity(university);
    res.json(posts);
  });

  app.post("/api/posts", async (req, res) => {
    const { text, university, identityTag, displayName, imageUri, userId } = req.body;
    if (!text || !university || !identityTag) return res.status(400).json({ message: "Missing required fields" });
    if (text.length > 300) return res.status(400).json({ message: "Post exceeds 300 character limit" });
    const post = await storage.createPost({ text, university, identityTag, displayName: displayName || "Anonymous", imageUri, userId });
    res.status(201).json(post);
  });

  app.post("/api/posts/:id/vote", async (req, res) => {
    const { type } = req.body;
    if (type !== "upvote" && type !== "downvote") return res.status(400).json({ message: "Invalid vote type" });
    const post = await storage.votePost(req.params.id, type);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.post("/api/posts/:id/report", async (req, res) => {
    const post = await storage.reportPost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post reported successfully" });
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    const comments = await storage.getComments(req.params.id);
    res.json(comments);
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    const { text, displayName } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text required" });
    const comment = await storage.createComment({ postId: req.params.id, text, displayName: displayName || "Anonymous" });
    res.status(201).json(comment);
  });

  app.post("/api/users/register", async (req, res) => {
    const { displayName, gender, university } = req.body;
    if (!university) return res.status(400).json({ message: "University required" });
    const user = await storage.registerUser({ displayName: displayName || "Anonymous", gender: gender || "other", university });
    res.status(201).json(user);
  });

  app.post("/api/users/login", async (req, res) => {
    const { secretKey } = req.body;
    if (!secretKey) return res.status(400).json({ message: "Secret key required" });
    const user = await storage.loginUser(secretKey);
    if (!user) return res.status(401).json({ message: "Invalid secret key. No account recovery available." });
    res.json(user);
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ ...user, secretKey: undefined });
  });

  app.put("/api/users/:id", async (req, res) => {
    const { bio, profilePhoto, displayName } = req.body;
    const user = await storage.updateUserProfile(req.params.id, { bio, profilePhoto, displayName });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ ...user, secretKey: undefined });
  });

  app.get("/api/users/university/:university", async (req, res) => {
    const users = await storage.getUsersByUniversity(req.params.university);
    res.json(users);
  });

  app.post("/api/chats", async (req, res) => {
    const { participant1, participant2 } = req.body;
    if (!participant1 || !participant2) return res.status(400).json({ message: "Both participants required" });
    const chat = await storage.createChat(participant1, participant2);
    res.status(201).json(chat);
  });

  app.get("/api/chats/user/:userId", async (req, res) => {
    const chats = await storage.getUserChats(req.params.userId);
    res.json(chats);
  });

  app.get("/api/chats/:chatId/messages", async (req, res) => {
    const messages = await storage.getChatMessages(req.params.chatId);
    res.json(messages);
  });

  app.post("/api/chats/:chatId/messages", async (req, res) => {
    const { senderId, text, imageUri } = req.body;
    if (!senderId) return res.status(400).json({ message: "Sender ID required" });
    const message = await storage.sendMessage(req.params.chatId, senderId, text || "", imageUri);
    res.status(201).json(message);
  });

  app.get("/api/chats/:chatId", async (req, res) => {
    const chat = await storage.getChat(req.params.chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  });

  app.get("/api/ads", async (req, res) => {
    const placement = req.query.placement as string | undefined;
    const university = req.query.university as string | undefined;
    const ads = await storage.getAds(placement, university);
    res.json(ads);
  });

  app.get("/api/reels", async (req, res) => {
    const university = req.query.university as string;
    if (!university) return res.status(400).json({ message: "University required" });
    const reels = await storage.getReelsByUniversity(university);
    res.json(reels);
  });

  app.post("/api/reels", async (req, res) => {
    const { userId, displayName, university, caption, videoUri, videoData, duration } = req.body;
    if (!userId || !university) return res.status(400).json({ message: "Missing required fields" });
    if (duration > 180) return res.status(400).json({ message: "Reel cannot exceed 3 minutes" });
    const reel = await storage.createReel({ userId, displayName: displayName || "Anonymous", university, caption, videoUri, videoData, duration: duration || 0 });
    res.status(201).json(reel);
  });

  app.post("/api/reels/:id/like", async (req, res) => {
    const reel = await storage.likeReel(req.params.id);
    if (!reel) return res.status(404).json({ message: "Reel not found" });
    res.json(reel);
  });

  app.post("/api/reels/:id/view", async (req, res) => {
    await storage.viewReel(req.params.id);
    res.json({ success: true });
  });

  // ===== ADMIN ROUTES =====
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ message: "Invalid admin password" });
    res.json({ token: ADMIN_PASSWORD, message: "Admin authenticated" });
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  app.get("/api/admin/posts", requireAdmin, async (_req, res) => {
    const posts = await storage.getAllPosts();
    res.json(posts);
  });

  app.delete("/api/admin/posts/:id", requireAdmin, async (req, res) => {
    await storage.deletePost(req.params.id);
    res.json({ message: "Post deleted" });
  });

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    await storage.deleteUser(req.params.id);
    res.json({ message: "User deleted" });
  });

  app.get("/api/admin/ads", requireAdmin, async (_req, res) => {
    const ads = await storage.getAllAds();
    res.json(ads);
  });

  app.post("/api/admin/ads", requireAdmin, async (req, res) => {
    const ad = await storage.createAd(req.body);
    res.status(201).json(ad);
  });

  app.put("/api/admin/ads/:id", requireAdmin, async (req, res) => {
    const ad = await storage.updateAd(req.params.id, req.body);
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    res.json(ad);
  });

  app.delete("/api/admin/ads/:id", requireAdmin, async (req, res) => {
    await storage.deleteAd(req.params.id);
    res.json({ message: "Ad deleted" });
  });

  app.get("/api/admin/reels", requireAdmin, async (_req, res) => {
    const reels = await storage.getAllReels();
    res.json(reels);
  });

  app.delete("/api/admin/reels/:id", requireAdmin, async (req, res) => {
    await storage.deleteReel(req.params.id);
    res.json({ message: "Reel deleted" });
  });

  app.get("/uw-ctrl-x7k9", (_req, res) => {
    const adminPath = path.join(process.cwd(), "server", "admin.html");
    if (fs.existsSync(adminPath)) {
      res.sendFile(adminPath);
    } else {
      res.status(404).send("Not found");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
