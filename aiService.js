require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API with key from environment variables
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Configured for Gemini 3.6 Flash model
const MODEL_NAME = "gemini-3.6-flash";

/**
 * Helper to call Google Gemini API.
 */
async function callGemini(prompt, isJsonResponse = false) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is missing in your environment variables (.env file).");
  }

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: isJsonResponse
      ? { responseMimeType: "application/json" }
      : undefined
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  if (!text) {
    throw new Error("Gemini API returned an empty response.");
  }

  return text;
}

/**
 * Safely parses raw string into JSON after stripping markdown code blocks.
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
 * Clean up user input to extract pure topic keywords.
 * Fixes phrases like "explain about java" -> "java"
 */
function cleanTopic(userInput) {
  if (!userInput) return "Java";
  
  return userInput
    .replace(/^(explain\s+about|explain|tell\s+me\s+about|what\s+is|how\s+does|teach\s+me\s+about|learn|about)\s+/i, "")
    .replace(/^about\s+/i, "")
    .trim();
}

/* ==========================================================================
   DYNAMIC FALLBACK GENERATORS (Used if API Key is missing or fails)
   ========================================================================== */

function generateFallbackAIMode(topic, mode) {
  const clean = cleanTopic(topic);
  const title = clean.charAt(0).toUpperCase() + clean.slice(1);

  switch (mode) {
    case "eli5":
      return `### ${title} Explained Simply\n\n` +
             `Imagine building a house using prefabricated standard components instead of laying individual raw bricks every single time. **${title}** provides standard rules and components so you can build software efficiently.\n\n` +
             `Think of it like driving a car: you step on the gas pedal without needing to rebuild the engine from scratch!`;

    case "stepByStep":
      return `### Step-by-Step Breakdown of ${title}\n\n` +
             `1. **Core Concepts & Syntax:** Master the fundamental rules and terms in ${title}.\n` +
             `2. **Execution Flow:** Learn how ${title} processes instructions under the hood.\n` +
             `3. **Building Blocks:** Combine variables, functions, and logic into functional modules.\n` +
             `4. **Practical Application:** Build real-world applications to solve practical problems.`;

    case "realWorld":
      return `### Real-World Applications of ${title}\n\n` +
             `* **Enterprise Systems:** Powering large-scale corporate software and servers.\n` +
             `* **Mobile & Web Apps:** Building backends and applications used by millions.\n` +
             `* **Software Automation:** Creating tools to automate tedious workflows.`;

    case "roadmap":
      return `### 4-Week Study Roadmap for ${title}\n\n` +
             `* **Week 1: Fundamentals:** Core definitions, setup, and basic syntax.\n` +
             `* **Week 2: Essential Concepts:** Control flow, main structures, and paradigms.\n` +
             `* **Week 3: Practical Projects:** Build small hands-on projects.\n` +
             `* **Week 4: Advanced Mastery:** Debugging, performance optimization, and best practices.`;

    default:
      return `### Overview of ${title}\n\n${title} is an essential domain topic designed to build scalable solutions and solve modern complex problems.`;
  }
}

