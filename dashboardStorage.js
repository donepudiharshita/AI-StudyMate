const STORAGE_KEY = "studymate_dashboard_data";

// Retrieve or initialize user dashboard metrics safely
export function getDashboardData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        history: Array.isArray(parsed?.history) ? parsed.history : [],
        streak: {
          currentStreak: parsed?.streak?.currentStreak || 0,
          lastStudyDate: parsed?.streak?.lastStudyDate || null,
        },
      };
    }
  } catch (e) {
    console.error("Failed to parse dashboard data:", e);
  }

  return {
    history: [],
    streak: {
      currentStreak: 0,
      lastStudyDate: null,
    },
  };
}

// Save session, score, streak, and update weak/mastered topic metrics
export function recordStudySession({ topic, subject, difficulty, score, totalQuestions }) {
  const dashboard = getDashboardData();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Calculate percentage
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  // 1. Record session entry
  const sessionEntry = {
    id: Date.now(),
    topic: topic || "General Study",
    subject: subject || topic || "General",
    difficulty: difficulty || "beginner",
    score: score || 0,
    totalQuestions: totalQuestions || 0,
    percentage,
    date: now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    timestamp: now.getTime(),
  };

  dashboard.history.unshift(sessionEntry);

  // 2. Update Streak logic
  const lastDateStr = dashboard.streak.lastStudyDate;
  if (!lastDateStr) {
    dashboard.streak.currentStreak = 1;
    dashboard.streak.lastStudyDate = todayStr;
  } else if (lastDateStr !== todayStr) {
    const lastDate = new Date(lastDateStr);
    const currentDate = new Date(todayStr);
    const diffTime = Math.abs(currentDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      dashboard.streak.currentStreak += 1;
    } else if (diffDays > 1) {
      dashboard.streak.currentStreak = 1;
    }
    dashboard.streak.lastStudyDate = todayStr;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboard));
  } catch (err) {
    console.error("Failed to save session to localStorage:", err);
  }

  return dashboard;
}

// Compute aggregate metrics (Topics Mastered, Weak Topics, Scores)
export function computeStudentAnalytics(history) {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return {
      totalSessions: 0,
      avgScore: 0,
      topicsMastered: [],
      weakTopics: [],
    };
  }

  const topicMap = {};

  history.forEach((session) => {
    if (!session?.topic) return;
    const topicKey = session.topic.trim().toLowerCase();
    if (!topicMap[topicKey]) {
      topicMap[topicKey] = {
        name: session.topic,
        totalPercentage: 0,
        count: 0,
      };
    }
    topicMap[topicKey].totalPercentage += session.percentage || 0;
    topicMap[topicKey].count += 1;
  });

  const topicsMastered = [];
  const weakTopics = [];
  let totalScoreSum = 0;
  const topicKeys = Object.keys(topicMap);

  topicKeys.forEach((key) => {
    const item = topicMap[key];
    const avg = Math.round(item.totalPercentage / item.count);
    totalScoreSum += avg;

    if (avg >= 75) {
      topicsMastered.push({ name: item.name, score: avg });
    } else if (avg < 60) {
      weakTopics.push({ name: item.name, score: avg });
    }
  });

  return {
    totalSessions: history.length,
    avgScore: topicKeys.length > 0 ? Math.round(totalScoreSum / topicKeys.length) : 0,
    topicsMastered,
    weakTopics,
  };
}