import express from 'express';
import { auth } from '../middleware/auth.js';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const router = express.Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Rule-based rich fallback content for local testing
const LOCAL_BOT_KNOWLEDGE = [
  {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'help'],
    response: `### Welcome to PawNest AI Assistant! 🐾

I am here to help you manage your pet's wellness, nutrition, health, and behavior. Ask me anything about:
- **Nutrition**: What foods are safe? Portion guide.
- **Health/Medical**: Sickness signals, vaccination info.
- **Behavior/Training**: Crate training, barking, scratching.

*Type your question below, or try asking: "What foods are toxic to dogs?" or "How do I start crate training a puppy?"*`
  },
  {
    keywords: ['food', 'eat', 'diet', 'nutrition', 'feed', 'toxic', 'chocolate', 'grape'],
    response: `### Pet Nutrition & Dietary Guidelines 🥦

Proper nutrition is foundational for your pet's long-term health. Here is what you should know:

#### ⚠️ Toxic Foods to NEVER Feed (Keep Out of Reach!)
*   **Dogs**: Chocolate, grapes/raisins, onions, garlic, macadamia nuts, avocado, caffeine, and xylitol (sweetener).
*   **Cats**: Onions, garlic, raw eggs/meat, milk/dairy (causes digestive distress), grapes, and chocolate.

#### 🥩 Balanced Diets
1.  **High-Quality Protein**: Ensure meat is the first ingredient in commercial food.
2.  **Age-Appropriate Feeding**: Puppy/Kitten formulas are high-calorie for growth. Adult and Senior formulas manage weights and joints.
3.  **Hydration**: Keep clean water accessible. For cats, consider adding wet food to prevent kidney issues.

*If your pet has eaten something toxic, contact emergency veterinary services immediately.*`
  },
  {
    keywords: ['sick', 'vomit', 'diarrhea', 'lethargic', 'cough', 'scratch', 'fever', 'blood', 'vet'],
    response: `### Health Guidance & Sickness Warning Signals 🩺

If your pet is showing physical distress, monitor them closely. Below are common guidelines:

#### 🚨 Red Alert Symptoms (See a Vet Immediately)
*   **Difficulty breathing** or heavy panting.
*   **Severe lethargy** (won't get up, unreactive).
*   **Repeated vomiting** or diarrhea lasting more than 24 hours.
*   **Ingesting chemicals** or foreign objects.
*   **Pale gums** (indicates shock or internal bleeding).

#### 🩹 Minor Concerns
*   **Mild scratching**: Check for fleas/ticks first, then check for red skin patches (allergies).
*   **One-time vomit**: Withhold food for 6-8 hours, offer fresh water, then reintroduce bland food (boiled chicken & white rice).

*Disclaimer: PawNest AI provides educational info. It is NOT a substitute for professional veterinary diagnosis.*`
  },
  {
    keywords: ['train', 'bark', 'potty', 'crate', 'chew', 'bite', 'scratch', 'litter', 'behavior'],
    response: `### Pet Behavior & Training Support 🐕

Addressing behavioral challenges requires patience and consistency. Here are modern, positive methods:

#### 🚽 Potty / House Training
1.  **Consistent Schedule**: Take your pet out first thing in the morning, after meals, after play, and before bed.
2.  **Immediate Praise**: Reward them with treats *immediately* when they go outside. Never punish accidents inside; simply clean it with enzymatic cleaner.

#### 🏠 Crate Training
*   Make the crate a happy zone. Place favorite toys, comfortable blankets, and feed meals inside the crate.
*   Increase duration gradually. Start with 1 minute, and reward quiet behavior.

#### 🐱 Cat Scratching & Spraying
*   Provide sturdy scratching posts near where they sleep. Use catnip to attract them.
*   Clean marking spots thoroughly. Spraying is often a response to stress or local strays.`
  },
  {
    keywords: ['vaccin', 'shot', 'rabies', 'schedule', 'reminder', 'deworm'],
    response: `### Vaccination Schedules & Prevention Timeline 💉

Vaccinations protect your pets from severe infectious illnesses. Here is the recommended baseline:

#### 🐶 Dog Vaccination Schedule
*   **6-8 Weeks**: DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza).
*   **10-12 Weeks**: DHPP Booster + Bordetella (Kennel Cough) + Leptospirosis.
*   **14-16 Weeks**: DHPP Booster + Rabies (required by law in many regions).
*   **Every 1-3 Years**: Rabies, DHPP Boosters.

#### 🐱 Cat Vaccination Schedule
*   **6-8 Weeks**: FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia).
*   **10-12 Weeks**: FVRCP Booster + FeLV (Feline Leukemia Virus).
*   **14-16 Weeks**: FVRCP Booster + Rabies.
*   **Every 1-3 Years**: Rabies, FVRCP Boosters.

*Check out our **Vaccination Tracker** in the main menu to log records and receive notifications!*`
  }
];

// Helper function to call Google Gemini API directly using Node's native HTTPS
const fetchGeminiResponse = (prompt) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [{
        parts: [{
          text: `You are PawNest AI, an expert veterinary pet care assistant. Provide a helpful, caring, structured response with clear advice, health guidance, and nutrition tips. Use markdown formatting. Keep the reply friendly, direct, and under 250 words. User question: ${prompt}`
        }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts[0].text) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            console.error('Unexpected Gemini API response structure:', json);
            reject(new Error('Invalid response from AI model'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
};

// @route   POST api/ai/chat
// @desc    Process chat request
// @access  Private
router.post('/chat', auth, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Please provide a message query' });
  }

  const query = message.toLowerCase().trim();

  // If Gemini API Key exists, try connecting
  if (GEMINI_API_KEY) {
    try {
      const aiReply = await fetchGeminiResponse(message);
      return res.json({ reply: aiReply });
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local rule-based system:', err.message);
    }
  }

  // Fallback to local Rule-Based logic
  let bestMatch = null;
  let maxMatches = 0;

  for (const knowledge of LOCAL_BOT_KNOWLEDGE) {
    let matches = 0;
    for (const keyword of knowledge.keywords) {
      if (query.includes(keyword)) {
        matches++;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = knowledge;
    }
  }

  if (bestMatch) {
    res.json({ reply: bestMatch.response });
  } else {
    // Standard default response
    res.json({
      reply: `### Guidelines for General Pet Care & Wellness 🐾

Thank you for your question! I couldn't find matches for specific behavior, diet, or sickness keywords in your message. Here is a general pet wellness summary:

1.  **Daily Routine**: Ensure regular exercise (dogs benefit from 30+ min walks; cats thrive on interactive play with feather toys).
2.  **Regular Grooming**: Brush coat weekly, trim nails regularly, and brush teeth to prevent dental disease.
3.  **Wellness Checks**: Schedule annual veterinary visits for heartworm checks, dental hygiene, and blood profiles.

*Could you rephrase your question? Try asking specifically about: "puppy food", "potty training steps", "fever symptoms", or "flea treatment".*`
    });
  }
});

export default router;
