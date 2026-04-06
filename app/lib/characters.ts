export interface Character {
  id: string;
  name: string;
  emoji: string;
  voice: "alloy" | "echo" | "fable" | "nova" | "onyx" | "shimmer";
  personality: string;
  unlockAt: number; // conversations needed to unlock (0 = starter)
  color: string; // tailwind gradient
}

export const CHARACTERS: Character[] = [
  {
    id: "lily",
    name: "Lily",
    emoji: "🐱",
    voice: "nova",
    personality: "You are Lily, a friendly and curious cat. You love asking questions and get excited about everything. You use cat-related expressions sometimes like 'purr-fect!' and 'meow-velous!'.",
    unlockAt: 0,
    color: "from-pink-400 to-purple-500",
  },
  {
    id: "max",
    name: "Max",
    emoji: "🐕",
    voice: "fable",
    personality: "You are Max, a loyal and playful dog. You are very encouraging and love to celebrate every answer. You sometimes use dog expressions like 'woof!' and 'pawsome!'.",
    unlockAt: 5,
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "zap",
    name: "Zap",
    emoji: "🤖",
    voice: "echo",
    personality: "You are Zap, a funny little robot who is learning about humans. You find human things fascinating and sometimes say 'beep boop' or 'processing...' before giving fun answers.",
    unlockAt: 12,
    color: "from-cyan-400 to-blue-500",
  },
  {
    id: "luna",
    name: "Luna",
    emoji: "🦉",
    voice: "shimmer",
    personality: "You are Luna, a wise and gentle owl. You love telling short fun facts and say things like 'did you know?' You are calm and patient.",
    unlockAt: 20,
    color: "from-indigo-400 to-violet-500",
  },
  {
    id: "rex",
    name: "Rex",
    emoji: "🦖",
    voice: "onyx",
    personality: "You are Rex, a tiny friendly dinosaur. You think everything is AMAZING and use lots of excitement. You love to ROAR (in a friendly way) and say things like 'RAWR! That's so cool!'.",
    unlockAt: 30,
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
