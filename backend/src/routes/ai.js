import express from "express";
import rateLimit from "express-rate-limit";

const router = express.Router();
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─────────────────────────────────────────────
// RATE LIMITER 1: Burst Protection (per minute)
// Prevents spam — max 10 messages per minute
// ─────────────────────────────────────────────
const burstLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  validate: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "⚠️ You're sending messages too fast! Please wait a moment. 🐾"
    });
  }
});

// ─────────────────────────────────────────────
// RATE LIMITER 2: Daily Cap
// Max 50 messages per user per day
// Supports 288 users/day on Groq free tier
// ─────────────────────────────────────────────
const dailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => req.user?.id || req.ip,
  validate: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "⚠️ You've reached your daily limit of 50 messages. Come back tomorrow! 🐾"
    });
  }
});

// ─────────────────────────────────────────────
// FUZZY MATCHING: Common breed typo corrections
// Fixes: "graet dane" → "Great Dane"
// Fixes: "labrodor" → "Labrador"
// This runs BEFORE sending to AI so AI gets
// clean input and gives accurate responses
// ─────────────────────────────────────────────
const BREED_CORRECTIONS = {
  "graet dane": "Great Dane",
  "great dane": "Great Dane",
  "grate dane": "Great Dane",
  "labrodor": "Labrador",
  "labrador retriver": "Labrador Retriever",
  "golden retreiver": "Golden Retriever",
  "golden retriever": "Golden Retriever",
  "germna shepherd": "German Shepherd",
  "german shephard": "German Shepherd",
  "german sheperd": "German Shepherd",
  "buldog": "Bulldog",
  "bull dog": "Bulldog",
  "poodle": "Poodle",
  "begal": "Beagle",
  "beagle": "Beagle",
  "dachsund": "Dachshund",
  "dachshund": "Dachshund",
  "rottweiller": "Rottweiler",
  "rottweiler": "Rottweiler",
  "doberman": "Doberman Pinscher",
  "husky": "Siberian Husky",
  "siberan husky": "Siberian Husky",
  "boxor": "Boxer",
  "boxer": "Boxer",
  "persian": "Persian Cat",
  "siameze": "Siamese Cat",
  "siamese": "Siamese Cat",
  "bengal": "Bengal Cat",
  "ragdol": "Ragdoll Cat",
  "ragdoll": "Ragdoll Cat",
};

// Fix typos in user message before sending to AI
const correctBreedTypos = (message) => {
  let corrected = message.toLowerCase();
  for (const [typo, correct] of Object.entries(BREED_CORRECTIONS)) {
    if (corrected.includes(typo)) {
      corrected = corrected.replace(typo, correct);
    }
  }
  return corrected;
};

const getMockResponse = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes("food") || msg.includes("eat") || msg.includes("toxic") || msg.includes("chocolate") || msg.includes("grape") || msg.includes("onion") || msg.includes("garlic")) {
    return "Many human foods are toxic to dogs! 🚫 Avoid feeding them:\n• **Chocolate** (contains theobromine, toxic to heart/nervous system)\n• **Grapes and Raisins** (causes acute kidney failure)\n• **Onions and Garlic** (causes hemolytic anemia)\n• **Xylitol** (sweetener in sugar-free foods, causes hypoglycemia)\n• **Avocado** (contains persin, causes fluid accumulation)\n\nAlways feed them safe dog treats and consult a vet immediately if they ingest these! 🐾";
  }
  if (msg.includes("vaccin") || msg.includes("shot") || msg.includes("booster") || msg.includes("schedule")) {
    return "Standard vaccine guidelines for dogs include:\n• **Rabies**: Administered at 12-16 weeks, then a booster at 1 year, and every 1-3 years afterward.\n• **DHPP** (Distemper, Hepatitis, Parvovirus, Parainfluenza): Administered in series starting at 6-8 weeks, then every 1-3 years.\n• **Bordetella**: Recommended every 6-12 months for dogs visiting parks or boarding.\n\nYou can schedule reminders in the **Vaccine Tracker**! 🐾";
  }
  if (msg.includes("train") || msg.includes("bark") || msg.includes("potty") || msg.includes("crate")) {
    return "Top training recommendations:\n• **Positive Reinforcement**: Immediately reward desired behavior with treats/praise.\n• **Consistency**: Use the same cues and guidelines every day.\n• **Crate Training**: Introduce the crate gradually as a positive, safe den, never as punishment.\n\nKeep training sessions short (5-10 minutes) and fun! 🐾";
  }
  return `Hello! I am PawNest's AI Pet Care Assistant. 🐾\n\nI can help you with pet health, safety, training, and nutrition topics. For example, try asking:\n• *"What foods are toxic to dogs?"*\n• *"What is the standard vaccine schedule?"*\n• *"How do I potty train my puppy?"*\n\n*(Note: For serious symptoms, always seek advice from a professional vet!)*`;
};

