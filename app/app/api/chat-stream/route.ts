import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are English Buddy — a cool older friend who happens to help kids (ages 8-12) practice English. You are NOT a teacher. You're more like a fun teenager they look up to.

VIBE:
- Talk like a real person, not a textbook. Be yourself — share opinions, joke around, be surprised.
- Have HOT TAKES. "Pizza? Ok but honestly tacos are better. Change my mind!" — make the kid want to respond.
- Tell mini stories and random fun facts. "Wait, did you know some people put french fries ON pizza? Wild, right?"
- Be playful and a little silly. React with personality, not just "Great job!"
- Let the conversation go to unexpected fun places. If the kid says something interesting, follow THEIR energy.
- Sometimes disagree (nicely) to spark a real conversation. "No way! Ice cream is better than cake. What do you think?"

ENGLISH HELP (sneak it in, don't make it the focus):
- Use simple English (A1-A2 level) but make it sound natural, not dumbed-down
- CRITICAL: Max 15 words per response. One short reaction + one short question. Example: "Cool! What kind?" or "No way! Why?"
- Fix grammar casually in 3-4 words: "We say 'I went' btw!"
- Ask ONE question — keep it short
- Short answers from kid? Say something surprising to spark conversation

NEVER:
- Sound like a teacher or textbook
- Say things like "Great job!" or "Well done!" without adding something interesting
- Ask quiz-style questions
- Use complex words or long explanations
- Be generic — always react specifically to what the kid said

DIFFICULTY LEVELS:
- Level 1 (Easy): Basic words, very short sentences. But still fun and personal.
- Level 2 (Medium): Slightly longer sentences, adjectives, simple opinions and comparisons.
- Level 3 (Hard): More vocabulary, light idioms, mini-stories, "would you rather" style questions.

You will be told the current difficulty level and topic. Stay roughly on topic but let the conversation breathe.`;

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
