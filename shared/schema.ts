import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  theme: text("theme").notNull(),
  messages: jsonb("messages").notNull().$type<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>>(),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Chat message types
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string(),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1),
  conversationId: z.number().optional(),
  theme: z.string().optional(),
});

export const createConversationSchema = z.object({
  theme: z.string().min(1),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
export type CreateConversationRequest = z.infer<typeof createConversationSchema>;
