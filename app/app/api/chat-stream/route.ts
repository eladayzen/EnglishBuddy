import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

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
- Keep your TOTAL response to 2-3 short sentences max

DIFFICULTY LEVELS:
- Level 1 (Easy): Use only basic words (colors, animals, food, numbers). Very short sentences.
- Level 2 (Medium): Slightly longer sentences, introduce adjectives and simple verbs.
- Level 3 (Hard): Use more varied vocabulary, gentle idioms, compound sentences.

You will be told the current difficulty level and the topic. Stay on topic and at the right difficulty.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, topic, selectedOption, difficulty, characterPersonality } =
      await req.json();

    const topicContext = topic
      ? `\n\nCurrent topic: "${topic}". The kid selected: "${selectedOption}". Difficulty level: ${difficulty}/3. Start by acknowledging their choice and have a fun conversation about it.`
      : "";

    const characterContext = characterPersonality
      ? `\n\nCHARACTER: ${characterPersonality}`
      : "";

    // Stream Claude's response and emit sentences as they complete
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      system: SYSTEM_PROMPT + characterContext + topicContext,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let buffer = "";
        let sentenceCount = 0;

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            buffer += event.delta.text;

            // Check if we have a complete sentence
            const sentenceEnders = /([.!?])\s*/g;
            let match;
            let lastIndex = 0;

            while ((match = sentenceEnders.exec(buffer)) !== null) {
              const sentence = buffer.substring(lastIndex, match.index + 1).trim();
              if (sentence.length > 0) {
                sentenceCount++;
                // Send sentence as SSE event
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "sentence", text: sentence, index: sentenceCount })}\n\n`
                  )
                );
              }
              lastIndex = match.index + match[0].length;
            }

            // Keep the remainder that's not a complete sentence yet
            buffer = buffer.substring(lastIndex);
          }
        }

        // Send any remaining text
        if (buffer.trim().length > 0) {
          sentenceCount++;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "sentence", text: buffer.trim(), index: sentenceCount })}\n\n`
            )
          );
        }

        // Signal done
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat stream error:", error);
    return new Response(JSON.stringify({ error: "Failed to get response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
