import { fetch } from "expo/fetch";
import { getApiUrl } from "./query-client";
import type { Post, Comment, CreatePostInput, VoteInput, UserProfile, Chat, Message, Ad, Reel } from "../shared/schema";

const baseUrl = () => getApiUrl();

export async function fetchPosts(university: string): Promise<Post[]> {
  const url = new URL(`/api/posts?university=${university}`, baseUrl());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const url = new URL("/api/posts", baseUrl());
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}

export async function voteOnPost(id: string, input: VoteInput): Promise<Post> {
  const url = new URL(`/api/posts/${id}/vote`, baseUrl());
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to vote");
  return res.json();
}

export async function reportPost(id: string): Promise<void> {
  const url = new URL(`/api/posts/${id}/report`, baseUrl());
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to report post");
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const url = new URL(`/api/posts/${postId}/comments`, baseUrl());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export async function createComment(postId: string, text: string, displayName: string): Promise<Comment> {
  const url = new URL(`/api/posts/${postId}/comments`, baseUrl());
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, displayName }),
  });
  if (!res.ok) throw new Error("Failed to create comment");
  return res.json();
}

export async function registerUser(displayName: string, gender: string, university: string): Promise<UserProfile> {
  const url = new URL("/api/users/register", baseUrl());
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName, gender, university }),
  });
  if (!res.ok) throw new Error("Failed to register user");
  return res.json();
}

export async function loginUser(secretKey: string): Promise<UserProfile> {
  const url = new URL("/api/users/login", baseUrl());
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secretKey }),
  });
  if (!res.ok) throw new Error("Invalid secret key");
  return res.json();
}

export async function fetchUserChats(userId: string): Promise<Chat[]> {
  const url = new URL(`/api/chats/user/${userId}`, baseUrl());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch chats");
  return res.json();
}

export async function createChat(participant1: string, participant2: string): Promise<Chat> {
  const url = new URL("/api/chats", baseUrl());
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant1, participant2 }),
  });
  if (!res.ok) throw new Error("Failed to create chat");
  return res.json();
}

export async function fetchChatMessages(chatId: string): Promise<Message[]> {
  const url = new URL(`/api/chats/${chatId}/messages`, baseUrl());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function sendMessage(chatId: string, senderId: string, text: string, imageUri?: string): Promise<Message> {
  const url = new URL(`/api/chats/${chatId}/messages`, baseUrl());
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId, text, imageUri }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function updateUserProfile(userId: string, data: { bio?: string; profilePhoto?: string; displayName?: string }): Promise<UserProfile> {
  const url = new URL(`/api/users/${userId}`, baseUrl());
  const res = await fetch(url.toString(), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function fetchUsersInUniversity(university: string): Promise<UserProfile[]> {
  const url = new URL(`/api/users/university/${university}`, baseUrl());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchAds(placement?: string, university?: string): Promise<Ad[]> {
  let query = "/api/ads?";
  if (placement) query += `placement=${placement}&`;
  if (university) query += `university=${university}&`;
  const url = new URL(query, baseUrl());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch ads");
  return res.json();
}

export async function fetchReels(university: string): Promise<Reel[]> {
  const url = new URL(`/api/reels?university=${university}`, baseUrl());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch reels");
  return res.json();
}

export async function createReel(data: { userId: string; displayName: string; university: string; caption?: string; videoUri?: string; duration: number }): Promise<Reel> {
  const url = new URL("/api/reels", baseUrl());
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create reel");
  return res.json();
}

export async function likeReel(id: string): Promise<Reel> {
  const url = new URL(`/api/reels/${id}/like`, baseUrl());
  const res = await fetch(url.toString(), { method: "POST" });
  if (!res.ok) throw new Error("Failed to like reel");
  return res.json();
}

export async function viewReel(id: string): Promise<void> {
  const url = new URL(`/api/reels/${id}/view`, baseUrl());
  await fetch(url.toString(), { method: "POST" });
}
