import React from "react";
import { computeStudentAnalytics } from "../utils/dashboardStorage";

export function StudentDashboard({ dashboardData = {}, onClose, onSelectTopic }) {
  // Extract history and streak safely from dashboardData
  const history = Array.isArray(dashboardData?.history) ? dashboardData.history : [];
  const currentStreak = dashboardData?.streak?.currentStreak || 0;

  // Compute analytics using your storage function
  const { totalSessions, avgScore, topicsMastered, weakTopics } = computeStudentAnalytics(history);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "1rem",
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--card-bg, #1e293b)",
          color: "var(--text-color, #f8fafc)",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "85vh",
          overflowY: "auto",
          borderRadius: "16px",
          padding: "1.75rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "1.5rem" }}>📊 Student Analytics Dashboard</h2>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", opacity: 0.8 }}>
              Track your progress, topic mastery, and weak areas
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "inherit",
              fontSize: "1.5rem",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            &times;
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              padding: "1rem",
              borderRadius: "12px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>📚</span>
            <h3 style={{ margin: "0.4rem 0 0 0", fontSize: "1.25rem" }}>{totalSessions}</h3>
            <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.8 }}>Sessions</p>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              padding: "1rem",
              borderRadius: "12px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🎯</span>
            <h3 style={{ margin: "0.4rem 0 0 0", fontSize: "1.25rem" }}>{avgScore}%</h3>
            <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.8 }}>Avg Accuracy</p>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              padding: "1rem",
              borderRadius: "12px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>⚡</span>
            <h3 style={{ margin: "0.4rem 0 0 0", fontSize: "1.25rem" }}>{currentStreak} Days</h3>
            <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.8 }}>Current Streak</p>
          </div>
        </div>

        {/* Mastered Topics Banner */}
        {topicsMastered.length > 0 && (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              padding: "1rem",
              borderRadius: "12px",
              marginBottom: "1rem",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "0.4rem", color: "#86efac" }}>
              🏆 Topics Mastered
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {topicsMastered.map((topic, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.2)",
                    color: "#86efac",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                  }}
                >
                  ✨ {topic.name} ({topic.score}%)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Review Area (Weak Topics) */}
        {weakTopics.length > 0 && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              padding: "1rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem", color: "#fca5a5" }}>
              ⚠️ Focus Areas Needed
            </div>
            <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", opacity: 0.9 }}>
              You scored low on these topics. Give them another try:
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {weakTopics.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectTopic(item.name)}
                  style={{
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  🔄 Retry {item.name} ({item.score}%)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity List */}
        <div>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem" }}>🕒 Recent History</h3>
          {history.length === 0 ? (
            <p style={{ opacity: 0.6, fontStyle: "italic", textAlign: "center", margin: "2rem 0" }}>
              No study sessions recorded yet. Start learning a topic to view your activity here!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {history.map((s) => (
                <div
                  key={s.id || Math.random()}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.85rem 1rem",
                    background: "rgba(255, 255, 255, 0.04)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem" }}>{s.topic}</strong>
                    <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                      Level: {s.difficulty} • Score: {s.score}/{s.totalQuestions} ({s.percentage}%) • {s.date}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectTopic(s.topic)}
                    style={{
                      backgroundColor: "#6366f1",
                      color: "#ffffff",
                      border: "none",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    Study ➔
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}