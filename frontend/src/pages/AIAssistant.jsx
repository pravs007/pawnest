import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Sparkles, AlertTriangle, ArrowRight, User } from 'lucide-react';

const AIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `### Welcome to PawNest AI Assistant! 🐾

I am here to help you manage your pet's wellness, nutrition, health, and behavior. Ask me anything about:
- **Nutrition**: What foods are safe? Portion guide.
- **Health/Medical**: Sickness signals, vaccination info.
- **Behavior/Training**: Crate training, barking, scratching.

*Type your question below, or try clicking one of the suggestions!*`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const suggestions = [
    "What foods are toxic to dogs?",
    "How to start potty training a puppy?",
    "What are warning signs of dog sickness?",
    "Feline FVRCP vaccine schedule details"
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Safe client-side markdown renderer for cleaner display
  const renderMarkdown = (text) => {
    return text.split('\n').map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-extrabold text-brand-dark mt-2.5 mb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="text-xs font-bold text-brand-orange mt-2 mb-0.5">{line.replace('#### ', '')}</h4>;
      }
      // Lists
      if (line.startsWith('*   ') || line.startsWith('-   ') || line.startsWith('* ') || line.startsWith('- ')) {
        const cleanLine = line.replace(/^[\*\-]\s+/, '');
        
        // Render bolding inside list item
        const parts = parseBoldTags(cleanLine);
        return <li key={idx} className="text-xs list-disc pl-4 text-brand-dark/95 my-0.5">{parts}</li>;
      }
      // Blank lines
      if (line.trim() === '') {
        return <div key={idx} className="h-1" />;
      }
      
      // Inline bold tag parser
      const parts = parseBoldTags(line);
      return <p key={idx} className="text-xs text-brand-dark/90 leading-relaxed my-0.5">{parts}</p>;
    });
  };

  const parseBoldTags = (line) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-extrabold text-brand-dark">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }
    return parts.length > 0 ? parts : line;
  };

  const sendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    const userMessage = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pawnest_token')}`
        },
        body: JSON.stringify({ message: textToSend })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Model failed');
      }

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `### 🚨 System Warning
Connection to AI Assistant was interrupted.

Please verify that the backend node process is running and try again. Or rephrase your query.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] lg:h-screen bg-brand-light p-4 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Bot Title Header */}
      <div className="flex items-center gap-3 border-b border-brand-cream/30 pb-4 mb-4 shrink-0">
        <div className="rounded-2xl bg-brand-orange/10 p-2 text-brand-orange">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-brand-dark">PawNest AI Assistant</h2>
          <p className="text-xs text-brand-dark/50">Personal health, diet, and training guidelines</p>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border border-brand-cream/40 shadow-sm overflow-hidden">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Profile icon */}
              <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 text-sm font-bold ${
                msg.sender === 'user' 
                  ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange' 
                  : 'bg-brand-green/10 border-brand-green/30 text-brand-green'
              }`}>
                {msg.sender === 'user' ? <User className="h-4 w-4" /> : '🐾'}
              </div>

              {/* Message Bubble */}
              <div>
                <div className={`rounded-3xl p-4 shadow-sm border ${
                  msg.sender === 'user'
                    ? 'bg-brand-orange/15 border-brand-orange/10 rounded-tr-none text-brand-dark'
                    : 'bg-brand-cream/20 border-brand-cream/30 rounded-tl-none text-brand-dark markdown-chat-bubble'
                }`}>
                  {msg.sender === 'user' ? (
                    <p className="text-xs leading-relaxed font-semibold">{msg.text}</p>
                  ) : (
                    renderMarkdown(msg.text)
                  )}
                </div>
                <span className={`text-[10px] text-brand-dark/40 block mt-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Buffer */}
          {isTyping && (
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="h-8 w-8 rounded-full border bg-brand-green/10 border-brand-green/30 flex items-center justify-center shrink-0">
                🐾
              </div>
              <div>
                <div className="rounded-3xl p-4 bg-brand-cream/20 border border-brand-cream/30 rounded-tl-none flex items-center gap-1">
                  <div className="h-2 w-2 bg-brand-dark/40 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-brand-dark/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 bg-brand-dark/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && !isTyping && (
          <div className="px-6 py-4 border-t border-brand-cream/30 bg-brand-cream/5 shrink-0">
            <p className="text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggest, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(suggest)}
                  className="inline-flex items-center gap-1 rounded-xl bg-white border border-brand-cream/70 px-3 py-1.5 text-xs font-semibold text-brand-dark/80 hover:bg-brand-cream/40 hover:text-brand-brown transition-colors"
                >
                  {suggest}
                  <ArrowRight className="h-3.5 w-3.5 text-brand-orange" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-brand-cream/30 p-4 shrink-0 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputText);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about pet feeding warning signals, training, vaccines..."
              className="flex-1 px-4 py-3 border border-brand-cream bg-brand-light/10 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="rounded-2xl bg-brand-orange p-3.5 text-white shadow-md shadow-brand-orange/15 hover:bg-brand-orange/95 focus:outline-none disabled:opacity-50 disabled:shadow-none transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
