"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Question,
  QuestionSequence,
  getRandomSequence,
} from "@/lib/questions";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type AppState = "welcome" | "question" | "chat" | "feedback";

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

  // Load saved name
  useEffect(() => {
    const saved = localStorage.getItem("englishbuddy_name");
    if (saved) setName(saved);
    const savedSeq = localStorage.getItem("englishbuddy_sequence");
    if (savedSeq) {
      try { setSequence(JSON.parse(savedSeq)); } catch { /* ignore */ }
    }
  }, []);

  // Text-to-speech
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.lang = "en-US";
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
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

  // Speech-to-text
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
      if (result.isFinal) {
        sendMessage(result[0].transcript);
        setTranscript("");
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

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

    setQuestionIndex(0);
    setCurrentQuestion(seq.questions[0]);
    setState("question");
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">English Buddy</h1>
          <p className="text-white/70 text-xs">Talking about: {selectedOption}</p>
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
                <span className="text-xs text-gray-400 block mb-1">🎓 English Buddy</span>
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

      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
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

      <div className="p-4 bg-white border-t flex items-center gap-3">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all flex-shrink-0 ${
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {isListening ? "⏹" : "🎤"}
        </button>
        <input
          type="text"
          placeholder="Or type here..."
          className="flex-1 p-3 rounded-xl border border-gray-200 text-gray-800 focus:border-blue-400 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = "";
            }
          }}
          disabled={isLoading}
        />
        {isSpeaking && (
          <div className="w-8 h-8 flex items-center justify-center text-blue-500 animate-pulse">🔊</div>
        )}
      </div>
    </div>
  );
}
