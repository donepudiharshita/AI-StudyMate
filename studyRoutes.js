const express = require("express");
const {
  generateStudyMaterial,
  generateAIModeContent,
  askFollowUpQuestion,
  generateConceptDetail
} = require("../services/aiService");

const router = express.Router();

/**
 * Helper function to safely ensure returned AI data is an object.
 */
const safeParseData = (aiResponse) => {
  if (typeof aiResponse === "object" && aiResponse !== null) {
    return aiResponse;
  }

  if (typeof aiResponse === "string") {
    const cleaned = aiResponse
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch (err) {
        // fall through
      }
    }

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      // fall through
    }
  }

  return {
    title: "Study Material",
    subject: "General Study",
    summary: "The AI response was completed successfully.",
    difficulty: "medium",
    estimatedMinutes: 30,
    keyConcepts: [],
    flashcards: [],
    quiz: []
  };
};

/**
 * POST /api/study/generate
 * Generates initial study material (Summary, Concepts, Flashcards, Quiz)
 */
router.post("/generate", async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

    // Validate topic presence
    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a study topic."
      });
    }

    const trimmedTopic = topic.trim();

    // Validate topic length
    if (trimmedTopic.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Topic must contain at least 2 characters."
      });
    }

    if (trimmedTopic.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Topic is too long. Please keep it under 500 characters."
      });
    }

    // Generate AI content via Gemini API in aiService
    const aiResponse = await generateStudyMaterial(
      trimmedTopic,
      difficulty || "medium"
    );

    // Ensure valid study object is returned to frontend
    const studyMaterial = safeParseData(aiResponse);

    return res.status(200).json({
      success: true,
      data: studyMaterial
    });
  } catch (error) {
    console.error("❌ Study Generation Error:", error.message || error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to generate study material. Please try again."
    });
  }
});

/**
 * POST /api/study/mode
 * Generates specialized mode explanations (ELI5, Step-by-Step, Real-World, Roadmap)
 */
router.post("/mode", async (req, res) => {
  try {
    const { topic, mode } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: "Topic is required."
      });
    }

    if (!mode) {
      return res.status(400).json({
        success: false,
        message: "Mode type is required."
      });
    }

    const modeContent = await generateAIModeContent(topic.trim(), mode);

    return res.status(200).json({
      success: true,
      data: modeContent
    });
  } catch (error) {
    console.error("❌ AI Mode Generation Error:", error.message || error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate mode content. Please try again."
    });
  }
});

/**
 * POST /api/study/concept-detail
 * Generates an elaborate explanation for a specific key concept clicked by the user
 */
router.post("/concept-detail", async (req, res) => {
  try {
    const { topic, concept } = req.body;

    // Validate concept presence
    if (!concept || !concept.trim()) {
      return res.status(400).json({
        success: false,
        message: "Specific key concept is required."
      });
    }

    // Fallback topic if not explicitly passed from frontend
    const studyTopic = (topic && topic.trim()) ? topic.trim() : "General Science & Tech";

    const detailContent = await generateConceptDetail(studyTopic, concept.trim());

    return res.status(200).json({
      success: true,
      data: detailContent,
      detail: detailContent,
      notes: detailContent
    });
  } catch (error) {
    console.error("❌ Concept Detail Error:", error.stack || error.message || error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate concept details. Please try again."
    });
  }
});

/**
 * POST /api/study/ask
 * Answers a follow-up question asked by the student
 */
router.post("/ask", async (req, res) => {
  try {
    const { topic, question } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: "Topic is required."
      });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a question."
      });
    }

    const aiAnswer = await askFollowUpQuestion(topic.trim(), question.trim());
    const parsedAnswer = safeParseData(aiAnswer);

    return res.status(200).json({
      success: true,
      data: parsedAnswer
    });
  } catch (error) {
    console.error("❌ Follow-up Question Error:", error.message || error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process your question. Please try again."
    });
  }
});

module.exports = router;