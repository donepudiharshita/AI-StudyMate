require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini API with key from .env file
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Configured for Gemini Flash model
const MODEL_NAME = "gemini-3.6-flash"; // or "gemini-2.0-flash"

// Express Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Configure Multer memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Limit to 25MB
});

/* ==========================================================================
   HELPER FUNCTIONS
   ========================================================================== */

/**
 * Safely parses raw string into JSON after stripping markdown fences
 */
function parseJSON(rawText) {
  if (typeof rawText === "object" && rawText !== null) {
    return rawText;
  }

  let cleanJsonText = String(rawText)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const jsonMatch = cleanJsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanJsonText = jsonMatch[0];
  }

  return JSON.parse(cleanJsonText);
}

/**
 * Clean up user topic input
 */
function cleanTopic(userInput) {
  if (!userInput) return "General Study";
  return userInput.replace(/^explain\s+(about\s+)?/i, "").trim();
}

/**
 * Helper to generate response using Gemini API
 */
async function callGemini(promptParts, isJson = false) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is missing in your environment variables (.env file).");
  }

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: isJson
      ? { responseMimeType: "application/json" }
      : undefined,
  });

  const result = await model.generateContent(promptParts);
  const response = await result.response;
  return response.text();
}

/**
 * Processes uploaded files (PDF, Images, Text) for Gemini Multimodal API
 */
async function processUploadedFile(file) {
  if (!file) return { fileText: "", inlinePart: null };

  const mimeType = file.mimetype;

  // PDF or Image files: Format correctly for Gemini Multimodal API
  if (mimeType === "application/pdf" || mimeType.startsWith("image/")) {
    return {
      fileText: "",
      inlinePart: {
        inlineData: {
          data: file.buffer.toString("base64"),
          mimeType: mimeType,
        },
      },
    };
  }

  // Plain Text files
  return {
    fileText: `\n--- ATTACHED FILE CONTENT (${file.originalname}) ---\n${file.buffer.toString("utf-8")}\n--- END OF FILE CONTENT ---\n`,
    inlinePart: null,
  };
}

/* ==========================================================================
   PRIMARY API FUNCTIONS
   ========================================================================== */

/**
 * Generate primary study session material (Concepts, Flashcards, Quiz)
 */
async function generateStudyMaterial(userInput, difficulty = "medium") {
  const topic = cleanTopic(userInput);

  const prompt = `You are an expert AI tutor generating comprehensive study materials for "${topic}" at difficulty level "${difficulty}".

Output ONLY valid JSON matching this exact structure:
{
  "title": "${topic}",
  "subject": "${topic} Fundamentals",
  "summary": "Quick Explanation: Provide a detailed 3-4 sentence explanation breaking down ${topic}, its core principles, and practical importance.",
  "difficulty": "${difficulty}",
  "estimatedMinutes": 30,
  "keyConcepts": [
    "Concept 1 Name: Provide a 2 to 3 sentence detailed explanation of this concept within ${topic}.",
    "Concept 2 Name: Provide a 2 to 3 sentence detailed explanation of this concept within ${topic}.",
    "Concept 3 Name: Provide a 2 to 3 sentence detailed explanation of this concept within ${topic}.",
    "Concept 4 Name: Provide a 2 to 3 sentence detailed explanation of this concept within ${topic}.",
    "Concept 5 Name: Provide a 2 to 3 sentence detailed explanation of this concept within ${topic}.",
    "Concept 6 Name: Provide a 2 to 3 sentence detailed explanation of this concept within ${topic}."
  ],
  "flashcards": [
    { "id": 1, "question": "Targeted question about ${topic}?", "answer": "Quick Explanation: 3-sentence thorough answer with a practical example." },
    { "id": 2, "question": "Targeted question about ${topic}?", "answer": "Quick Explanation: 3-sentence thorough answer with a practical example." },
    { "id": 3, "question": "Targeted question about ${topic}?", "answer": "Quick Explanation: 3-sentence thorough answer with a practical example." },
    { "id": 4, "question": "Targeted question about ${topic}?", "answer": "Quick Explanation: 3-sentence thorough answer with a practical example." },
    { "id": 5, "question": "Targeted question about ${topic}?", "answer": "Quick Explanation: 3-sentence thorough answer with a practical example." },
    { "id": 6, "question": "Targeted question about ${topic}?", "answer": "Quick Explanation: 3-sentence thorough answer with a practical example." },
    { "id": 7, "question": "Targeted question about ${topic}?", "answer": "Quick Explanation: 3-sentence thorough answer with a practical example." },
    { "id": 8, "question": "Targeted question about ${topic}?", "answer": "Quick Explanation: 3-sentence thorough answer with a practical example." }
  ],
  "quiz": [
    {
      "id": 1,
      "question": "Multiple choice question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Quick Explanation: 2-3 sentences explaining why this option is correct."
    },
    {
      "id": 2,
      "question": "Multiple choice question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Quick Explanation: 2-3 sentences explaining why this option is correct."
    },
    {
      "id": 3,
      "question": "Multiple choice question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option C",
      "explanation": "Quick Explanation: 2-3 sentences explaining why this option is correct."
    },
    {
      "id": 4,
      "question": "Multiple choice question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option D",
      "explanation": "Quick Explanation: 2-3 sentences explaining why this option is correct."
    },
    {
      "id": 5,
      "question": "Multiple choice question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Quick Explanation: 2-3 sentences explaining why this option is correct."
    },
    {
      "id": 6,
      "question": "Multiple choice question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Quick Explanation: 2-3 sentences explaining why this option is correct."
    },
    {
      "id": 7,
      "question": "Multiple choice question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option C",
      "explanation": "Quick Explanation: 2-3 sentences explaining why this option is correct."
    },
    {
      "id": 8,
      "question": "Multiple choice question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option D",
      "explanation": "Quick Explanation: 2-3 sentences explaining why this option is correct."
    },
    {
      "id": 9,
      "question": "Multiple choice question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Quick Explanation: 2-3 sentences explaining why this option is correct."
    },
    {
      "id": 10,
      "question": "Multiple choice question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Quick Explanation: 2-3 sentences explaining why this option is correct."
    }
  ]
}

STRICT:
- Every key concept string MUST start with "Concept Name: Explanation".
- Generate EXACTLY 6 key concepts, 8 flashcards, and 10 quiz questions.`;

  const rawText = await callGemini(prompt, true);
  const data = parseJSON(rawText);

  return {
    title: data.title || topic,
    subject: data.subject || `${topic} Study`,
    summary: data.summary || `Quick Explanation: Overview of ${topic}.`,
    difficulty: data.difficulty || difficulty,
    estimatedMinutes: data.estimatedMinutes || 30,
    keyConcepts: Array.isArray(data.keyConcepts) ? data.keyConcepts : [],
    flashcards: Array.isArray(data.flashcards) ? data.flashcards : [],
    quiz: Array.isArray(data.quiz) ? data.quiz : [],
  };
}

