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
  const [conversationCount, setConversationCount] = useState(0);
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

  // Load saved state
  useEffect(() => {
    const saved = localStorage.getItem("englishbuddy_name");
    if (saved) setName(saved);
    const savedSeq = localStorage.getItem("englishbuddy_sequence");
    if (savedSeq) {
      try { setSequence(JSON.parse(savedSeq)); } catch { /* ignore */ }
    }
    const savedCount = localStorage.getItem("englishbuddy_conversations");
    if (savedCount) setConversationCount(parseInt(savedCount, 10) || 0);
    const savedChar = localStorage.getItem("englishbuddy_character");
    if (savedChar) {
      const found = CHARACTERS.find(c => c.id === savedChar);
      if (found) setCharacter(found);
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

  // Send message to AI
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
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
      const data = await res.json();
      if (data.message) {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
        speak(data.message);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentQuestion, selectedOption, difficulty, speak]);

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

  // Pick a card
  const handlePickOption = async (option: string) => {
    setSelectedOption(option);
    setMessages([]);
    setState("chat");

    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `I chose: ${option}` }],
          topic: currentQuestion?.text,
          selectedOption: option,
          difficulty,
          characterPersonality: character.personality,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages([{ role: "assistant", content: data.message }]);
        speak(data.message);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => goToNextQuestion();
  const handleNewQuestion = () => setState("feedback");

  const handleFeedback = (rating: string) => {
    if (rating === "too_easy") setDifficulty(Math.min(3, difficulty + 1));
    else if (rating === "too_hard") setDifficulty(Math.max(1, difficulty - 1));

    // Increment conversation count
    const newCount = conversationCount + 1;
    setConversationCount(newCount);
    localStorage.setItem("englishbuddy_conversations", String(newCount));

    // Check if we just unlocked a new character
    const newlyUnlocked = CHARACTERS.find(c => c.unlockAt === newCount);
    if (newlyUnlocked) {
      setJustUnlocked(newlyUnlocked);
      setState("unlock");
      return;
    }

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
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🎓</div>
        <h1 className="text-4xl font-bold text-white mb-2">English Buddy</h1>
        <p className="text-white/80 text-lg mb-8">Learn English with a friend!</p>
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
          <label className="text-gray-600 text-sm font-medium mb-2 block">
            What&apos;s your name?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            placeholder="Type your name..."
            className="w-full p-3 rounded-xl border-2 border-blue-200 text-lg focus:border-blue-400 focus:outline-none text-gray-800 mb-4"
            autoFocus
          />
          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full bg-blue-500 text-white text-xl font-bold py-3 rounded-xl hover:bg-blue-600 disabled:opacity-40 transition-all"
          >
            Let&apos;s Go! 🚀
          </button>
        </div>
      </div>
    );
  }

  // --- CHARACTER SELECT ---
  if (state === "characters") {
    const unlocked = getUnlockedCharacters(conversationCount);
    const progress = getProgressToNext(conversationCount);
    const nextChar = getNextUnlock(conversationCount);

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Choose your buddy!</h2>

        {/* Progress bar */}
        {nextChar && (
          <div className="w-full max-w-sm mb-6">
            <div className="flex items-center justify-between text-white/70 text-xs mb-1">
              <span>{conversationCount} conversations</span>
              <span className="flex items-center gap-1">
                <span>{nextChar.emoji}</span> unlocks at {nextChar.unlockAt}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-sm">
          {CHARACTERS.map((char) => {
            const isUnlocked = unlocked.includes(char);
            const isSelected = character.id === char.id;
            return (
              <button
                key={char.id}
                onClick={() => isUnlocked && handleSelectCharacter(char)}
                disabled={!isUnlocked}
                className={`rounded-2xl p-4 flex items-center gap-4 shadow-lg transition-all ${
                  isUnlocked
                    ? isSelected
                      ? "bg-white scale-105 ring-4 ring-yellow-400"
                      : "bg-white hover:scale-105 active:scale-95"
                    : "bg-white/30 opacity-50"
                }`}
              >
                <span className="text-4xl">{char.emoji}</span>
                <div className="text-left flex-1">
                  <span className="text-lg font-semibold text-gray-800 block">
                    {char.name}
                  </span>
                  {!isUnlocked && (
                    <span className="text-xs text-gray-500">
                      🔒 {char.unlockAt} conversations to unlock
                    </span>
                  )}
                </div>
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
      <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-500 flex flex-col items-center justify-center p-6">
        <div className="text-7xl mb-4 animate-bounce">{justUnlocked.emoji}</div>
        <h2 className="text-3xl font-bold text-white mb-2">New Buddy!</h2>
        <p className="text-white/90 text-xl mb-8">
          You unlocked <strong>{justUnlocked.name}</strong>!
        </p>
        <button
          onClick={handleUnlockContinue}
          className="bg-white text-orange-600 text-xl font-bold px-8 py-4 rounded-2xl shadow-lg hover:scale-105 transition-transform active:scale-95"
        >
          Talk to {justUnlocked.name}! 🎉
        </button>
      </div>
    );
  }

  // --- QUESTION CARDS ---
  if (state === "question" && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <p className="text-white/70 text-sm mb-2">Hi {name}! 👋</p>
          <h2 className="text-2xl font-bold text-white">{currentQuestion.text}</h2>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {currentQuestion.options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handlePickOption(opt.label)}
              className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-lg hover:scale-105 transition-transform active:scale-95"
            >
              <span className="text-4xl">{opt.emoji}</span>
              <span className="text-xl font-semibold text-gray-800">{opt.label}</span>
            </button>
          ))}
        </div>
        <button onClick={handleSkip} className="mt-6 text-white/60 hover:text-white transition-colors">
          Skip →
        </button>
      </div>
    );
  }

  // --- FEEDBACK ---
  if (state === "feedback") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-white mb-8">How was that?</h2>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {[
            { rating: "too_easy", emoji: "😊", text: "Too easy!", bg: "bg-green-100", color: "text-green-800" },
            { rating: "just_right", emoji: "👍", text: "Just right!", bg: "bg-blue-100", color: "text-blue-800" },
            { rating: "too_hard", emoji: "😅", text: "Too hard!", bg: "bg-orange-100", color: "text-orange-800" },
          ].map((item) => (
            <button
              key={item.rating}
              onClick={() => handleFeedback(item.rating)}
              className={`${item.bg} rounded-2xl p-5 flex items-center gap-4 shadow-lg hover:scale-105 transition-transform active:scale-95`}
            >
              <span className="text-4xl">{item.emoji}</span>
              <span className={`text-xl font-semibold ${item.color}`}>{item.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- CHAT ---
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className={`bg-gradient-to-r ${character.color} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{character.emoji}</span>
          <div>
            <h1 className="text-white font-bold text-lg">{character.name}</h1>
            <p className="text-white/70 text-xs">Talking about: {selectedOption}</p>
          </div>
        </div>
        <button
          onClick={handleNewQuestion}
          className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
        >
          New Question ✨
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-blue-500 text-white rounded-br-sm"
                : "bg-white text-gray-800 shadow-sm rounded-bl-sm"
            }`}>
              {msg.role === "assistant" && (
                <span className="text-xs text-gray-400 block mb-1">{character.emoji} {character.name}</span>
              )}
              <p className="text-base">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm rounded-bl-sm">
              <span className="text-gray-400 animate-pulse">thinking...</span>
            </div>
          </div>
        )}
        {transcript && (
          <div className="flex justify-end">
            <div className="bg-blue-200 text-blue-800 rounded-2xl px-4 py-3 rounded-br-sm opacity-60">
              <p className="text-base italic">{transcript}...</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="px-4 pb-2 flex gap-2 overflow-x-auto justify-center">
        {quickResponses.map((qr) => (
          <button
            key={qr}
            onClick={() => sendMessage(qr)}
            disabled={isLoading}
            className="whitespace-nowrap bg-white border border-gray-200 px-3 py-2 rounded-full text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            {qr}
          </button>
        ))}
      </div>

      <div className="p-4 bg-white border-t flex items-center justify-center">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isLoading}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-all shadow-lg ${
            isListening
              ? "bg-red-500 text-white animate-pulse scale-110"
              : isSpeaking
              ? "bg-blue-400 text-white animate-pulse"
              : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
          }`}
        >
          {isListening ? "⏹" : isSpeaking ? "🔊" : "🎤"}
        </button>
      </div>
    </div>
  );
}
