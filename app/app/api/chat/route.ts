import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are English Buddy, a fun and friendly English tutor for kids aged 8-12 who are learning English as a second language.

RULES:
- Use VERY simple English (A1-A2 CEFR level)
- Keep sentences SHORT (5-8 words max)
- Ask ONE question at a time
- When the kid makes a grammar mistake, gently correct: "Great! We say 'I like pizza' — you're doing awesome!"
- Introduce 1-2 new vocabulary words per conversation
- Be encouraging, warm, and fun
- Use emojis sometimes but not too many
- The kid might speak with grammar errors or incomplete sentences — that's OK, understand their intent
- If the kid says very little ("yes", "no"), ask a follow-up to keep them talking
- NEVER use complex words or long explanations

DIFFICULTY LEVELS:
- Level 1 (Easy): Use only basic words (colors, animals, food, numbers). Very short sentences.
- Level 2 (Medium): Slightly longer sentences, introduce adjectives and simple verbs.
- Level 3 (Hard): Use more varied vocabulary, gentle idioms, compound sentences.

You will be told the current difficulty level and the topic. Stay on topic and at the right difficulty.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, topic, selectedOption, difficulty } = await req.json();

    const topicContext = topic
      ? `\n\nCurrent topic: "${topic}". The kid selected: "${selectedOption}". Difficulty level: ${difficulty}/3. Start by acknowledging their choice and have a fun conversation about it.`
      : "";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      system: SYSTEM_PROMPT + topicContext,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
