export interface Character {
  id: string;
  name: string;
  emoji: string;
  voice: "alloy" | "echo" | "fable" | "nova" | "onyx" | "shimmer";
  personality: string;
  unlockAt: number; // messages sent needed to unlock (0 = starter)
  color: string; // tailwind gradient
}

export const CHARACTERS: Character[] = [
  {
    id: "mia",
    name: "Mia",
    emoji: "👩‍🦰",
    voice: "nova",
    personality: "You are Mia, a friendly and curious teenager. You love asking questions and are genuinely interested in what the kid has to say. You're warm, encouraging, and speak naturally.",
    unlockAt: 0,
    color: "from-pink-400 to-purple-500",
  },
  {
    id: "jake",
    name: "Jake",
    emoji: "👦",
    voice: "fable",
    personality: "You are Jake, an upbeat and sporty teenager. You're super encouraging and love to celebrate every answer. You're like a supportive older brother.",
    unlockAt: 20,
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "sam",
    name: "Sam",
    emoji: "🧑‍🎤",
    voice: "echo",
    personality: "You are Sam, a creative and fun teenager who loves music and art. You find everything interesting and like to make learning feel like a game. You're relaxed and cool.",
    unlockAt: 50,
    color: "from-cyan-400 to-blue-500",
  },
  {
    id: "nina",
    name: "Nina",
    emoji: "👩‍🎓",
    voice: "shimmer",
    personality: "You are Nina, a smart and kind teenager. You love sharing fun facts and saying things like 'did you know?' You're patient and always make the kid feel confident.",
    unlockAt: 100,
    color: "from-indigo-400 to-violet-500",
  },
  {
    id: "leo",
    name: "Leo",
    emoji: "🧑‍🚀",
    voice: "onyx",
    personality: "You are Leo, an adventurous and energetic teenager who dreams of exploring the world. You think everything is amazing and get excited easily. You're like a fun older friend.",
    unlockAt: 150,
    color: "from-green-400 to-emerald-500",
  },
];

export function getUnlockedCharacters(conversationCount: number): Character[] {
  return CHARACTERS.filter((c) => c.unlockAt <= conversationCount);
}

export function getNextUnlock(conversationCount: number): Character | null {
  const next = CHARACTERS.find((c) => c.unlockAt > conversationCount);
  return next || null;
}

export function getProgressToNext(conversationCount: number): {
  current: number;
  needed: number;
  percent: number;
} {
  const next = getNextUnlock(conversationCount);
  if (!next) return { current: conversationCount, needed: conversationCount, percent: 100 };

  const prev = [...CHARACTERS]
    .reverse()
    .find((c) => c.unlockAt <= conversationCount);
  const start = prev ? prev.unlockAt : 0;
  const range = next.unlockAt - start;
  const progress = conversationCount - start;

  return {
    current: progress,
    needed: range,
    percent: Math.min(100, Math.round((progress / range) * 100)),
  };
}