/**
 * AI Learning Modes (ELI5, Step-by-Step, Real World, Roadmap)
 */
async function generateAIModeContent(topic, mode) {
  const clean = cleanTopic(topic);
  let prompt = "";

  switch (mode) {
    case "eli5":
      prompt = `Explain "${clean}" like I am 5 years old. Write 3 simple paragraphs using clear real-life analogies.`;
      break;
    case "stepByStep":
      prompt = `Provide a step-by-step breakdown of how "${clean}" works sequentially across 4 numbered steps, with 3 detailed sentences per step.`;
      break;
    case "realWorld":
      prompt = `Detail 3 real-world applications of "${clean}". Write a full 3-sentence paragraph for each application.`;
      break;
    case "roadmap":
      prompt = `Create a 4-week learning roadmap for "${clean}". For each week (Week 1 through Week 4), write a 3-sentence paragraph detailing study goals and tasks.`;
      break;
    default:
      prompt = `Provide a thorough educational overview of "${clean}".`;
  }

  return await callGemini(prompt, false);
}

/**
 * Detail modal/view for individual key concepts
 */
async function generateConceptDetail(topic, concept) {
  const cleanT = cleanTopic(topic);
  const prompt = `
Explain the concept "${concept}" in detail for a student studying "${cleanT}". 

Format with markdown headers:
## Overview & Definition
Write 3 detailed sentences explaining what ${concept} is.

## Core Principle & Logic
Write 3 detailed sentences explaining the underlying principles and rules.

## Practical Real-World Example
Write 3 detailed sentences showing a practical scenario or application.

## Quick Study Tip
Write 2-3 actionable tips to master this concept.
`;

  return await callGemini(prompt, false);
}

/**
 * Ask AI Tutor follow-up Q&A + File Analysis
 */
async function askFollowUpQuestion(topic, question, file) {
  const cleanT = cleanTopic(topic || "General Study");
  const userQuery = question || "Please summarize and explain this document in detail.";

  const { fileText, inlinePart } = await processUploadedFile(file);

  const textPrompt = `
You are an expert AI tutor. 
Topic / Subject Context: "${cleanT}".
Student Request: "${userQuery}"
${fileText}

Provide a helpful, well-structured, educational response.

Return ONLY valid JSON matching this format:
{
  "answer": "Provide a comprehensive, clear, and structured answer to the user's question or file summary.",
  "additionalConcepts": [],
  "newFlashcards": []
}
`;

  const promptParts = inlinePart ? [textPrompt, inlinePart] : [textPrompt];
  const rawText = await callGemini(promptParts, true);

  return parseJSON(rawText);
}

/* ==========================================================================
   EXPRESS ROUTES & ENDPOINTS
   ========================================================================== */

// Health check endpoint
app.get("/", (req, res) => {
  res.send("🚀 AI StudyMate Backend Server is running!");
});

// Generate main study content
app.post("/api/study/generate", async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: "Topic is required." });
    }
    const data = await generateStudyMaterial(topic, difficulty);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Generate Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to generate study content." });
  }
});

// Generate AI Learning Mode content
app.post("/api/study/mode", async (req, res) => {
  try {
    const { topic, mode } = req.body;
    if (!topic || !mode) {
      return res.status(400).json({ success: false, message: "Topic and mode are required." });
    }
    const data = await generateAIModeContent(topic, mode);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Mode Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to generate mode content." });
  }
});

// Generate concept details
app.post("/api/study/concept-detail", async (req, res) => {
  try {
    const { topic, concept } = req.body;
    if (!concept) {
      return res.status(400).json({ success: false, message: "Concept is required." });
    }
    const data = await generateConceptDetail(topic, concept);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Concept Detail Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to generate concept details." });
  }
});

// Ask follow-up question (supports text questions + optional uploaded file/image)
app.post("/api/study/ask", upload.single("file"), async (req, res) => {
  try {
    const topic = req.body.topic;
    const question = req.body.question;
    const file = req.file;

    if (!question && !file) {
      return res.status(400).json({ success: false, message: "Please provide a question or a file." });
    }

    const data = await askFollowUpQuestion(topic, question, file);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Ask Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to process question." });
  }
});

/* ==========================================================================
   START SERVER
   ========================================================================== */

app.listen(PORT, () => {
  console.log(`🚀 Server is listening continuously on http://localhost:${PORT}`);
});