function generateFallbackStudyMaterial(userInput, difficulty) {
  const clean = cleanTopic(userInput);
  const isJava = clean.toLowerCase() === "java";
  const title = isJava ? "Java Programming" : (clean.charAt(0).toUpperCase() + clean.slice(1));

  if (isJava) {
    return {
      title: "Java Programming",
      subject: "Computer Science",
      summary: "Java is a popular high-level, object-oriented programming language designed around the philosophy 'Write Once, Run Anywhere' via the Java Virtual Machine (JVM).",
      difficulty: difficulty || "beginner",
      estimatedMinutes: 30,
      keyConcepts: [
        "Object-Oriented Programming (OOP): Using Classes, Objects, Inheritance, and Encapsulation.",
        "Java Virtual Machine (JVM): Converts compiled bytecode into machine code across operating systems.",
        "Automatic Garbage Collection: Automatically frees memory by destroying unreferenced objects.",
        "Syntax & Variables: Using core types like int, String, boolean, and standard control loops."
      ],
      flashcards: [
        { id: 1, question: "What does 'Write Once, Run Anywhere' mean in Java?", answer: "It means Java code compiles into platform-independent bytecode that runs on any machine with a JVM." },
        { id: 2, question: "What is the difference between JDK and JRE?", answer: "JDK is the development kit used to write and compile code, while JRE provides the libraries needed to run it." },
        { id: 3, question: "What is Garbage Collection in Java?", answer: "It is an automated memory management feature that removes unused objects from memory." }
      ],
      quiz: [
        {
          id: 1,
          question: "Which keyword is used to create a subclass inheritance relationship in Java?",
          options: ["extends", "implements", "inherits", "super"],
          correctAnswer: "extends",
          explanation: "In Java, the 'extends' keyword is used by a child class to inherit from a parent class."
        },
        {
          id: 2,
          question: "What is the correct signature for the main entry point method in Java?",
          options: ["public static void main(String[] args)", "public void start()", "static main()", "public class Main()"],
          correctAnswer: "public static void main(String[] args)",
          explanation: "The main method signature must be public, static, void, and accept a String array parameter."
        }
      ]
    };
  }

  return {
    title: title,
    subject: `${title} Study Guide`,
    summary: `${title} is a core educational subject covering essential principles, structures, and practical scenarios.`,
    difficulty: difficulty || "medium",
    estimatedMinutes: 30,
    keyConcepts: [
      `Introduction to ${title}: Core definitions and foundational principles.`,
      `${title} Mechanics: Key components and structural rules.`,
      `Practical Applications: Real-world implementation scenarios.`,
      `Best Practices: Strategies for effective usage.`
    ],
    flashcards: [
      { id: 1, question: `What is the primary purpose of ${title}?`, answer: `${title} provides structured methods to address real-world technical problems.` }
    ],
    quiz: [
      {
        id: 1,
        question: `What is the recommended first step when learning ${title}?`,
        options: ["Master core definitions and principles", "Skip fundamentals", "Memorize advanced code without context", "Ignore practical examples"],
        correctAnswer: "Master core definitions and principles",
        explanation: "Understanding core terminology lays the groundwork for practical skill development."
      }
    ]
  };
}

/* ==========================================================================
   PRIMARY API FUNCTIONS
   ========================================================================== */

async function generateStudyMaterial(userInput, difficulty = "medium") {
  const topic = cleanTopic(userInput);

  const prompt = `You are an expert tutor creating detailed study materials for the topic: "${topic}" at level "${difficulty}".

IMPORTANT: Strictly generate content specific to ${topic}. Do not use prompt artifacts like "explain about" in your questions or concepts.

Return ONLY valid JSON matching this exact structure:
{
  "title": "${topic}",
  "subject": "Computer Science",
  "summary": "Detailed 3-4 sentence explanation summarizing ${topic}.",
  "difficulty": "${difficulty}",
  "estimatedMinutes": 35,
  "keyConcepts": [
    "Concept Title: Clear explanation of core concept.",
    "Concept Title: Clear explanation of second concept.",
    "Concept Title: Clear explanation of third concept.",
    "Concept Title: Clear explanation of fourth concept."
  ],
  "flashcards": [
    { "id": 1, "question": "Clear question about ${topic}?", "answer": "Detailed answer explaining the concept." },
    { "id": 2, "question": "Clear question about ${topic}?", "answer": "Detailed answer explaining the concept." }
  ],
  "quiz": [
    {
      "id": 1,
      "question": "Clear question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation why Option A is correct."
    },
    {
      "id": 2,
      "question": "Clear question about ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Explanation why Option B is correct."
    }
  ]
}`;

  try {
    const rawText = await callGemini(prompt, true);
    const data = parseJSON(rawText);

    return {
      title: data.title || topic,
      subject: data.subject || `${topic} Study`,
      summary: data.summary || `Overview of ${topic}.`,
      difficulty: data.difficulty || difficulty,
      estimatedMinutes: data.estimatedMinutes || 35,
      keyConcepts: Array.isArray(data.keyConcepts) ? data.keyConcepts : [],
      flashcards: Array.isArray(data.flashcards) ? data.flashcards : [],
      quiz: Array.isArray(data.quiz) ? data.quiz : []
    };
  } catch (err) {
    console.warn("Gemini API error, serving fallback data:", err.message);
    return generateFallbackStudyMaterial(userInput, difficulty);
  }
}