// ─────────────────────────────────────────────
// SYSTEM PROMPT: Production-ready instructions
// Handles:
// 1. Pet info extraction (name, breed)
// 2. Typo tolerance
// 3. Multi-turn memory using conversation history
// 4. Missing field follow-up questions
// 5. Pet care questions only
// 6. Warm, structured responses
// ─────────────────────────────────────────────
const buildSystemPrompt = (petProfile) => `
You are PawNest's friendly and intelligent AI vet assistant.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐾 YOUR CORE RESPONSIBILITIES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Help with pet CARE topics:
   - Nutrition: safe/toxic foods, diet, portions
   - Health: symptoms, diseases, treatments
   - Vaccines: schedules, types, reminders
   - Training: crate, potty, behavior, commands
   - Grooming: bathing, brushing, nail trimming
   - Breeds: characteristics, needs, temperament

2. Extract pet information when user shares it:
   - Always extract Name and Breed from user messages
   - Be TOLERANT of typos — "graet dane" = Great Dane, "labrodor" = Labrador
   - If name is given but breed missing → ask "What breed is [name]?"
   - If breed is given but name missing → ask "What is your pet's name?"
   - If both given → confirm and ask how you can help

3. Remember conversation context:
   - Use previous messages to build complete pet profile
   - If user said name earlier and breed now → combine both
   - Never ask for information already provided in conversation

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PET INFO EXTRACTION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
When user introduces their pet:
✅ Extract: Name, Breed, Age, Species (dog/cat/bird etc)
✅ Correct obvious typos in breed names
✅ If breed is unrecognized → ask for clarification politely
✅ Confirm extracted info back to user
✅ Then ask what care question you can help with

Example response format for pet introduction:
"Got it! 🐾 
• Name: [extracted name]
• Breed: [corrected breed]
How can I help with [name]'s care today?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ TOPICS TO REJECT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Math, coding, politics, general knowledge
- Anything unrelated to pet care

For rejected topics say:
"I'm only able to help with pet care questions! 🐾 
Try asking about [pet name]'s health, diet, vaccines, or training."

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 RESPONSE QUALITY RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Keep responses concise and structured
- Use bullet points for lists
- Use bold for important warnings
- Always recommend a real vet for serious symptoms
- Be warm, friendly, and encouraging

${petProfile ? `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 USER'S REGISTERED PET PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(petProfile, null, 2)}
Use this to personalize all responses.` : ""}
`;

// ─────────────────────────────────────────────
// MAIN CHAT ROUTE
// Apply both rate limiters before processing
// ─────────────────────────────────────────────
router.post("/chat", burstLimiter, dailyLimiter, async (req, res) => {
  const { message, history = [], petProfile = null } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({
      error: "Please type a message before sending! 🐾"
    });
  }

  // Apply fuzzy breed correction to user message
  // This fixes typos BEFORE AI sees the message
  const correctedMessage = correctBreedTypos(message);

  // Build full conversation with system prompt
  const messages = [
    {
      role: "system",
      content: buildSystemPrompt(petProfile)
    },
    // Include full conversation history for multi-turn memory
    // This allows AI to remember name from turn 1 and breed from turn 2
    ...history.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    // Send typo-corrected message to AI
    {
      role: "user",
      content: correctedMessage
    },
  ];

  const isKeyInvalid = !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "" || process.env.GROQ_API_KEY.includes("your_groq_api_key");

  if (isKeyInvalid) {
    console.log("🐾 AI System: Running in Mock Fallback Mode (No valid GROQ_API_KEY provided)");
    const reply = getMockResponse(correctedMessage);
    return res.json({
      reply,
      correctedMessage: correctedMessage !== message.toLowerCase() ? correctedMessage : null
    });
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        max_tokens: 1000,
        temperature: 0.4, // Lower = more accurate, less random
      }),
    });

    const data = await response.json();

    // Handle Groq API errors gracefully
    if (!response.ok) {
      console.error("Groq API error:", data);

      // Gracefully fall back to local mock answer generator if key is invalid
      if (response.status === 401 || response.status === 403 || data.error?.code === 'invalid_api_key') {
        console.log("🐾 AI System Fallback: Reverting to Mock Answers due to Invalid API Key");
        const reply = getMockResponse(correctedMessage);
        return res.json({
          reply,
          correctedMessage: correctedMessage !== message.toLowerCase() ? correctedMessage : null
        });
      }

      // Give specific error messages instead of generic ones
      if (response.status === 429) {
        return res.status(429).json({
          error: "AI service is busy right now. Please try again in a moment! 🐾"
        });
      }
      return res.status(500).json({
        error: "AI service temporarily unavailable. Please try again! 🐾"
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    // Handle empty response from AI
    if (!reply || reply.trim() === "") {
      return res.status(500).json({
        error: "I didn't quite get that — could you rephrase your question? 🐾"
      });
    }

    res.json({
      reply,
      // Send back corrected message so frontend knows what was processed
      correctedMessage: correctedMessage !== message.toLowerCase() ? correctedMessage : null
    });

  } catch (err) {
    console.error("AI route error:", err);

    // Network error vs server error
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
      return res.status(503).json({
        error: "Can't reach AI service. Please check your connection! 🐾"
      });
    }

    res.status(500).json({
      error: "Something went wrong on our end. Please try again! 🐾"
    });
  }
});

export default router;