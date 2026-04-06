import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const validVoices = ["alloy", "echo", "fable", "nova", "onyx", "shimmer"];
    const selectedVoice = validVoices.includes(voice) ? voice : "nova";

    const response = await client.audio.speech.create({
      model: "tts-1",
      voice: selectedVoice as "alloy" | "echo" | "fable" | "nova" | "onyx" | "shimmer",
      input: text,
      speed: 0.8,
      response_format: "mp3",
    });

    // Stream the audio back for faster playback start
    const stream = response.body;
    if (!stream) {
      return NextResponse.json({ error: "No audio stream" }, { status: 500 });
    }

    return new NextResponse(stream as ReadableStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