async function generateAIModeContent(topic, mode) {
  const clean = cleanTopic(topic);
  let prompt = "";

  switch (mode) {
    case "eli5":
      prompt = `Explain "${clean}" like I am 5 years old using clear real-life analogies.`;
      break;
    case "stepByStep":
      prompt = `Provide a step-by-step breakdown of how "${clean}" works sequentially in 4 steps.`;
      break;
    case "realWorld":
      prompt = `Detail 3 real-world applications of "${clean}". Write a full paragraph for each.`;
      break;
    case "roadmap":
      prompt = `Create a 4-week learning roadmap for "${clean}" detailing weekly goals and tasks.`;
      break;
    default:
      prompt = `Provide an educational overview of "${clean}".`;
  }

  try {
    return await callGemini(prompt, false);
  } catch (error) {
    console.warn("Gemini API error for AI mode, serving fallback:", error.message);
    return generateFallbackAIMode(clean, mode);
  }
}

async function generateConceptDetail(topic, concept) {
  const cleanT = cleanTopic(topic);
  const prompt = `
Explain concept "${concept}" in detail for a student studying "${cleanT}". 

Format with headers:
## Overview & Definition
3 detailed sentences.

## Core Principle & Logic
3 detailed sentences.

## Practical Real-World Example
3 detailed sentences.

## Quick Study Tip
2-3 actionable sentences.
`;

  try {
    return await callGemini(prompt, false);
  } catch (error) {
    const cleanC = concept.replace(/^[0-9]+\.\s*/, "").replace(/:\s*.*$/, "").trim();

    return `## Overview & Definition\nIn ${cleanT}, ${cleanC} is a foundational element that defines how components interact cleanly.\n\n` +
           `## Core Principle & Logic\nThe core logic behind ${cleanC} revolves around modularity and reducing technical overhead.\n\n` +
           `## Practical Real-World Example\nIn practical application, ${cleanC} is used in commercial systems to maintain code reliability.\n\n` +
           `## Quick Study Tip\nFocus on understanding the structural role of ${cleanC} before diving into complex implementation!`;
  }
}

async function askFollowUpQuestion(topic, question) {
  const cleanT = cleanTopic(topic);
  const prompt = `
Topic: "${cleanT}". Question: "${question}".

Return ONLY valid JSON:
{
  "answer": "Detailed 3-4 sentence answer explaining ${question} relative to ${cleanT}.",
  "additionalConcepts": ["Related Concept 1", "Related Concept 2"],
  "newFlashcards": [
    {
      "id": 101,
      "question": "Specific follow-up question about ${question}?",
      "answer": "Detailed answer explaining the concept."
    }
  ]
}
`;

  try {
    const rawText = await callGemini(prompt, true);
    return parseJSON(rawText);
  } catch (error) {
    return {
      answer: `${question} is a key aspect of ${cleanT}. It relies on structured logic and standard execution rules to produce predictable outcomes.`,
      additionalConcepts: [`${cleanT} Best Practices`, `Practical Scenarios`],
      newFlashcards: [
        {
          id: 101,
          question: `How does ${question} work in ${cleanT}?`,
          answer: `It provides targeted control over logic execution and simplifies system design.`
        }
      ]
    };
  }
}

module.exports = {
  generateStudyMaterial,
  generateAIModeContent,
  generateConceptDetail,
  askFollowUpQuestion
};