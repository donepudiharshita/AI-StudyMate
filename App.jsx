import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // Ensures KaTeX math renders with correct styles
import "./App.css";

// Phase 3 Imports
import { ThemeProvider, useTheme } from "./ThemeContext";
import { getDashboardData, recordStudySession } from "./utils/dashboardStorage";
import { StudentDashboard } from "./components/StudentDashboard";

function AppContent() {
  // ================= THEME & DASHBOARD STATE =================
  const { theme, toggleTheme } = useTheme();
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardData, setDashboardData] = useState(() => getDashboardData());

  // ================= BASIC STATE =================
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");

  const [studyData, setStudyData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= FLASHCARD STATE =================
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // ================= QUIZ STATE =================
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // ================= PHASE 2: AI MODES STATE =================
  const [activeMode, setActiveMode] = useState(null);
  const [modeContent, setModeContent] = useState("");
  const [loadingMode, setLoadingMode] = useState(false);

  // ================= CONCEPT DETAIL MODAL STATE =================
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [conceptDetail, setConceptDetail] = useState("");
  const [loadingConcept, setLoadingConcept] = useState(false);

  // ================= FOLLOW-UP QUESTION STATE =================
  const [userQuestion, setUserQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState([]);
  const [askingQuestion, setAskingQuestion] = useState(false);

  // ================= RACE CONDITION PROTECTION (REFS) =================
  const generateAbortRef = useRef(null);
  const modeAbortRef = useRef(null);
  const conceptAbortRef = useRef(null);
  const askAbortRef = useRef(null);

  // Clean up abort controllers on unmount
  useEffect(() => {
    return () => {
      if (generateAbortRef.current) generateAbortRef.current.abort();
      if (modeAbortRef.current) modeAbortRef.current.abort();
      if (conceptAbortRef.current) conceptAbortRef.current.abort();
      if (askAbortRef.current) askAbortRef.current.abort();
    };
  }, []);

  // Helper function to extract concept topic/title if string contains "Title: Description"
  const getConceptTitle = (concept) => {
    if (typeof concept === "string") {
      return concept.split(":")[0];
    }
    return concept?.title || concept;
  };

  // ================= GENERATE STUDY SESSION =================
  const generateStudySession = async (overrideTopic) => {
    const targetTopic = overrideTopic || topic;
    if (!targetTopic.trim()) {
      setError("Please enter a topic you want to learn.");
      return;
    }

    if (overrideTopic) {
      setTopic(overrideTopic);
    }

    if (generateAbortRef.current) {
      generateAbortRef.current.abort();
    }
    generateAbortRef.current = new AbortController();

    setLoading(true);
    setError("");
    setStudyData(null);

    // Reset Flashcards
    setCurrentFlashcard(0);
    setShowAnswer(false);

    // Reset Quiz
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);

    // Reset Phase 2 States
    setActiveMode(null);
    setModeContent("");
    setQaHistory([]);
    setUserQuestion("");

    // Reset Concept Modal State
    setSelectedConcept(null);
    setConceptDetail("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/study/generate",
        {
          topic: targetTopic.trim(),
          difficulty: difficulty,
        },
        { signal: generateAbortRef.current.signal }
      );

      if (response.data.success) {
        let generatedData = response.data.data;

        if (typeof generatedData === "string") {
          try {
            generatedData = JSON.parse(generatedData);
          } catch (e) {
            console.warn("Could not parse studyData JSON string:", e);
          }
        }

        setStudyData(generatedData);
      } else {
        setError(response.data.message || "Unable to generate study material.");
      }
    } catch (err) {
      if (axios.isCancel(err) || err.name === "CanceledError" || err.name === "AbortError") {
        console.log("Previous generation request aborted.");
        return;
      }
      console.error("Frontend Error:", err);
      setError(
        err.response?.data?.message ||
          "Something went wrong while generating your study session."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= PHASE 2: AI MODES FUNCTION =================
  const handleModeClick = async (modeKey) => {
    if (activeMode === modeKey) {
      setActiveMode(null);
      setModeContent("");
      return;
    }

    if (modeAbortRef.current) {
      modeAbortRef.current.abort();
    }
    modeAbortRef.current = new AbortController();

    setActiveMode(modeKey);
    setLoadingMode(true);
    setModeContent("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/study/mode",
        {
          topic: studyData?.title || topic,
          mode: modeKey,
        },
        { signal: modeAbortRef.current.signal }
      );

      if (response.data.success) {
        const resContent = response.data.data ?? response.data.content ?? response.data.message ?? "";
        const normalizedContent =
          typeof resContent === "string" ? resContent : JSON.stringify(resContent, null, 2);

        setModeContent(
          normalizedContent || "No mode content was returned. Please try again or select another mode."
        );
      } else {
        setModeContent(response.data.message || "Failed to generate mode content.");
      }
    } catch (err) {
      if (axios.isCancel(err) || err.name === "CanceledError" || err.name === "AbortError") {
        console.log("Previous mode request aborted.");
        return;
      }
      console.error("Mode API Error:", err);
      setModeContent("An error occurred while fetching content.");
    } finally {
      setLoadingMode(false);
    }
  };

  // ================= CONCEPT DETAIL HANDLERS =================
  const handleConceptClick = async (concept) => {
    if (conceptAbortRef.current) {
      conceptAbortRef.current.abort();
    }
    conceptAbortRef.current = new AbortController();

    setSelectedConcept(concept);
    setLoadingConcept(true);
    setConceptDetail("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/study/concept-detail",
        {
          topic: studyData?.title || topic,
          concept: concept,
        },
        { signal: conceptAbortRef.current.signal }
      );

      if (response.data.success) {
        const detail =
          response.data.data ||
          response.data.detail ||
          response.data.notes ||
          "No detailed explanation available.";

        setConceptDetail(typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
      } else {
        setConceptDetail("Unable to load detailed notes for this concept.");
      }
    } catch (err) {
      if (axios.isCancel(err) || err.name === "CanceledError" || err.name === "AbortError") {
        console.log("Previous concept request aborted.");
        return;
      }
      console.error("Error fetching concept detail:", err);
      setConceptDetail("Failed to load detailed notes. Please try again.");
    } finally {
      setLoadingConcept(false);
    }
  };

  const closeModal = () => {
    setSelectedConcept(null);
    setConceptDetail("");
  };

  // ================= FOLLOW-UP QUESTION HANDLER =================
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;

    if (askAbortRef.current) {
      askAbortRef.current.abort();
    }
    askAbortRef.current = new AbortController();

    const questionText = userQuestion.trim();

    // Reset input
    setUserQuestion("");
    setAskingQuestion(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/study/ask",
        {
          topic: studyData?.title || topic || "General Doubts",
          question: questionText,
        },
        { signal: askAbortRef.current.signal }
      );

      if (response.data.success) {
        const rawResponse = response.data.data;
        let answerText = "";
        let newConcepts = [];
        let newCards = [];

        if (typeof rawResponse === "object" && rawResponse !== null) {
          answerText = rawResponse.answer || JSON.stringify(rawResponse, null, 2);
          newConcepts = rawResponse.additionalConcepts || [];
          newCards = rawResponse.newFlashcards || [];
        } else if (typeof rawResponse === "string") {
          answerText = rawResponse;
        }

        // Add entry to Q&A history
        setQaHistory((prev) => [
          ...prev,
          {
            question: questionText,
            answer: answerText,
          },
        ]);

        // Refine active session if studyData exists
        if (studyData && (newConcepts.length > 0 || newCards.length > 0)) {
          setStudyData((prevData) => {
            if (!prevData) return prevData;

            const existingConcepts = prevData.keyConcepts || [];
            const existingFlashcards = prevData.flashcards || [];

            return {
              ...prevData,
              keyConcepts: [
                ...existingConcepts,
                ...newConcepts.filter((c) => !existingConcepts.includes(c)),
              ],
              flashcards: [
                ...existingFlashcards,
                ...newCards.map((fc, index) => ({
                  ...fc,
                  id: fc.id || existingFlashcards.length + index + 1,
                })),
              ],
            };
          });
        }
      }
    } catch (err) {
      if (axios.isCancel(err) || err.name === "CanceledError" || err.name === "AbortError") {
        console.log("Previous follow-up request aborted.");
        return;
      }
      console.error("Follow-up Question Error:", err);
      setQaHistory((prev) => [
        ...prev,
        {
          question: questionText,
          answer: "Sorry, I couldn't process your request. Please try again.",
        },
      ]);
    } finally {
      setAskingQuestion(false);
    }
  };

  // ================= FLASHCARD FUNCTIONS =================
  const nextFlashcard = () => {
    if (studyData && studyData.flashcards && currentFlashcard < studyData.flashcards.length - 1) {
      setCurrentFlashcard(currentFlashcard + 1);
      setShowAnswer(false);
    }
  };

  const previousFlashcard = () => {
    if (currentFlashcard > 0) {
      setCurrentFlashcard(currentFlashcard - 1);
      setShowAnswer(false);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  // ================= QUIZ FUNCTIONS =================
  const selectAnswer = (answer) => {
    if (!answerSubmitted) {
      setSelectedAnswer(answer);
    }
  };

  const submitAnswer = () => {
    if (!selectedAnswer) return;

    const currentQuiz = studyData?.quiz?.[currentQuestion];
    if (!currentQuiz) return;

    setAnswerSubmitted(true);

    if (selectedAnswer === currentQuiz.correctAnswer) {
      setScore((prevScore) => prevScore + 1);
    }
  };

  const nextQuestion = () => {
    if (studyData?.quiz && currentQuestion < studyData.quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
      setAnswerSubmitted(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);

    if (studyData) {
      const updatedDashboard = recordStudySession({
        topic: studyData.title || topic,
        subject: studyData.subject,
        difficulty: difficulty,
        score: score,
        totalQuestions: studyData.quiz?.length || 0,
      });
      setDashboardData(updatedDashboard);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  // ================= RENDER =================
  return (
    <div className={`app ${theme}`}>
      {/* Dynamic Animated Background Shapes */}
      <div className="bg-shape bg-shape-1"></div>
      <div className="bg-shape bg-shape-2"></div>
      <div className="bg-shape bg-shape-3"></div>

      {/* ================= NAVBAR ================= */}
      <header className="navbar">
        <div className="logo">
          <span className="logo-icon">🧠</span>
          <span>AI StudyMate</span>
        </div>
        <div className="navbar-controls">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
          <button className="theme-toggle-btn dashboard-btn" onClick={() => setShowDashboard(true)}>
            📊 Dashboard
          </button>
        </div>
      </header>

      {/* ================= STUDENT DASHBOARD MODAL ================= */}
      {showDashboard && (
        <StudentDashboard
          dashboardData={dashboardData}
          onClose={() => setShowDashboard(false)}
          onSelectTopic={(selectedTopic) => {
            setShowDashboard(false);
            generateStudySession(selectedTopic);
          }}
        />
      )}

      {/* ================= MAIN ================= */}
      <main>
        {/* ================= HERO SECTION ================= */}
        <section className="hero">
          <div className="hero-content">
            <div className="badge">✨ AI-Powered Personalized Learning</div>
            <h1>
              What do you want
              <span> to learn today?</span>
            </h1>
            <p>
              Ask anything. Learn everything. Your personal AI tutor creates a customized
              study session for you.
            </p>
          </div>

          {/* ================= INPUT CARD ================= */}
          <div className="study-input-card">
            <label>Enter a topic</label>
            <div className="topic-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="e.g. DBMS Normalization, Quantum Computing, Calculus..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") generateStudySession();
                }}
              />
            </div>

            {/* ================= DIFFICULTY ================= */}
            <label className="difficulty-label">Choose your learning level</label>
            <div className="difficulty-buttons">
              <button
                className={difficulty === "beginner" ? "difficulty active" : "difficulty"}
                onClick={() => setDifficulty("beginner")}
              >
                🌱 <span>Beginner</span>
              </button>
              <button
                className={difficulty === "medium" ? "difficulty active" : "difficulty"}
                onClick={() => setDifficulty("medium")}
              >
                🚀 <span>Intermediate</span>
              </button>
              <button
                className={difficulty === "hard" ? "difficulty active" : "difficulty"}
                onClick={() => setDifficulty("hard")}
              >
                🧠 <span>Advanced</span>
              </button>
            </div>

            {/* ================= ERROR ================= */}
            {error && <div className="error-message">⚠️ {error}</div>}

            {/* ================= GENERATE BUTTON ================= */}
            <button
              className="generate-button"
              onClick={() => generateStudySession()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Creating your study session...
                </>
              ) : (
                <>✨ Generate Study Session</>
              )}
            </button>
          </div>
        </section>

        {/* ================= LOADING ================= */}
        {loading && (
          <section className="loading-section">
            <div className="loading-card">
              <div className="loading-icon">🧠</div>
              <h2>Your AI tutor is preparing your lesson...</h2>
              <p>Understanding your topic and creating personalized study material.</p>
            </div>
          </section>
        )}

        {/* ================= STUDY CONTENT ================= */}
        {studyData && !loading && (
          <section className="study-section">
            {/* ================= STUDY HEADER ================= */}
            <div className="study-header">
              <div className="success-badge">✨ Study Session Ready</div>
              <h2>{studyData.title}</h2>
              <div className="study-meta">
                <span>📚 {studyData.subject || "General Study"}</span>
                <span>🎯 {studyData.difficulty || difficulty}</span>
                <span>⏱️ {studyData.estimatedMinutes || 15} minutes</span>
              </div>
            </div>

            {/* ================= SUMMARY ================= */}
            <div className="content-card">
              <div className="card-title">📖 Quick Explanation</div>
              <div className="summary">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {studyData.summary || ""}
                </ReactMarkdown>
              </div>
            </div>

            {/* ================= PHASE 2: AI LEARNING MODES ================= */}
            <div className="content-card">
              <div className="card-title">⚡ AI Learning Modes</div>
              <p className="card-subtitle">
                Select a specialized mode to explore this topic from different perspectives:
              </p>
              <div className="mode-buttons-grid">
                <button
                  className={`mode-btn ${activeMode === "eli5" ? "active" : ""}`}
                  onClick={() => handleModeClick("eli5")}
                >
                  👶 Explain Like I'm 5
                </button>
                <button
                  className={`mode-btn ${activeMode === "stepByStep" ? "active" : ""}`}
                  onClick={() => handleModeClick("stepByStep")}
                >
                  🪜 Step-by-Step
                </button>
                <button
                  className={`mode-btn ${activeMode === "realWorld" ? "active" : ""}`}
                  onClick={() => handleModeClick("realWorld")}
                >
                  🌐 Real-World Example
                </button>
                <button
                  className={`mode-btn ${activeMode === "roadmap" ? "active" : ""}`}
                  onClick={() => handleModeClick("roadmap")}
                >
                  🗺️ 4-Week Roadmap
                </button>
              </div>

              {loadingMode && (
                <div className="mode-loading">
                  <span className="spinner"></span> Generating mode content...
                </div>
              )}

              {modeContent && !loadingMode && (
                <div className="mode-content-box">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {modeContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* ================= KEY CONCEPTS ================= */}
            <div className="content-card">
              <div className="card-title">💡 Key Concepts (Click to explore)</div>
              <div className="concept-list">
                {studyData.keyConcepts?.map((concept, index) => (
                  <div
                    className="concept clickable"
                    key={index}
                    onClick={() => handleConceptClick(concept)}
                  >
                    <span>{index + 1}</span>
                    {getConceptTitle(concept)}
                  </div>
                ))}
              </div>
            </div>

            {/* ================= CONCEPT DETAIL MODAL ================= */}
            {selectedConcept && (
              <div className="modal-overlay" onClick={closeModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="modal-close" onClick={closeModal}>
                    &times;
                  </button>
                  <h2>{getConceptTitle(selectedConcept)}</h2>
                  <p className="modal-subtitle">Detailed Notes • {studyData.title}</p>

                  {loadingConcept ? (
                    <div className="modal-loading">
                      <span className="spinner"></span> Generating detailed explanation...
                    </div>
                  ) : (
                    <div className="concept-detail-body">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {conceptDetail}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= INTERACTIVE FLASHCARDS ================= */}
            <div className="content-card">
              <div className="card-title">🃏 Interactive Flashcards</div>
              <div className="flashcard-progress">
                Card {currentFlashcard + 1} of {studyData.flashcards?.length || 0}
              </div>

              {studyData.flashcards && studyData.flashcards.length > 0 && (
                <>
                  <div className="interactive-flashcard">
                    <div className="flashcard-number">FLASHCARD {currentFlashcard + 1}</div>
                    <h3>{studyData.flashcards[currentFlashcard]?.question}</h3>

                    {showAnswer && (
                      <div className="flashcard-answer revealed">
                        <div className="answer-label">💡 Answer</div>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {studyData.flashcards[currentFlashcard]?.answer || ""}
                        </ReactMarkdown>
                      </div>
                    )}

                    {!showAnswer && (
                      <button className="reveal-button" onClick={toggleAnswer}>
                        👀 Show Answer
                      </button>
                    )}
                  </div>

                  <div className="flashcard-controls">
                    <button
                      className="secondary-button"
                      onClick={previousFlashcard}
                      disabled={currentFlashcard === 0}
                    >
                      ← Previous
                    </button>
                    <button
                      className="primary-button"
                      onClick={nextFlashcard}
                      disabled={currentFlashcard === studyData.flashcards.length - 1}
                    >
                      Next →
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ================= INTERACTIVE QUIZ ================= */}
            <div className="content-card">
              <div className="card-title">📝 Test Your Knowledge</div>

              {!quizFinished ? (
                <div className="interactive-quiz">
                  <div className="quiz-progress">
                    Question {currentQuestion + 1} of {studyData.quiz?.length || 0}
                  </div>

                  {studyData.quiz && studyData.quiz.length > 0 && (
                    <>
                      <h3 className="quiz-main-question">
                        {studyData.quiz[currentQuestion]?.question}
                      </h3>

                      <div className="interactive-options">
                        {studyData.quiz[currentQuestion]?.options?.map((option, index) => {
                          const currentQuiz = studyData.quiz[currentQuestion];
                          const isSelected = selectedAnswer === option;
                          const isCorrect = option === currentQuiz?.correctAnswer;

                          let optionClass = "interactive-option";
                          if (answerSubmitted && isCorrect) optionClass += " correct";
                          else if (answerSubmitted && isSelected && !isCorrect)
                            optionClass += " incorrect";
                          else if (isSelected) optionClass += " selected";

                          return (
                            <button
                              key={index}
                              className={optionClass}
                              onClick={() => selectAnswer(option)}
                              disabled={answerSubmitted}
                            >
                              <span className="option-letter">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span>{option}</span>
                            </button>
                          );
                        })}
                      </div>

                      {answerSubmitted && (
                        <div
                          className={
                            selectedAnswer === studyData.quiz[currentQuestion]?.correctAnswer
                              ? "answer-feedback correct-feedback"
                              : "answer-feedback incorrect-feedback"
                          }
                        >
                          <strong>
                            {selectedAnswer === studyData.quiz[currentQuestion]?.correctAnswer
                              ? "🎉 Correct!"
                              : "❌ Not quite!"}
                          </strong>
                          <p>
                            <strong>Correct Answer:</strong>{" "}
                            {studyData.quiz[currentQuestion]?.correctAnswer}
                          </p>
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {studyData.quiz[currentQuestion]?.explanation || ""}
                          </ReactMarkdown>
                        </div>
                      )}

                      <div className="quiz-controls">
                        {!answerSubmitted ? (
                          <button
                            className="primary-button"
                            onClick={submitAnswer}
                            disabled={!selectedAnswer}
                          >
                            Submit Answer
                          </button>
                        ) : (
                          <button className="primary-button" onClick={nextQuestion}>
                            {currentQuestion === studyData.quiz.length - 1
                              ? "Finish Quiz"
                              : "Next Question →"}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* ================= QUIZ RESULT ================= */
                <div className="quiz-result">
                  <div className="result-icon">🏆</div>
                  <h2>Quiz Complete!</h2>
                  <div className="score-circle">
                    <strong>{score}</strong>
                    <span>/ {studyData.quiz.length}</span>
                  </div>
                  <p className="score-percentage">
                    {Math.round((score / studyData.quiz.length) * 100)}% Score
                  </p>
                  <p className="performance-message">
                    {score >= (studyData.quiz.length * 0.8)
                      ? "Excellent work! You have a strong understanding of this topic. 🎉"
                      : score >= (studyData.quiz.length * 0.5)
                      ? "Good job! You understand the basics. Review the concepts you missed and try again."
                      : "Keep practicing! Review the study material and take the quiz again."}
                  </p>
                  <button className="primary-button" onClick={restartQuiz}>
                    🔄 Retake Quiz
                  </button>
                </div>
              )}
            </div>

            {/* ================= ASK AI TUTOR (WITHOUT FILE UPLOAD) ================= */}
            <div className="content-card">
              <div className="card-title">💬 Ask AI Tutor a Follow-up Question</div>
              <p className="card-subtitle">
                Have doubts or need clarification on {studyData.title}?
              </p>

              {/* QA History Display */}
              {qaHistory.length > 0 && (
                <div className="qa-history">
                  {qaHistory.map((item, idx) => (
                    <div key={idx} className="qa-item">
                      <div className="qa-question">
                        <strong>❓ You:</strong> {item.question}
                      </div>
                      <div className="qa-answer">
                        <strong>🤖 AI Tutor:</strong>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {item.answer}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Input without File Upload */}
              <form onSubmit={handleAskQuestion} className="ask-form-container">
                <div className="ask-input-row">
                  <input
                    type="text"
                    placeholder="Ask a question or request clarification..."
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    disabled={askingQuestion}
                  />

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={askingQuestion || !userQuestion.trim()}
                  >
                    {askingQuestion ? "Thinking..." : "Ask"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </main>

      {/* ================= FOOTER ================= */}
      <footer>
        <p>🧠 AI StudyMate — Your intelligent learning companion</p>
      </footer>
    </div>
  );
}

// Wrapper export providing ThemeProvider context
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}