import { useState, useRef, useEffect } from "react";

const SUGGESTED_QUESTIONS = [
  "What foods are toxic to dogs?",
  "How to start potty training a puppy?",
  "What are warning signs of dog sickness?",
  "Feline FVRCP vaccine schedule details",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Replace with real pet profile from your app's state/context if available
  const petProfile = null; // e.g. { name: "Buddy", species: "dog", breed: "Labrador", age: 2 }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput("");
    const userMsg = { role: "user", content: userText };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: messages,
          petProfile,
        }),
      });

      const data = await res.json();

      // Handle rate limit errors (429 = too many requests)
      if (res.status === 429) {
        setMessages([...updatedHistory, {
          role: "assistant",
          content: data.error || "⚠️ Too many messages! Please slow down and try again in a moment. 🐾"
        }]);
      } else if (data.reply) {
        setMessages([...updatedHistory, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([...updatedHistory, {
          role: "assistant",
          content: "Sorry, I couldn't get a response. Please try again."
        }]);
      }
    } catch (err) {
      setMessages([...updatedHistory, {
        role: "assistant",
        content: "Connection error. Please check your internet and try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full bg-[#faf7f2]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xl">
          ✦
        </div>
        <div>
          <h1 className="font-semibold text-gray-800 text-lg">PawNest AI Assistant</h1>
          <p className="text-sm text-gray-500">Personal health, diet, and training guidelines</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Welcome card */}
        {messages.length === 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🐾</span>
              <span className="font-semibold text-gray-800">Welcome to PawNest AI Assistant!</span>
              <span>🐾</span>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              I am here to help you manage your pet's wellness, nutrition, health, and behavior. Ask me anything about:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li><span className="font-semibold text-gray-800">Nutrition:</span> What foods are safe? Portion guide.</li>
              <li><span className="font-semibold text-gray-800">Health/Medical:</span> Sickness signals, vaccination info.</li>
              <li><span className="font-semibold text-gray-800">Behavior/Training:</span> Crate training, barking, scratching.</li>
            </ul>
            <p className="text-gray-400 text-xs mt-3">*Type your question below, or try clicking one of the suggestions!</p>
            <p className="text-gray-400 text-xs mt-1">{formatTime()}</p>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-sm mr-2 mt-1 flex-shrink-0">
                🐾
              </div>
            )}
            <div
              className={`max-w-xl px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                ? "bg-orange-500 text-white rounded-br-sm"
                : msg.content.startsWith("⚠️")
                  ? "bg-orange-50 text-orange-700 border border-orange-200 shadow-sm rounded-bl-sm"
                  : "bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-sm"
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm flex-shrink-0">🐾</div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="px-6 pb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-sm text-orange-600 border border-orange-200 rounded-full px-3 py-1.5 hover:bg-orange-50 transition-colors flex items-center gap-1"
              >
                {q} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about pet feeding, warning signals, training, vaccines..."
            className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder-gray-400"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 bg-orange-400 hover:bg-orange-500 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}