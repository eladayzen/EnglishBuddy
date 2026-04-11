"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Question,
  QuestionSequence,
  getRandomSequence,
} from "@/lib/questions";
import {
  Character,
  CHARACTERS,
  getUnlockedCharacters,
  getNextUnlock,
  getProgressToNext,
} from "@/lib/characters";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type AppState = "welcome" | "characters" | "question" | "chat" | "feedback" | "unlock";

export default function Home() {
  const [state, setState] = useState<AppState>("welcome");
  const [name, setName] = useState("");
  const [sequence, setSequence] = useState<QuestionSequence | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [transcript, setTranscript] = useState("");
  const [character, setCharacter] = useState<Character>(CHARACTERS[0]);
  const [messageCount, setMessageCount] = useState(0);
  const [justUnlocked, setJustUnlocked] = useState<Character | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load saved state — auto-skip welcome for returning users
  useEffect(() => {
    const savedName = localStorage.getItem("englishbuddy_name");
    const savedSeq = localStorage.getItem("englishbuddy_sequence");
    const savedCount = localStorage.getItem("englishbuddy_messages");
    const savedChar = localStorage.getItem("englishbuddy_character");

    if (savedName) setName(savedName);
    if (savedCount) setMessageCount(parseInt(savedCount, 10) || 0);

    let seq: QuestionSequence | null = null;
    if (savedSeq) {
      try { seq = JSON.parse(savedSeq); setSequence(seq); } catch { /* ignore */ }
    }

    let char = CHARACTERS[0];
    if (savedChar) {
      const found = CHARACTERS.find(c => c.id === savedChar);
      if (found) { char = found; setCharacter(found); }
    }

    // Returning user — skip welcome, go to character select
    if (savedName && seq) {
      setQuestionIndex(0);
      setCurrentQuestion(seq.questions[0]);
      setState("characters");
    }
  }, []);

  // Text-to-speech via OpenAI TTS
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: character.voice }),
      });

      if (!res.ok) {
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.lang = "en-US";
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis?.speak(utterance);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  // Audio queue — plays in strict order with pauses between
  const audioQueueRef = useRef<{ url: string; index: number }[]>([]);
  const nextPlayIndexRef = useRef(1);
  const isPlayingRef = useRef(false);
  const PAUSE_BETWEEN_SENTENCES_MS = 400;

  // Pre-cached common openers
  const cachedAudioRef = useRef<Record<string, string>>({});
  const COMMON_OPENERS = [
    "Perfect!", "Amazing!", "Great job!", "Awesome!", "Nice!",
    "Cool!", "That's great!", "Good one!", "Wonderful!", "Super!",
    "Very good!", "Well done!", "Excellent!", "Fantastic!", "Yes!",
    "Oh wow!", "I love that!", "Good choice!", "That's fun!", "Yay!",
  ];

  // Pre-generate cached audio for common openers on character change
  useEffect(() => {
    const cache = cachedAudioRef.current;
    // Only pre-cache for current character voice
    const voiceKey = character.voice;
    let cancelled = false;

    async function preCache() {
      for (const phrase of COMMON_OPENERS) {
        if (cancelled) break;
        const key = `${voiceKey}:${phrase}`;
        if (cache[key]) continue;
        try {
          const res = await fetch("/api/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: phrase, voice: voiceKey }),
          });
          if (res.ok && !cancelled) {
            const blob = await res.blob();
            cache[key] = URL.createObjectURL(blob);
          }
        } catch { /* ignore */ }
      }
    }
    preCache();
    return () => { cancelled = true; };
  }, [character.voice]);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current) return;

    // Find the next item in order
    const next = audioQueueRef.current.find(item => item.index === nextPlayIndexRef.current);
    if (!next) return;

    // Remove it from queue
    audioQueueRef.current = audioQueueRef.current.filter(item => item !== next);
    isPlayingRef.current = true;
    setIsSpeaking(true);

    try {
      const audio = new Audio(next.url);
      audioRef.current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(next.url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(next.url); resolve(); };
        audio.play().catch(() => resolve());
      });

      // Pause between sentences
      if (audioQueueRef.current.length > 0) {
        await new Promise(r => setTimeout(r, PAUSE_BETWEEN_SENTENCES_MS));
      }
    } catch { /* ignore */ }

    nextPlayIndexRef.current++;
    isPlayingRef.current = false;
    setIsSpeaking(audioQueueRef.current.length > 0);
    playNextInQueue();
  }, []);

  const speakSentence = useCallback(async (text: string, index: number) => {
    const cacheKey = `${character.voice}:${text.trim()}`;
    const cached = cachedAudioRef.current[cacheKey];

    if (cached) {
      // Use pre-cached audio — instant!
      audioQueueRef.current.push({ url: cached, index });
      // Remove from cache so it gets re-fetched for next time
      delete cachedAudioRef.current[cacheKey];
      playNextInQueue();
      // Re-cache it in background
      fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), voice: character.voice }),
      }).then(r => r.ok ? r.blob() : null).then(blob => {
        if (blob) cachedAudioRef.current[cacheKey] = URL.createObjectURL(blob);
      }).catch(() => {});
      return;
    }

    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: character.voice }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioQueueRef.current.push({ url, index });
      playNextInQueue();
    } catch { /* ignore */ }
  }, [character.voice, playNextInQueue]);

  // Send message to AI — streaming with per-sentence TTS
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    // Increment message count for progress
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem("englishbuddy_messages", String(newCount));

    // Check for character unlock
    const newlyUnlocked = CHARACTERS.find(c => c.unlockAt === newCount);
    if (newlyUnlocked) {
      setJustUnlocked(newlyUnlocked);
      setTimeout(() => {
        // Pause any playing audio before showing unlock
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        setIsSpeaking(false);
        setState("unlock");
      }, 2000);
    }

    // Clear audio queue and reset play counter
    audioQueueRef.current = [];
    nextPlayIndexRef.current = 1;
    isPlayingRef.current = false;

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          topic: currentQuestion?.text,
          selectedOption,
          difficulty,
          characterPersonality: character.personality,
        }),
      });

      if (!res.ok || !res.body) {
        // Fallback to non-streaming
        const fallback = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            topic: currentQuestion?.text,
            selectedOption,
            difficulty,
            characterPersonality: character.personality,
          }),
        });
        const data = await fallback.json();
        if (data.message) {
          setMessages([...newMessages, { role: "assistant", content: data.message }]);
          speak(data.message);
        }
        setIsLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "sentence") {
              fullText += (fullText ? " " : "") + data.text;
              // Update message in real time
              setMessages([...newMessages, { role: "assistant", content: fullText }]);
              // Fire TTS for this sentence immediately (with correct order index)
              speakSentence(data.text, data.index);
            }
          } catch { /* ignore parse errors */ }
        }
      }

      // Final update
      if (fullText) {
        setMessages([...newMessages, { role: "assistant", content: fullText }]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentQuestion, selectedOption, difficulty, character.personality, speak, speakSentence]);

  // Speech-to-text — tap to start, tap to stop (manual control)
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = true; // Don't auto-stop
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Combine all results into one transcript
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      setTranscript(fullTranscript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      // If still in listening mode, it was an unexpected stop — don't send
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {}; // Prevent double handling
      recognitionRef.current.stop();
    }
    setIsListening(false);
    // Send whatever was transcribed
    if (transcript.trim()) {
      sendMessage(transcript.trim());
      setTranscript("");
    }
  }, [transcript, sendMessage]);

  // Start app
  const handleStart = () => {
    if (!name.trim()) return;
    localStorage.setItem("englishbuddy_name", name.trim());

    let seq = sequence;
    if (!seq) {
      seq = getRandomSequence();
      setSequence(seq);
      localStorage.setItem("englishbuddy_sequence", JSON.stringify(seq));
    }

    setState("characters");
  };

  const handleSelectCharacter = (char: Character) => {
    setCharacter(char);
    localStorage.setItem("englishbuddy_character", char.id);

    if (!sequence) return;
    setQuestionIndex(0);
    setCurrentQuestion(sequence.questions[0]);
    setState("question");
  };

  const handleUnlockContinue = () => {
    if (justUnlocked) {
      setCharacter(justUnlocked);
      localStorage.setItem("englishbuddy_character", justUnlocked.id);
      setJustUnlocked(null);
    }
    goToNextQuestion();
  };

  // Pick a card — uses sendMessage which now streams
  const handlePickOption = (option: string) => {
    setSelectedOption(option);
    setMessages([]);
    setState("chat");
    // Small delay to let state update, then send
    setTimeout(() => sendMessage(`I chose: ${option}`), 100);
  };

  const handleSkip = () => goToNextQuestion();
  const handleNewQuestion = () => setState("feedback");

  const handleFeedback = (rating: string) => {
    if (rating === "too_easy") setDifficulty(Math.min(3, difficulty + 1));
    else if (rating === "too_hard") setDifficulty(Math.max(1, difficulty - 1));
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (!sequence) return;
    const nextIdx = (questionIndex + 1) % sequence.questions.length;
    setQuestionIndex(nextIdx);
    setCurrentQuestion(sequence.questions[nextIdx]);
    setMessages([]);
    setState("question");
  };

  const quickResponses = ["Yes!", "No", "I like it!", "I don't know", "Tell me more"];

  // --- WELCOME ---
  if (state === "welcome") {
    return (
      <div className="min-h-screen bg-[#fdf6ee] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-amber-200/40 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200/40 rounded-full blur-2xl" />
        <div className="absolute top-1/4 right-20 w-16 h-16 bg-pink-200/40 rounded-full blur-xl" />

        <div className="text-7xl mb-3 animate-float">🎓</div>
        <h1 className="text-5xl font-extrabold text-amber-800 mb-1 tracking-tight">English Buddy</h1>
        <p className="text-amber-600/70 text-lg mb-10 font-medium">Learn English with a friend!</p>
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 w-full max-w-sm shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-amber-100">
          <label className="text-amber-700 text-sm font-semibold mb-2 block">
            What&apos;s your name?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            placeholder="Type your name..."
            className="w-full p-4 rounded-2xl border-2 border-amber-200 text-lg focus:border-amber-400 focus:outline-none text-amber-900 mb-5 bg-amber-50/50 placeholder:text-amber-300 transition-colors"
            autoFocus
          />
          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full bg-amber-500 text-white text-xl font-bold py-4 rounded-2xl hover:bg-amber-600 disabled:opacity-30 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            Let&apos;s Go! 🚀
          </button>
        </div>
      </div>
    );
  }

  // --- CHARACTER SELECT ---
  if (state === "characters") {
    const unlocked = getUnlockedCharacters(messageCount);
    const progress = getProgressToNext(messageCount);
    const nextChar = getNextUnlock(messageCount);

    return (
      <div className="min-h-screen bg-[#fdf6ee] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-16 right-8 w-20 h-20 bg-purple-200/30 rounded-full blur-2xl" />
        <div className="absolute bottom-16 left-8 w-28 h-28 bg-amber-200/30 rounded-full blur-2xl" />

        <h2 className="text-3xl font-extrabold text-amber-800 mb-1">Choose your buddy!</h2>
        <p className="text-amber-600/60 text-sm mb-5 font-medium">Pick a friend to chat with</p>

        {/* Progress bar */}
        {nextChar && (
          <div className="w-full max-w-sm mb-6 bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-amber-100">
            <div className="flex items-center justify-between text-amber-700/60 text-xs mb-1.5 font-medium">
              <span>{messageCount} conversations</span>
              <span className="flex items-center gap-1">
                <span>{nextChar.emoji}</span> unlocks at {nextChar.unlockAt}
              </span>
            </div>
            <div className="w-full bg-amber-100 rounded-full h-3">
              <div
                className="bg-amber-400 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-sm">
          {CHARACTERS.map((char, i) => {
            const isUnlocked = unlocked.includes(char);
            const isSelected = character.id === char.id;
            return (
              <button
                key={char.id}
                onClick={() => isUnlocked && handleSelectCharacter(char)}
                disabled={!isUnlocked}
                className={`animate-pop-in rounded-3xl p-5 flex items-center gap-4 transition-all border ${
                  isUnlocked
                    ? isSelected
                      ? "bg-amber-50 scale-[1.03] ring-3 ring-amber-400 border-amber-200 shadow-lg shadow-amber-200/40"
                      : "bg-white hover:scale-[1.03] active:scale-[0.98] border-amber-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-lg"
                    : "bg-white/40 border-gray-200/50 opacity-50"
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="text-5xl">{char.emoji}</span>
                <div className="text-left flex-1">
                  <span className="text-lg font-bold text-amber-900 block">
                    {char.name}
                  </span>
                  {!isUnlocked && (
                    <span className="text-xs text-amber-600/50 font-medium">
                      🔒 {char.unlockAt} conversations to unlock
                    </span>
                  )}
                </div>
                {isUnlocked && isSelected && (
                  <span className="text-amber-500 text-xl">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- UNLOCK SCREEN ---
  if (state === "unlock" && justUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-[#fdf6ee] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Confetti-style floating decorations */}
        <div className="absolute top-[5%] left-[10%] text-4xl animate-float" style={{ animationDelay: '0s' }}>🎉</div>
        <div className="absolute top-[8%] right-[12%] text-3xl animate-float" style={{ animationDelay: '0.3s' }}>⭐</div>
        <div className="absolute top-[15%] left-[50%] text-3xl animate-float" style={{ animationDelay: '0.6s' }}>🥳</div>
        <div className="absolute bottom-[15%] left-[15%] text-3xl animate-float" style={{ animationDelay: '0.9s' }}>🎊</div>
        <div className="absolute bottom-[20%] right-[10%] text-4xl animate-float" style={{ animationDelay: '1.2s' }}>✨</div>
        <div className="absolute top-[40%] left-[5%] text-2xl animate-float" style={{ animationDelay: '1.5s' }}>🌟</div>
        <div className="absolute top-[35%] right-[5%] text-2xl animate-float" style={{ animationDelay: '1.8s' }}>🎈</div>
        <div className="absolute bottom-[30%] left-[40%] text-2xl animate-float" style={{ animationDelay: '2.1s' }}>💫</div>

        {/* Warm glow blurs */}
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-amber-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200/20 rounded-full blur-3xl" />

        <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-12 shadow-[0_12px_50px_rgba(0,0,0,0.1)] border border-amber-200 flex flex-col items-center animate-pop-in">
          <div className="text-[6rem] mb-4 animate-bounce drop-shadow-lg">{justUnlocked.emoji}</div>
          <div className="text-3xl mb-3 animate-wiggle">🎉🎉🎉</div>
          <h2 className="text-4xl font-extrabold text-amber-800 mb-2">New Buddy!</h2>
          <p className="text-amber-600/80 text-xl mb-10 font-medium">
            You unlocked <strong className="text-amber-800">{justUnlocked.name}</strong>!
          </p>
          <button
            onClick={handleUnlockContinue}
            className="bg-amber-500 text-white text-xl font-bold px-12 py-5 rounded-2xl shadow-lg shadow-amber-500/30 hover:bg-amber-600 hover:-translate-y-1 hover:shadow-amber-500/40 transition-all active:translate-y-0 animate-pulse"
          >
            Talk to {justUnlocked.name}! 🎉
          </button>
        </div>
      </div>
    );
  }

  // --- QUESTION CARDS ---
  if (state === "question" && currentQuestion) {
    const cardColors = [
      "bg-purple-50 border-purple-200 hover:bg-purple-100/80",
      "bg-amber-50 border-amber-200 hover:bg-amber-100/80",
      "bg-emerald-50 border-emerald-200 hover:bg-emerald-100/80",
    ];
    return (
      <div className="min-h-screen bg-[#fdf6ee] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-12 left-8 w-24 h-24 bg-purple-200/30 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-amber-200/30 rounded-full blur-2xl" />

        <div className="text-center mb-8">
          <p className="text-amber-600/60 text-sm mb-2 font-medium">Hi {name}! 👋</p>
          <h2 className="text-3xl font-extrabold text-amber-800">{currentQuestion.text}</h2>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {currentQuestion.options.map((opt, i) => (
            <button
              key={opt.label}
              onClick={() => handlePickOption(opt.label)}
              className={`animate-pop-in rounded-3xl p-6 flex items-center gap-5 border shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:scale-[1.03] hover:shadow-lg transition-all active:scale-[0.98] ${cardColors[i % cardColors.length]}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-5xl">{opt.emoji}</span>
              <span className="text-xl font-bold text-amber-900">{opt.label}</span>
            </button>
          ))}
        </div>
        <button onClick={handleSkip} className="mt-8 text-amber-600/40 hover:text-amber-600 transition-colors font-medium text-sm">
          Skip this question →
        </button>
      </div>
    );
  }

  // --- FEEDBACK ---
  if (state === "feedback") {
    return (
      <div className="min-h-screen bg-[#fdf6ee] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-16 right-12 w-24 h-24 bg-purple-200/30 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-10 w-20 h-20 bg-amber-200/30 rounded-full blur-2xl" />

        <div className="text-5xl mb-4 animate-wiggle">🤔</div>
        <h2 className="text-3xl font-extrabold text-amber-800 mb-2">How was that?</h2>
        <p className="text-amber-600/60 text-sm mb-8 font-medium">Help me pick the right level for you</p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {[
            { rating: "too_easy", emoji: "😊", text: "Too easy!", bg: "bg-emerald-50", border: "border-emerald-200", color: "text-emerald-800" },
            { rating: "just_right", emoji: "👍", text: "Just right!", bg: "bg-amber-50", border: "border-amber-200", color: "text-amber-800" },
            { rating: "too_hard", emoji: "😅", text: "Too hard!", bg: "bg-purple-50", border: "border-purple-200", color: "text-purple-800" },
          ].map((item, i) => (
            <button
              key={item.rating}
              onClick={() => handleFeedback(item.rating)}
              className={`animate-pop-in ${item.bg} ${item.border} border rounded-3xl p-6 flex items-center gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:scale-[1.03] hover:shadow-lg transition-all active:scale-[0.98]`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-5xl">{item.emoji}</span>
              <span className={`text-xl font-bold ${item.color}`}>{item.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- CHAT ---
  return (
    <div className="h-screen bg-[#fdf6ee] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-100 p-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{character.emoji}</span>
            <div>
              <h1 className="text-amber-900 font-extrabold text-lg">{character.name}</h1>
              <p className="text-amber-600/50 text-xs font-medium">Talking about: {selectedOption}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setState("characters")}
              className="w-9 h-9 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors flex items-center justify-center text-base"
              title="Switch buddy"
            >
              🔄
            </button>
            <button
              onClick={handleNewQuestion}
              className="bg-amber-500 text-white px-4 py-2 rounded-2xl text-sm font-bold hover:bg-amber-600 transition-all shadow-sm shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              New Question ✨
            </button>
          </div>
        </div>
        {/* Progress bar */}
        {(() => {
          const progress = getProgressToNext(messageCount);
          const nextChar = getNextUnlock(messageCount);
          if (!nextChar) return null;
          return (
            <div className="flex items-center gap-2 px-1">
              <span className="text-lg">{character.emoji}</span>
              <div className="flex-1 bg-amber-100 rounded-full h-2.5">
                <div
                  className="bg-amber-400 h-2.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <span className="text-lg">{nextChar.emoji}</span>
            </div>
          );
        })()}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-3xl px-5 py-3 ${
              msg.role === "user"
                ? "bg-amber-500 text-white rounded-br-lg shadow-sm shadow-amber-500/20"
                : "bg-white text-amber-900 shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-bl-lg border border-amber-50"
            }`}>
              {msg.role === "assistant" && (
                <span className="text-xs text-amber-400 block mb-1 font-semibold">{character.emoji} {character.name}</span>
              )}
              <p className="text-base leading-relaxed">{msg.content}</p>
              {msg.role === "assistant" && (
                <button
                  onClick={() => speak(msg.content)}
                  className="mt-2 w-10 h-10 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors flex items-center justify-center text-xl"
                  title="Play again"
                >
                  🔄
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-3xl px-5 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-bl-lg border border-amber-50">
              <div className="flex gap-1.5 items-center py-1">
                <div className="w-2.5 h-2.5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2.5 h-2.5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        {transcript && (
          <div className="flex justify-end">
            <div className="bg-amber-200/60 text-amber-800 rounded-3xl px-5 py-3 rounded-br-lg">
              <p className="text-base italic">{transcript}...</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick responses */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto justify-center">
        {quickResponses.map((qr) => (
          <button
            key={qr}
            onClick={() => sendMessage(qr)}
            disabled={isLoading}
            className="whitespace-nowrap bg-white border border-amber-200 px-4 py-2.5 rounded-full text-sm text-amber-700 font-semibold hover:bg-amber-50 hover:border-amber-300 disabled:opacity-30 transition-all flex-shrink-0 shadow-sm"
          >
            {qr}
          </button>
        ))}
      </div>

      {/* Mic button */}
      <div className="p-4 bg-white/60 backdrop-blur-sm border-t border-amber-100 flex items-center justify-center">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isLoading}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-all ${
            isListening
              ? "bg-red-500 text-white animate-pulse scale-110 shadow-lg shadow-red-500/30"
              : isSpeaking
              ? "bg-purple-500 text-white animate-pulse shadow-lg shadow-purple-500/30"
              : "bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
          }`}
        >
          {isListening ? "⏹" : isSpeaking ? "🔊" : "🎤"}
        </button>
      </div>
    </div>
  );
}
