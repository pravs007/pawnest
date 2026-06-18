import express from "express";
import { sanitizeInput } from "../utils/validation.js";

const router = express.Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

router.post("/chat", async (req, res) => {
  let { message, history = [], petProfile = null } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const trimmed = String(message).trim();
  if (trimmed.length < 2) {
    return res.status(400).json({ error: "Message must be at least 2 characters long" });
  }
  if (trimmed.length > 500) {
    return res.status(400).json({ error: "Message must be at most 500 characters long" });
  }
  if (/<script|javascript:|on\w+=/i.test(trimmed)) {
    return res.status(400).json({ error: "Potential script injection detected" });
  }

  const sanitizedMessage = sanitizeInput(trimmed);

  const systemPrompt = `You are PawNest's AI vet assistant. You ONLY answer questions about pets.

Topics you help with:
- Pet nutrition: safe/toxic foods, portion sizes, diet advice
- Pet health: symptoms, vaccinations, warning signs
- Pet behavior: training, barking, scratching, crate training
- Pet breeds, grooming, and general care

If the user asks ANYTHING not related to pets (politics, coding, math, general chat, etc), respond with exactly:
"I'm only able to help with pet-related questions! 🐾 Try asking me about your pet's health, diet, or training."

Be warm, concise and practical. Always recommend a real vet for serious symptoms.
${petProfile ? `\nThe user's pet: ${JSON.stringify(petProfile)}. Personalize answers to their specific pet.` : ""}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({ role: msg.role === "assistant" ? "assistant" : "user", content: msg.content })),
    { role: "user", content: sanitizedMessage },
  ];

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
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(500).json({ error: "Groq API error", details: data });
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ error: "No response from Groq" });
    }

    res.json({ reply });
  } catch (err) {
    console.error("AI route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;