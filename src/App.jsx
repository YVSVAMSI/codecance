import { useState, useEffect, useMemo, useCallback } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import {
  LayoutDashboard, ListChecks, GitBranch, RotateCcw, BarChart2,
  Settings as SettingsIcon, Search, X, ChevronRight, ChevronDown, Clock,
  AlertTriangle, Download, Upload, Trash2, Edit3, ExternalLink, Menu, Flame,
  CheckCircle2, Circle, MinusCircle, Calendar, Link2, Save, LogOut, Target, Check, Shuffle, ChevronLeft, ArrowRight, FileText, Activity
} from "lucide-react";

/* ============================== DESIGN TOKENS ============================== */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Source+Serif+4:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
    :root{
      --bg:#faf6ef; --surface:#ffffff; --surface2:#f4ecdf; --border:#e6d8c3;
      --border-hi:#d3bd9c; --text:#3a2f22; --muted:#8a7358; --muted2:#b8a488;
      --accent:#a97a4b; --accent-dim:#f0e2c9; --indigo:#8a6a4a;
      --green:#5c7a4e; --green-dim:#e7efdf; --yellow:#a97a1f; --yellow-dim:#f6ecd3;
      --red:#a34a3f; --red-dim:#f6e2de;
    }
    .dsa-root{ background:var(--bg); color:var(--text); font-family:'Inter',sans-serif; min-height:100vh; }
    .mono{ font-family:'JetBrains Mono',monospace; }
    .dsa-root h1{ font-family:'Source Serif 4',serif; letter-spacing:-0.01em; }
    .dsa-root ::selection{ background:var(--accent-dim); color:var(--accent); }
    .scrollbar-thin::-webkit-scrollbar{ width:8px; height:8px; }
    .scrollbar-thin::-webkit-scrollbar-thumb{ background:var(--border-hi); border-radius:8px; }
    .scrollbar-thin::-webkit-scrollbar-track{ background:transparent; }
    .card{ background:var(--surface); border:1px solid var(--border); border-radius:12px; box-shadow:0 1px 2px rgba(58,47,34,0.04); }
    .card:hover{ border-color:var(--border-hi); }
    .btn-primary{ background:var(--accent); color:#fff8ee; font-weight:700; }
    .btn-primary:hover{ filter:brightness(1.06); }
    .btn-ghost{ background:var(--surface2); border:1px solid var(--border); color:var(--text); }
    .btn-ghost:hover{ border-color:var(--border-hi); }
    input,select,textarea{ background:var(--surface); border:1px solid var(--border); color:var(--text); border-radius:8px; }
    input:focus,select:focus,textarea:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-dim); }
    input::placeholder,textarea::placeholder{ color:var(--muted2); }
    .lc-select{ appearance:none; -webkit-appearance:none; background-color:var(--surface); color:var(--text);
      border:1px solid var(--border); border-radius:8px; padding:7px 34px 7px 12px; font-size:12px; font-weight:600;
      line-height:1.2; cursor:pointer;
      background-image:url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2377787a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat:no-repeat; background-position:right 10px center; }
    .lc-select:hover{ border-color:var(--muted2); }
    .lc-select:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-dim); }
    .lc-search{ background-color:var(--surface); border:1px solid var(--border); border-radius:8px;
      transition:border-color .15s ease, box-shadow .15s ease; }
    .lc-search:focus-within{ border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-dim); }
    .badge-green{ background:var(--green-dim); color:var(--green); border:1px solid #cddcc0; }
    .badge-yellow{ background:var(--yellow-dim); color:var(--yellow); border:1px solid #e6d3a3; }
    .badge-red{ background:var(--red-dim); color:var(--red); border:1px solid #e3c1ba; }
    .badge-neutral{ background:var(--surface2); color:var(--muted); border:1px solid var(--border); }
    .prog-track{ background:var(--surface2); border-radius:99px; overflow:hidden; }
    .prog-fill{ height:100%; border-radius:99px; transition:width .4s ease; }
    .sidebar-item{ color:var(--muted); border-radius:8px; }
    .sidebar-item:hover{ background:var(--surface2); color:var(--text); }
    .sidebar-item.active{ background:var(--accent-dim); color:var(--accent); }
    .fade-in{ animation:fadeIn .25s ease; }
    @keyframes fadeIn{ from{opacity:0; transform:translateY(4px);} to{opacity:1; transform:none;} }
    .path-crumb{ color:var(--muted); }
    .path-crumb b{ color:var(--text); }
  `}</style>
);

const DEFAULT_SETTINGS = {
  greenIntervals: [7,14,30,60],
  yellowIntervals: [3,7,14,30],
  redIntervals: [1,3,7,14],
  growthFactor: 1.6,
  masteryMinQuestions: 3,
  masteryGreenPct: 0.7,
  weakYellowPct: 0.4,
};

const DIFFICULTIES = ["Easy","Medium","Hard"];
const STATUSES = ["Solved","Attempted","Bookmarked"];
const CONFIDENCES = ["Green","Yellow","Red"];

/* ============================== STRING HELPERS ============================== */
function normalizePatternString(str){
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/* ============================== DATE HELPERS ============================== */
function localToday(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function toUTC(dateStr){ const [y,m,d] = dateStr.split('-').map(Number); return Date.UTC(y,m-1,d); }
function addDaysToDateStr(dateStr, days){
  const t = toUTC(dateStr) + days*86400000;
  const nd = new Date(t);
  return `${nd.getUTCFullYear()}-${String(nd.getUTCMonth()+1).padStart(2,'0')}-${String(nd.getUTCDate()).padStart(2,'0')}`;
}
function daysBetween(a,b){ return Math.round((toUTC(b)-toUTC(a))/86400000); }
function fmtDate(dateStr){
  if(!dateStr) return "Not set";
  const [y,m,d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y,m-1,d)).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
}

/* ============================== REVISION ENGINE ============================== */
function calculateNextRevision(confidence, revisionCount, baseDateStr, settings){
  const intervals = settings[`${confidence.toLowerCase()}Intervals`] || [7,14,30];
  let days;
  if (revisionCount < intervals.length) days = intervals[revisionCount];
  else {
    const last = intervals[intervals.length-1];
    const extra = revisionCount - intervals.length + 1;
    days = Math.round(last * Math.pow(settings.growthFactor||1.5, extra));
  }
  return addDaysToDateStr(baseDateStr, days);
}

/* ============================== STATS ENGINE ============================== */
function patternStatus(stats, settings){
  if (stats.total === 0) return "Not Started";
  if (stats.completed === 0) return "Not Started";
  if (stats.completed < stats.total) return "Practicing";
  const greenPct = stats.green / stats.total;
  if (stats.total >= (settings?.masteryMinQuestions || 3) && greenPct >= (settings?.masteryGreenPct || 0.7) && stats.red === 0) return "Mastered";
  return "Solved";
}

function calcPatternStats(pattern, questions, phProblems = [], settings){
  const normP = normalizePatternString(pattern.name);
  const phForPattern = (phProblems || []).filter(prob => {
    if (!normP) return false;
    const normProbPat = normalizePatternString(prob.patternName);
    const normTitle = normalizePatternString(prob.title);
    return normProbPat === normP ||
           prob.patternName === pattern.name ||
           (normP.length >= 4 && normProbPat.includes(normP)) ||
           (normP.length >= 4 && normTitle.includes(normP));
  });

  const qsForPattern = questions.filter(q => q.patternId === pattern.id);
  const total = pattern.phCount !== undefined ? pattern.phCount : Math.max(phForPattern.length, qsForPattern.length);

  const solvedQs = qsForPattern.filter(q => q.status === "Solved");
  const completed = solvedQs.length;

  const green = solvedQs.filter(q => q.confidence === "Green").length;
  const yellow = solvedQs.filter(q => q.confidence === "Yellow").length;
  const red = solvedQs.filter(q => q.confidence === "Red").length;
  const hintCount = solvedQs.filter(q => q.neededHint).length;

  const recCorrect = qsForPattern.filter(q => q.recognitionCorrect === true).length;
  const recTotal = qsForPattern.filter(q => q.recognitionCorrect != null).length;
  const recAccuracy = recTotal > 0 ? Math.round((recCorrect / recTotal) * 100) : null;

  const stats = { total, completed, green, yellow, red, hintCount, recCorrect, recTotal, recAccuracy };
  const status = patternStatus(stats, settings);
  const weak = completed > 0 && (red > 0 || (yellow / Math.max(1, completed)) >= (settings?.weakYellowPct ?? 0.4));

  let lastActivity = solvedQs.reduce((max,q)=> (q.lastSolvedAt && (!max || q.lastSolvedAt > max)) ? q.lastSolvedAt : max, null);
  let nextRevision = solvedQs.reduce((min,q)=> (q.nextRevision && (!min || q.nextRevision < min)) ? q.nextRevision : min, null);

  let reportText = "○ Not started — Add custom questions or practice in Pattern Hunt.";
  let reportTone = "neutral";

  if (completed > 0) {
    if (status === "Mastered") {
      reportText = `✓ Mastered (${green}/${total} Green, 0 Red). High confidence.`;
      reportTone = "green";
    } else if (red > 0) {
      reportText = `⚠️ ${red} Red question(s) need review. ${hintCount > 0 ? hintCount + ' hint(s) used.' : ''}`;
      reportTone = "red";
    } else if (yellow > 0) {
      reportText = `⚡ ${yellow} Yellow question(s). ${recAccuracy != null ? recAccuracy + '% recognition accuracy.' : 'Needs practice.'}`;
      reportTone = "yellow";
    } else {
      reportText = `✓ ${completed}/${total} Solved. ${recAccuracy != null ? recAccuracy + '% pattern accuracy.' : ''}`;
      reportTone = "green";
    }
  } else if (total > 0) {
    reportText = `○ Not started — ${total} classified problem(s) ready in Pattern Hunt.`;
    reportTone = "neutral";
  }

  return {
    ...stats, status, weak, lastActivity, nextRevision,
    progress: total ? Math.round((completed / total) * 100) : 0,
    questions: qsForPattern, reportText, reportTone, phProblems: phForPattern
  };
}

function calcTopicStats(topic, patterns, questions, phProblems = [], settings){
  const pats = patterns.filter(p => p.topicId === topic.id);
  const patStats = pats.map(p => ({ pattern: p, stats: calcPatternStats(p, questions, phProblems, settings) }));
  const totalPatterns = pats.length;
  const covered = patStats.filter(p => p.stats.total > 0 && p.stats.completed >= p.stats.total).length;
  const totalQuestions = patStats.reduce((s,p)=>s+p.stats.total,0);
  const completedQuestions = patStats.reduce((s,p)=>s+p.stats.completed,0);
  return {
    totalPatterns, covered, remaining: totalPatterns-covered,
    coverage: totalPatterns ? Math.round((covered / totalPatterns) * 100) : 0,
    totalQuestions, completedQuestions,
    progress: totalQuestions ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
    patStats
  };
}

function calcOverall(topics, patterns, questions, phProblems = [], settings){
  const topicStats = topics.map(t => ({ topic: t, stats: calcTopicStats(t, patterns, questions, phProblems, settings) }));
  const totalPatterns = patterns.length;
  const covered = topicStats.reduce((s,t)=>s+t.stats.covered,0);
  const totalQuestions = topicStats.reduce((s,t)=>s+t.stats.totalQuestions,0);
  const completedQuestions = topicStats.reduce((s,t)=>s+t.stats.completedQuestions,0);
  const today = localToday();
  const withRevision = questions.filter(q=>q.nextRevision);
  const overdue = withRevision.filter(q=>q.nextRevision < today).length;
  const dueToday = withRevision.filter(q=>q.nextRevision === today).length;
  const upcoming = withRevision.filter(q=>q.nextRevision > today).length;
  const green = questions.filter(q=>q.status === "Solved" && q.confidence === "Green").length;
  const yellow = questions.filter(q=>q.status === "Solved" && q.confidence === "Yellow").length;
  const red = questions.filter(q=>q.status === "Solved" && q.confidence === "Red").length;
  return {
    topicStats, totalPatterns, covered, remaining: totalPatterns-covered,
    coverage: totalPatterns ? Math.round((covered / totalPatterns) * 100) : 0,
    totalQuestions, completedQuestions, remainingQuestions: Math.max(0, totalQuestions-completedQuestions),
    progress: totalQuestions ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
    overdue, dueToday, upcoming, green, yellow, red
  };
}

function getWeakPatterns(patterns, questions, settings, limit=5){
  return patterns.map(p => ({ pattern: p, stats: calcPatternStats(p, questions, [], settings) }))
    .filter(p => p.stats.total > 0 && (p.stats.red > 0 || p.stats.yellow >= p.stats.total/2))
    .sort((a,b)=> (b.stats.red - a.stats.red) || (b.stats.yellow - a.stats.yellow))
    .slice(0, limit);
}
function getMasteredPatterns(patterns, questions, settings){
  return patterns.map(p => ({ pattern: p, stats: calcPatternStats(p, questions, [], settings) }))
    .filter(p => p.stats.status === "Mastered");
}
function revisionPriority(q){
  const today = localToday();
  let score = 0;
  if (q.nextRevision < today) score += 30 + Math.min(daysBetween(q.nextRevision, today), 30);
  else if (q.nextRevision === today) score += 20;
  else score += 0;
  if (q.confidence === "Red") score += 12;
  else if (q.confidence === "Yellow") score += 6;
  if (q.neededHint) score += 3;
  return score;
}

function calcRevisionStreak(revisions){
  const dates = [...new Set((revisions || []).map(r => r.actualRevisionDate))];
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let cursor = localToday();
  if (!set.has(cursor)) cursor = addDaysToDateStr(cursor, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = addDaysToDateStr(cursor, -1);
  }
  return streak;
}

/* ============================== API & BACKEND AUTH HOOK ============================== */
async function safeJson(res) {
  try {
    const text = await res.text();
    if (!text || !text.trim()) return {};
    return JSON.parse(text);
  } catch (err) {
    return {};
  }
}

function useApiTracker() {
  const [token, setToken] = useState(true);
  const [user, setUser] = useState(null);
  const [topics, setTopics] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [phProblems, setPhProblems] = useState([]);
  const [weakSpots, setWeakSpots] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    const res = await fetch(url, { ...options, headers, credentials: "include" });
    if (res.status === 401) {
      setToken(false);
      setUser(null);
      throw new Error("Unauthorized");
    }
    return res;
  }, []);

  const loadData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const meRes = await authFetch("/api/auth/me");
      if (!meRes.ok) {
        setToken(false);
        setUser(null);
        setLoading(false);
        return;
      }
      const meData = await safeJson(meRes);
      setUser(meData.user);

      const dataRes = await authFetch("/api/data");
      if (!dataRes.ok) throw new Error("Failed to fetch tracker data");
      const data = await safeJson(dataRes);

      setTopics(data.topics || []);
      setPatterns(data.patterns || []);
      setQuestions(data.questions || []);
      setRevisions(data.revisions || []);
      setSettings(data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS);

      const phRes = await authFetch("/api/pattern-hunt");
      if (phRes.ok) {
        const phData = await safeJson(phRes);
        setPhProblems(phData.problems || []);
        setWeakSpots(phData.weakSpots || []);
      }

      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, authFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const login = async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await safeJson(res);
    if (!res.ok) {
      const e = new Error(data.error || "Login failed");
      if (data.needsVerification) { e.needsVerification = true; e.email = data.email; }
      throw e;
    }
    setToken(true);
    setUser(data.user);
    return data;
  };

  const signup = async (email, password, name = "") => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, name }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Signup failed");
    // Account is pending verification — do NOT auto-log-in.
    return data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, otp }),
    });
    const data = await safeJson(res);
    if (!res.ok) {
      const e = new Error(data.error || "Verification failed");
      if (data.needsResend) { e.needsResend = true; e.email = email; }
      throw e;
    }
    setToken(true);
    setUser(data.user);
    return data;
  };

  const resendOtp = async (email) => {
    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Could not resend the code");
    return data;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) { /* cookie cleared server-side regardless */ }
    setToken(false);
    setUser(null);
    setTopics([]);
    setPatterns([]);
    setQuestions([]);
    setRevisions([]);
    setPhProblems([]);
  };

  const updateQuestion = async (id, qData) => {
    const existing = questions.find((q) => q.id === id);
    const solveDate = qData.lastSolvedAt || localToday();
    let nextRevision = existing ? existing.nextRevision : null;
    if (existing && existing.revisionCount === 0 && qData.confidence) {
      nextRevision = calculateNextRevision(qData.confidence, 0, solveDate, settings);
    }
    const res = await authFetch(`/api/questions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...qData, lastSolvedAt: solveDate, nextRevision }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to update question");
    setQuestions((prev) => prev.map((q) => (q.id === id ? data.question : q)));
    if (data.patterns) setPatterns(data.patterns);
  };

  const deleteQuestion = async (id) => {
    const res = await authFetch(`/api/questions/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete question");
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setRevisions((prev) => prev.filter((r) => r.questionId !== id));
  };

  const submitRevision = async (question, actualDate, confidence) => {
    const revDate = actualDate || localToday();
    const newCount = question.revisionCount + 1;
    const baseForPrev = question.lastRevisedAt || question.lastSolvedAt || revDate;
    const previousIntervalDays = daysBetween(baseForPrev, revDate);
    const nextRevision = calculateNextRevision(confidence, newCount, revDate, settings);
    const nextIntervalDays = daysBetween(revDate, nextRevision);

    const res = await authFetch("/api/revisions", {
      method: "POST",
      body: JSON.stringify({
        questionId: question.id,
        actualRevisionDate: revDate,
        confidence,
        result: confidence === "Red" ? "Struggled" : "Solved",
        previousIntervalDays,
        nextIntervalDays,
        nextRevision,
      }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to submit revision");
    setRevisions((prev) => [data.revision, ...prev]);
    setQuestions((prev) => prev.map((q) => (q.id === question.id ? data.question : q)));
  };

  const submitPatternHuntAttempt = async (subData) => {
    const solveDate = subData.lastSolvedAt || localToday();
    const res = await authFetch("/api/pattern-hunt/submit", {
      method: "POST",
      body: JSON.stringify({ ...subData, lastSolvedAt: solveDate }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to submit pattern hunt attempt");

    if (data.questions) setQuestions(data.questions);
    if (data.patterns) setPatterns(data.patterns);

    const phRes = await authFetch("/api/pattern-hunt");
    if (phRes.ok) {
      const phData = await safeJson(phRes);
      setPhProblems(phData.problems || []);
      setWeakSpots(phData.weakSpots || []);
    }

    return data;
  };

  const addTopic = async (name) => {
    const res = await authFetch("/api/topics", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to add topic");
    setTopics((prev) => [...prev, data.topic]);
  };

  const deleteTopic = async (id) => {
    const res = await authFetch(`/api/topics/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete topic");
    const patIds = patterns.filter((p) => p.topicId === id).map((p) => p.id);
    setTopics((prev) => prev.filter((t) => t.id !== id));
    setPatterns((prev) => prev.filter((p) => p.topicId !== id));
    setQuestions((prev) => prev.filter((q) => !patIds.includes(q.patternId)));
  };

  const addPattern = async (topicId, name) => {
    const res = await authFetch("/api/patterns", {
      method: "POST",
      body: JSON.stringify({ topicId, name }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to add pattern");
    setPatterns((prev) => [...prev, data.pattern]);
  };

  const deletePattern = async (id) => {
    const res = await authFetch(`/api/patterns/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete pattern");
    setPatterns((prev) => prev.filter((p) => p.id !== id));
    setQuestions((prev) => prev.filter((q) => q.patternId !== id));
  };

  const persistSettings = async (newSettings) => {
    const res = await authFetch("/api/settings", {
      method: "PUT",
      body: JSON.stringify(newSettings),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to save settings");
    setSettings(data.settings);
  };

  const deleteAccount = async () => {
    const res = await authFetch("/api/auth/delete-account", { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete account");
    logout();
  };

  const fetchAdminUsers = async () => {
    const res = await authFetch("/api/admin/users");
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to fetch user list");
    return data.users || [];
  };

  const deleteAdminUser = async (userId) => {
    const res = await authFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to delete user");
    if (userId === user?.id) {
      logout();
    }
    return data;
  };

  const updateAdminUser = async (userId, updates) => {
    const res = await authFetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to update user");
    return data.user;
  };

  return {
    token, user, login, signup, logout, verifyOtp, resendOtp, deleteAccount, fetchAdminUsers, deleteAdminUser, updateAdminUser,
    topics, patterns, questions, revisions, phProblems, weakSpots, settings, loading, error,
    updateQuestion, deleteQuestion, submitRevision, submitPatternHuntAttempt,
    addTopic, deleteTopic, addPattern, deletePattern, persistSettings, reload: loadData
  };
}

/* ============================== SMALL UI PRIMITIVES ============================== */
const Badge = ({ children, tone="neutral" }) => (
  <span className={`badge-${tone} px-2 py-0.5 rounded-md text-xs font-semibold mono inline-flex items-center gap-1`}>{children}</span>
);
const ConfidenceBadge = ({ c }) => {
  if (!c) return <Badge tone="neutral">Unrated</Badge>;
  const tone = c === "Green" ? "green" : c === "Yellow" ? "yellow" : "red";
  return <Badge tone={tone}>{c}</Badge>;
};
const StatusPill = ({ status }) => {
  const map = {
    "Not Started": { tone:"neutral", icon:<Circle size={11}/> },
    "Started": { tone:"neutral", icon:<Circle size={11}/> },
    "Practicing": { tone:"yellow", icon:<MinusCircle size={11}/> },
    "Comfortable": { tone:"green", icon:<CheckCircle2 size={11}/> },
    "Mastered": { tone:"green", icon:<CheckCircle2 size={11}/> },
  };
  const m = map[status] || map["Not Started"];
  return <Badge tone={m.tone}>{m.icon}{status}</Badge>;
};
const ProgressBar = ({ pct, color="var(--accent)" }) => (
  <div className="prog-track w-full h-2"><div className="prog-fill" style={{ width: `${Math.max(0,Math.min(100,pct))}%`, background: color }} /></div>
);
function Modal({ title, onClose, children, wide }){
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 sm:p-6 overflow-y-auto" onMouseDown={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className={`card fade-in w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-6`}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:'var(--border)'}}>
          <h3 className="font-bold text-base">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={16}/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children, required }){
  return (
    <div className="mb-3.5">
      <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--muted)'}}>{label}{required && <span style={{color:'var(--red)'}}> *</span>}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full px-3 py-2 text-sm";
function ConfirmDialog({ msg, onCancel, onConfirm }){
  return (
    <Modal title="Confirm" onClose={onCancel}>
      <p className="text-sm mb-4" style={{color:'var(--muted)'}}>{msg}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-ghost px-3 py-2 rounded-lg text-sm font-semibold">Cancel</button>
        <button onClick={onConfirm} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{background:'var(--red)',color:'#fff8ee'}}>Delete</button>
      </div>
    </Modal>
  );
}

/* ============================== AUTH SCREEN ============================== */
function AuthScreen({ onLogin, onSignup, onVerify, onResendOtp }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // OTP verification state
  const [verifyEmail, setVerifyEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let t;
    if (resendIn > 0) t = setTimeout(() => setResendIn(v => Math.max(0, v - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const startVerification = (emailToVerify, initialResendIn) => {
    setVerifyEmail(emailToVerify);
    setOtp("");
    setErr("");
    setResendIn(initialResendIn || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      if (tab === "login") {
        await onLogin(email, password);
      } else {
        const data = await onSignup(email, password, name);
        startVerification(email, data?.resendIn || 0);
        setEmail("");
        setPassword("");
        setName("");
      }
    } catch (error) {
      const msg = error?.message || "";
      // Unverified login -> jump straight to the OTP screen (and resend a code).
      if (error?.needsVerification) {
        startVerification(error.email, 60);
        try { await onResendOtp(error.email); } catch (e) { /* ignore */ }
      } else if (msg.includes("fetch") || msg.includes("JSON") || msg.includes("Unexpected") || msg.includes("Network")) {
        setErr("Could not connect to API server. Please ensure Express is running on port 5050.");
      } else {
        setErr(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErr("");
    setVerifying(true);
    try {
      await onVerify(verifyEmail, otp);
    } catch (error) {
      if (error?.needsResend || (error?.message || "").includes("expired")) {
        setResendIn(0);
        try { await onResendOtp(verifyEmail); } catch (e2) { /* ignore */ }
      }
      setErr(error?.message || "Verification failed. Try the code again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setErr("");
    setResending(true);
    try {
      const data = await onResendOtp(verifyEmail);
      setResendIn(data?.resendIn || 60);
      setOtp("");
    } catch (error) {
      setErr(error?.message || "Could not resend the code.");
    } finally {
      setResending(false);
    }
  };

  // OTP verification screen
  if (verifyEmail) {
    return (
      <div className="dsa-root min-h-screen flex items-center justify-center p-4">
        <GlobalStyle />
        <div className="card w-full max-w-md p-6 fade-in">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black mono text-lg" style={{background:'var(--accent)', color:'#fff8ee'}}>{'</>'}</div>
            <div>
              <h2 className="font-extrabold text-xl leading-tight">CodeCance</h2>
              <p className="text-xs mono" style={{color:'var(--muted2)'}}>email verification</p>
            </div>
          </div>

          <h3 className="font-bold text-base mb-1">Verify your email</h3>
          <p className="text-xs mb-5" style={{color:'var(--muted)'}}>
            We emailed a 6-digit code to <span className="mono font-semibold" style={{color:'var(--text)'}}>{verifyEmail}</span>.
            Enter it below to activate your account. (In local dev without an email provider, the code is printed in the server console.)
          </p>

          {err && <div className="mb-4 p-3 rounded-lg text-xs font-semibold badge-red">{err}</div>}

          <form onSubmit={handleVerify}>
            <Field label="Verification Code" required>
              <input
                className={inputCls + " mono tracking-[0.4em] text-center text-lg"}
                placeholder="••••••"
                maxLength={6}
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </Field>
            <button
              type="submit"
              disabled={verifying || otp.length !== 6}
              className="btn-primary w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 mt-5 disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Verify & Activate Account"}
            </button>
          </form>

          <div className="flex items-center justify-between mt-4 text-xs" style={{color:'var(--muted)'}}>
            <span>Didn't get a code? {resendIn > 0 ? `Resend available in ${resendIn}s` : null}</span>
            <button onClick={handleResend} disabled={resending || resendIn > 0} className="btn-ghost px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40">
              {resending ? "Sending..." : "Resend code"}
            </button>
          </div>

          <button onClick={() => setVerifyEmail("")} className="w-full text-center mt-4 text-xs font-semibold hover:text-[var(--text)]" style={{color:'var(--muted)'}}>
            ← Use a different email / log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dsa-root min-h-screen flex items-center justify-center p-4">
      <GlobalStyle />
      <div className="card w-full max-w-md p-6 fade-in">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black mono text-lg" style={{background:'var(--accent)', color:'#fff8ee'}}>{'</>'}</div>
          <div>
            <h2 className="font-extrabold text-xl leading-tight">CodeCance</h2>
            <p className="text-xs mono" style={{color:'var(--muted2)'}}>pattern tracker</p>
          </div>
        </div>

        <div className="flex border-b mb-5" style={{borderColor:'var(--border)'}}>
          <button
            onClick={() => { setTab("login"); setErr(""); }}
            className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 transition-colors ${tab === 'login' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--muted)]'}`}
          >
            Log In
          </button>
          <button
            onClick={() => { setTab("signup"); setErr(""); }}
            className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 transition-colors ${tab === 'signup' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--muted)]'}`}
          >
            Create Account
          </button>
        </div>

        {err && (
          <div className="mb-4 p-3 rounded-lg text-xs font-semibold badge-red">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {tab === "signup" && (
            <Field label="Full Name" required>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Vamsi Krishna"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
          )}
          <Field label="Email Address" required>
            <input
              type="email"
              className={inputCls}
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" required>
            <input
              type="password"
              className={inputCls}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {tab === "signup" && (
            <p className="text-[11px] mb-3" style={{color:'var(--muted)'}}>
              We&apos;ll send a one-time verification code to your email to confirm it&apos;s really you.
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 mt-5 disabled:opacity-50"
          >
            {submitting ? "Processing..." : tab === "login" ? "Log In" : "Create Account & Verify Email"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================== PATTERN HUNT COMPONENT ============================== */
function PatternHunt({ T, onGoto }) {
  const [activeProblem, setActiveProblem] = useState(null);
  const [questionBoxProblem, setQuestionBoxProblem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [fDiff, setFDiff] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Form State for Pattern Hunt submission (Date automatically defaults to today)
  const [status, setStatus] = useState("Solved");
  const [confidence, setConfidence] = useState("");
  const [lastSolvedAt, setLastSolvedAt] = useState(localToday());
  const [timeTaken, setTimeTaken] = useState("");
  const [neededHint, setNeededHint] = useState(false);
  const [keyConcept, setKeyConcept] = useState("");
  const [notes, setNotes] = useState("");

  const filteredProblems = useMemo(() => {
    return T.phProblems.filter(prob => {
      if (search && !prob.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (fDiff && prob.difficulty !== fDiff) return false;
      const st = prob.userProgress ? prob.userProgress.status : "Unattempted";
      if (fStatus === "Unattempted" && prob.userProgress) return false;
      if (fStatus && fStatus !== "Unattempted" && st !== fStatus) return false;
      return true;
    });
  }, [T.phProblems, search, fDiff, fStatus]);

  const totalPages = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE) || 1;
  const paginatedProblems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProblems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProblems, page]);

  useEffect(() => { setPage(1); }, [search, fDiff, fStatus]);

  const pickRandomProblem = () => {
    const candidates = filteredProblems.length > 0 ? filteredProblems : T.phProblems;
    if (candidates.length === 0) return;
    const unattempted = candidates.filter(p => !p.userProgress);
    const pool = unattempted.length > 0 ? unattempted : candidates;
    const randomChoice = pool[Math.floor(Math.random() * pool.length)];
    setQuestionBoxProblem(randomChoice);
  };

  const openHuntModal = (prob) => {
    setActiveProblem(prob);
    setEvalResult(null);
    const existing = prob.userProgress;
    setStatus(existing?.status || "Solved");
    setConfidence(existing?.confidence || "");
    setLastSolvedAt(existing?.lastSolvedAt || localToday());
    setTimeTaken(existing?.timeTaken ?? "");
    setNeededHint(existing?.neededHint ?? false);
    setKeyConcept(existing?.userPatternInput || "");
    setNotes(existing?.notes || "");
  };

  const handleSubmit = async () => {
    if (!activeProblem) return;
    setSubmitting(true);
    try {
      const res = await T.submitPatternHuntAttempt({
        problemId: activeProblem.id,
        status,
        confidence: confidence || null,
        lastSolvedAt: lastSolvedAt || localToday(),
        timeTaken: timeTaken === "" ? null : Number(timeTaken),
        neededHint,
        keyConcept: keyConcept.trim(),
        notes: notes.trim(),
      });
      setEvalResult(res);
    } catch (e) {
      alert("Failed to submit pattern hunt attempt: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in max-w-6xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Target size={24} style={{ color: 'var(--accent)' }} /> Pattern Hunt
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Can you recognize the pattern before you code? (500 FAANG & Tier-1 Problems)
          </p>
        </div>
        <button onClick={pickRandomProblem} className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm">
          <Shuffle size={16} /> Pick One (Random Problem)
        </button>
      </div>

      {/* Weak-Spot Analysis Insights */}
      {T.weakSpots && T.weakSpots.length > 0 && (
        <div className="card p-4 mb-5" style={{ background: 'var(--yellow-dim)', borderColor: '#e6d3a3' }}>
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} style={{ color: 'var(--yellow)' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--yellow)' }}>Pattern Recognition Insights</p>
          </div>
          <div className="space-y-1.5">
            {T.weakSpots.map((ws, i) => (
              <p key={i} className="text-xs" style={{ color: 'var(--text)' }}>
                • {ws.insight}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters Controls */}
      <div className="card p-4 mb-4 space-y-3">
        <div className="lc-search flex items-center gap-2 px-3 py-2">
          <Search size={16} style={{ color: 'var(--muted)' }} />
          <input
            className="bg-transparent flex-1 text-sm outline-none border-none focus:ring-0 focus:border-none"
            placeholder="Search across 500+ problems by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">Clear</button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <select className="lc-select" value={fDiff} onChange={e => setFDiff(e.target.value)}>
              <option value="">All Difficulties</option>
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </select>

            <select className="lc-select" value={fStatus} onChange={e => setFStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Unattempted">Unattempted</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="text-xs mono font-semibold" style={{ color: 'var(--muted)' }}>
            Showing {paginatedProblems.length} of {filteredProblems.length} problems
          </div>
        </div>
      </div>

      {/* Mixed DSA Problems List */}
      {paginatedProblems.length === 0 ? (
        <div className="card p-10 text-center"><EmptyNote text="No problems match your search filters." /></div>
      ) : (
        <div className="space-y-2.5 mb-6">
          {paginatedProblems.map((prob) => {
            const prog = prob.userProgress;
            return (
              <div key={prob.id} className="card p-3.5 flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--text)' }}>{prob.title}</span>
                    <Badge tone={prob.difficulty === 'Easy' ? 'green' : prob.difficulty === 'Medium' ? 'yellow' : 'red'}>
                      {prob.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {prog && (
                    <div className="flex items-center gap-2 text-xs mono mr-1">
                      <Badge tone={prog.status === 'Solved' ? 'green' : 'yellow'}>{prog.status}</Badge>
                      {prog.recognitionCorrect != null && (
                        <Badge tone={prog.recognitionCorrect ? 'green' : 'red'}>
                          {prog.recognitionCorrect ? 'Correct Pattern 🟢' : 'Incorrect Pattern 🔴'}
                        </Badge>
                      )}
                    </div>
                  )}

                  {prob.problemLink && (
                    <a
                      href={prob.problemLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:underline"
                      style={{ color: 'var(--accent)' }}
                    >
                      <Link2 size={13} /> {prob.problemLink.includes('leetcode.com') ? 'LeetCode' : 'GeeksForGeeks'} <ExternalLink size={11} />
                    </a>
                  )}

                  <button onClick={() => openHuntModal(prob)} className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    {prog ? 'Update Attempt' : 'Solve / Log Attempt'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between card p-3 mb-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="text-xs mono" style={{ color: 'var(--muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* QUESTION BOX MODAL */}
      {questionBoxProblem && (
        <Modal title={`Question Box: ${questionBoxProblem.title}`} onClose={() => setQuestionBoxProblem(null)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold mono" style={{ color: 'var(--muted)' }}>Topic: {questionBoxProblem.topicName || 'DSA'}</span>
              <Badge tone={questionBoxProblem.difficulty === 'Easy' ? 'green' : questionBoxProblem.difficulty === 'Medium' ? 'yellow' : 'red'}>
                {questionBoxProblem.difficulty}
              </Badge>
            </div>

            <div className="p-4 rounded-lg card" style={{ background: 'var(--surface2)' }}>
              <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Challenge Instructions</p>
              <p className="text-sm mb-3">
                Solve this problem on LeetCode without revealing its pattern, analyze the underlying structure, and identify which pattern it belongs to!
              </p>
              {questionBoxProblem.problemLink && (
                <a
                  href={questionBoxProblem.problemLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                  Open Problem on LeetCode <ExternalLink size={14} />
                </a>
              )}
            </div>

            <div className="flex justify-between gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setQuestionBoxProblem(null)} className="btn-ghost px-4 py-2 rounded-lg text-sm font-semibold">
                Close
              </button>
              <button
                onClick={() => {
                  const p = questionBoxProblem;
                  setQuestionBoxProblem(null);
                  openHuntModal(p);
                }}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
              >
                Log Attempt & Evaluate Pattern <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Pattern Hunt Tracking Modal */}
      {activeProblem && (
        <Modal title={`Pattern Hunt: ${activeProblem.title}`} onClose={() => { setActiveProblem(null); setEvalResult(null); }} wide>
          <p className="text-xs mono mb-4" style={{ color: 'var(--muted)' }}>
            Identify the underlying DSA pattern and log your performance. The pattern is hidden until submission.
          </p>

          {evalResult ? (
            <div className="p-4 rounded-lg mb-5 card space-y-3" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2 mb-1">
                {evalResult.recognitionCorrect ? (
                  <Badge tone="green"><Check size={14} /> Correct Pattern Recognition!</Badge>
                ) : (
                  <Badge tone="red"><AlertTriangle size={14} /> Pattern Recognition Inconsistent</Badge>
                )}
              </div>

              {evalResult.evaluation && (
                <div className="p-3.5 rounded-lg space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-extrabold uppercase mono flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                    <Activity size={14} /> Semantic Evaluation Report
                  </p>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text)' }}>
                    {evalResult.evaluation.feedbackExplanation}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t text-xs mono" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Recognized Pattern: </span>
                      <b style={{ color: 'var(--accent)' }}>{evalResult.evaluation.recognizedPattern || '—'}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Data Structure: </span>
                      <b>{evalResult.evaluation.recognizedDataStructure || '—'}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Techniques: </span>
                      <b>{evalResult.evaluation.techniques.length > 0 ? evalResult.evaluation.techniques.join(', ') : '—'}</b>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs space-y-1 pt-1">
                <p className="font-semibold">
                  Your Answer: <span className="mono" style={{ color: 'var(--accent)' }}>"{keyConcept || 'None'}"</span>
                </p>
                <p className="font-semibold">
                  Benchmark Pattern: <span className="mono" style={{ color: 'var(--green)' }}>"{evalResult.expectedPattern}"</span>
                </p>
              </div>

              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                This evaluation measures your <b>underlying problem-solving intent</b> and has been synced with your <b>DSA Roadmap & Patterns</b> view.
              </p>
              <div className="mt-4 flex justify-between gap-2">
                <button onClick={() => { setActiveProblem(null); setEvalResult(null); onGoto('roadmap'); }} className="btn-ghost px-4 py-2 rounded-lg text-sm font-semibold">
                  View in Roadmap & Patterns
                </button>
                <button onClick={() => { setActiveProblem(null); setEvalResult(null); }} className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status" required>
                  <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Confidence" required>
                  <select className={inputCls} value={confidence} onChange={(e) => setConfidence(e.target.value)}>
                    <option value="">Select a rating…</option>
                    {CONFIDENCES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Last Solved Date (auto-filled as today)">
                  <input type="date" className={inputCls} value={lastSolvedAt} onChange={(e) => setLastSolvedAt(e.target.value)} />
                </Field>
                <Field label="Time Taken (minutes)">
                  <input type="number" min="0" className={inputCls} value={timeTaken} onChange={(e) => setTimeTaken(e.target.value)} placeholder="e.g. 25" />
                </Field>
                <Field label="Needed Hint?">
                  <select className={inputCls} value={neededHint ? "yes" : "no"} onChange={(e) => setNeededHint(e.target.value === "yes")}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </Field>
              </div>

              <Field label="Key Pattern / Concept (What pattern do you think this problem uses?)" required>
                <input
                  className={inputCls}
                  value={keyConcept}
                  onChange={(e) => setKeyConcept(e.target.value)}
                  placeholder="e.g. Sliding Window, Two Pointer, Monotonic Stack, BFS..."
                />
              </Field>

              <Field label="Notes">
                <textarea
                  className={inputCls}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Approach, edge cases, pattern observations, confusion..."
                />
              </Field>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => setActiveProblem(null)} className="btn-ghost px-4 py-2 rounded-lg text-sm font-semibold">
                  Cancel
                </button>
                <button
                  disabled={submitting || !status || !confidence || !keyConcept}
                  onClick={handleSubmit}
                  className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Save size={15} /> {submitting ? "Evaluating..." : "Submit & Evaluate Pattern"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ============================== UNIFIED DSA ROADMAP & PATTERNS (TOPIC PAGES) ============================== */
function UnifiedRoadmapPatterns({ T, onGoto }){
  const [activeTopicId, setActiveTopicId] = useState(T.topics[0]?.id || "");
  const [selectedPatternForReport, setSelectedPatternForReport] = useState(null);

  useEffect(() => {
    if (!activeTopicId && T.topics.length > 0) {
      setActiveTopicId(T.topics[0].id);
    }
  }, [T.topics, activeTopicId]);

  const currentTopicIndex = T.topics.findIndex(t => t.id === activeTopicId);
  const activeTopic = T.topics[currentTopicIndex] || T.topics[0];

  const topicStats = useMemo(() => {
    if (!activeTopic) return null;
    return calcTopicStats(activeTopic, T.patterns, T.questions, T.phProblems, T.settings);
  }, [activeTopic, T.patterns, T.questions, T.phProblems, T.settings]);

  if (!activeTopic || !topicStats) return null;

  return (
    <div className="fade-in max-w-6xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <GitBranch size={24} style={{ color: 'var(--accent)' }} /> DSA Roadmap & Patterns
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Dedicated Topic Pages with Live Pattern Reports & Exact Question Counts from Pattern Hunt.
          </p>
        </div>
        <button onClick={() => onGoto('pattern-hunt')} className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 shadow-sm">
          <Target size={16} /> Solve in Pattern Hunt
        </button>
      </div>

      {/* TOPIC NAVIGATION PAGE SELECTOR / SUB-TABS */}
      <div className="card p-2 mb-6 overflow-x-auto scrollbar-thin flex items-center gap-1.5">
        {T.topics.map((t, idx) => {
          const tStats = calcTopicStats(t, T.patterns, T.questions, T.phProblems, T.settings);
          const isActive = t.id === activeTopicId;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTopicId(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'btn-primary shadow-sm'
                  : 'btn-ghost text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>{idx + 1}. {t.name}</span>
              <span className="mono text-[10px] px-1.5 py-0.2 rounded-full" style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--accent-dim)', color: isActive ? '#fff8ee' : 'var(--accent)' }}>
                {tStats.completedQuestions}/{tStats.totalQuestions}
              </span>
            </button>
          );
        })}
      </div>

      {/* DEDICATED TOPIC PAGE HEADER */}
      <div className="card p-5 mb-6 space-y-4" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="mono text-xs font-bold" style={{ color: 'var(--muted)' }}>Topic {currentTopicIndex + 1} of {T.topics.length}</span>
              <Badge tone={topicStats.progress === 100 ? 'green' : topicStats.progress > 0 ? 'yellow' : 'neutral'}>
                {topicStats.progress === 100 ? 'Mastered Topic 🎉' : topicStats.progress > 0 ? 'In Progress ⚡' : 'Not Started ⭕'}
              </Badge>
            </div>
            <h2 className="text-xl font-extrabold mt-1">{activeTopic.name}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentTopicIndex === 0}
              onClick={() => setActiveTopicId(T.topics[currentTopicIndex - 1].id)}
              className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous Topic
            </button>
            <button
              disabled={currentTopicIndex === T.topics.length - 1}
              onClick={() => setActiveTopicId(T.topics[currentTopicIndex + 1].id)}
              className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
            >
              Next Topic <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-3" style={{ background: 'var(--surface2)' }}>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>Patterns Covered</p>
            <p className="text-lg font-bold mono mt-0.5" style={{ color: 'var(--indigo)' }}>
              {topicStats.covered} / {topicStats.totalPatterns}
            </p>
          </div>
          <div className="card p-3" style={{ background: 'var(--surface2)' }}>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>Questions Solved</p>
            <p className="text-lg font-bold mono mt-0.5" style={{ color: 'var(--accent)' }}>
              {topicStats.completedQuestions} / {topicStats.totalQuestions}
            </p>
          </div>
          <div className="card p-3" style={{ background: 'var(--surface2)' }}>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>Pattern Coverage</p>
            <p className="text-lg font-bold mono mt-0.5" style={{ color: 'var(--indigo)' }}>{topicStats.coverage}%</p>
          </div>
          <div className="card p-3" style={{ background: 'var(--surface2)' }}>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>Overall Progress</p>
            <p className="text-lg font-bold mono mt-0.5" style={{ color: 'var(--green)' }}>{topicStats.progress}%</p>
          </div>
        </div>

        <ProgressBar pct={topicStats.progress} color="var(--accent)" />
      </div>

      {/* PATTERNS TABLE WITH LIVE AUTO-UPDATED PATTERN REPORT (Action Column Removed) */}
      <div className="card overflow-hidden mb-6">
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-bold text-sm flex items-center gap-2">
            <FileText size={16} style={{ color: 'var(--accent)' }} /> {activeTopic.name} — Patterns & Live Reports
          </h3>
          <span className="text-xs mono" style={{ color: 'var(--muted)' }}>{topicStats.totalPatterns} Patterns</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs">
            <thead style={{ color: 'var(--muted)', background: 'var(--surface2)' }}>
              <tr className="text-left border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="p-3">Pattern</th>
                <th className="p-3">Status</th>
                <th className="p-3">Questions (Solved / Total)</th>
                <th className="p-3">🟢 Green</th>
                <th className="p-3">🟡 Yellow</th>
                <th className="p-3">🔴 Red</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Last Activity</th>
                <th className="p-3">Next Revision</th>
                <th className="p-3 min-w-[280px]">Live Pattern Report 📊</th>
              </tr>
            </thead>
            <tbody>
              {topicStats.patStats.map(({ pattern, stats }) => (
                <tr key={pattern.id} className="border-b hover:bg-[var(--surface2)]/40 transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedPatternForReport({ pattern, stats, topic: activeTopic })}
                      className="font-bold text-sm text-left hover:underline" style={{ color: 'var(--text)' }}
                    >
                      {pattern.name}
                    </button>
                  </td>
                  <td className="p-3"><StatusPill status={stats.status} /></td>
                  <td className="p-3 mono font-bold text-sm" style={{ color: 'var(--accent)' }}>
                    {stats.completed} / {stats.total}
                  </td>
                  <td className="p-3 mono font-bold" style={{ color: 'var(--green)' }}>{stats.green}</td>
                  <td className="p-3 mono font-bold" style={{ color: 'var(--yellow)' }}>{stats.yellow}</td>
                  <td className="p-3 mono font-bold" style={{ color: 'var(--red)' }}>{stats.red}</td>
                  <td className="p-3 w-24"><ProgressBar pct={stats.progress} /></td>
                  <td className="p-3 mono" style={{ color: 'var(--muted)' }}>{fmtDate(stats.lastActivity)}</td>
                  <td className="p-3 mono" style={{ color: 'var(--muted)' }}>{fmtDate(stats.nextRevision)}</td>
                  <td className="p-3">
                    {/* Live Auto-updating Pattern Report Card */}
                    <div
                      onClick={() => setSelectedPatternForReport({ pattern, stats, topic: activeTopic })}
                      className="p-2 rounded-lg cursor-pointer transition-all hover:scale-[1.01]"
                      style={{
                        background: stats.reportTone === 'green' ? 'var(--green-dim)' : stats.reportTone === 'red' ? 'var(--red-dim)' : stats.reportTone === 'yellow' ? 'var(--yellow-dim)' : 'var(--surface2)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <p className="font-semibold text-[11px] leading-tight" style={{
                        color: stats.reportTone === 'green' ? 'var(--green)' : stats.reportTone === 'red' ? 'var(--red)' : stats.reportTone === 'yellow' ? 'var(--yellow)' : 'var(--muted)'
                      }}>
                        {stats.reportText}
                      </p>
                      <p className="text-[10px] mono mt-1" style={{ color: 'var(--muted)' }}>
                        Click to view live pattern report ↗
                      </p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED PATTERN REPORT MODAL */}
      {selectedPatternForReport && (
        <Modal
          title={`Pattern Report: ${selectedPatternForReport.pattern.name}`}
          onClose={() => setSelectedPatternForReport(null)}
          wide
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold mono" style={{ color: 'var(--muted)' }}>Topic: {selectedPatternForReport.topic.name}</span>
              <StatusPill status={selectedPatternForReport.stats.status} />
            </div>

            {/* Live Report Summary Box */}
            <div className="p-4 rounded-lg card space-y-3" style={{ background: 'var(--surface2)' }}>
              <div className="flex items-center gap-2">
                <Activity size={18} style={{ color: 'var(--accent)' }} />
                <p className="font-bold text-sm">Live Pattern Performance & Health Report</p>
              </div>
              <p className="text-xs font-medium leading-relaxed">{selectedPatternForReport.stats.reportText}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-xs mono" style={{ borderColor: 'var(--border)' }}>
                <div className="p-2 rounded" style={{ background: 'var(--surface)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Questions Solved</p>
                  <p className="font-bold mt-0.5" style={{ color: 'var(--accent)' }}>{selectedPatternForReport.stats.completed} / {selectedPatternForReport.stats.total}</p>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--surface)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>🟢 Green (High Conf.)</p>
                  <p className="font-bold mt-0.5" style={{ color: 'var(--green)' }}>{selectedPatternForReport.stats.green}</p>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--surface)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>🟡 Yellow (Medium Conf.)</p>
                  <p className="font-bold mt-0.5" style={{ color: 'var(--yellow)' }}>{selectedPatternForReport.stats.yellow}</p>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--surface)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>🔴 Red (Needs Review)</p>
                  <p className="font-bold mt-0.5" style={{ color: 'var(--red)' }}>{selectedPatternForReport.stats.red}</p>
                </div>
              </div>

              {selectedPatternForReport.stats.recAccuracy != null && (
                <div className="p-2.5 rounded-lg text-xs mono font-semibold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  🎯 Pattern Recognition Accuracy: {selectedPatternForReport.stats.recAccuracy}% ({selectedPatternForReport.stats.recCorrect}/{selectedPatternForReport.stats.recTotal} correct pattern recognitions)
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setSelectedPatternForReport(null)} className="btn-ghost px-4 py-2 rounded-lg text-sm font-semibold">
                Close Report
              </button>
              <button
                onClick={() => {
                  setSelectedPatternForReport(null);
                  onGoto('pattern-hunt');
                }}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
              >
                <Target size={15} /> Solve in Pattern Hunt
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================== QUESTION TRACKER ============================== */
function Tracker({ T, topicById, patternById, onDelete }){
  const [search, setSearch] = useState("");
  const [fTopic, setFTopic] = useState("");
  const [fPattern, setFPattern] = useState("");
  const [fDiff, setFDiff] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fConf, setFConf] = useState("");
  const [fDue, setFDue] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");

  const today = localToday();
  let rows = T.questions.map(q => ({ q, topic: topicById[q.topicId], pattern: patternById[q.patternId] }));

  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(r => `${r.topic?.name} ${r.pattern?.name} #${r.q.seq} ${r.q.notes} ${r.q.keyConcept}`.toLowerCase().includes(s));
  }
  if (fTopic) rows = rows.filter(r => r.q.topicId === fTopic);
  if (fPattern) rows = rows.filter(r => r.q.patternId === fPattern);
  if (fDiff) rows = rows.filter(r => r.q.difficulty === fDiff);
  if (fStatus) rows = rows.filter(r => r.q.status === fStatus);
  if (fConf) rows = rows.filter(r => (fConf === "Unrated" ? !r.q.confidence : r.q.confidence === fConf));
  if (fDue === "overdue") rows = rows.filter(r => r.q.nextRevision && r.q.nextRevision < today);
  if (fDue === "today") rows = rows.filter(r => r.q.nextRevision === today);
  if (fDue === "upcoming") rows = rows.filter(r => r.q.nextRevision && r.q.nextRevision > today);

  const sorters = {
    createdAt: (a,b) => (b.q.createdAt||"").localeCompare(a.q.createdAt||""),
    lastSolved: (a,b) => (b.q.lastSolvedAt||"").localeCompare(a.q.lastSolvedAt||""),
    nextRevision: (a,b) => (a.q.nextRevision||"9999").localeCompare(b.q.nextRevision||"9999"),
    confidence: (a,b) => (a.q.confidence||"zzz").localeCompare(b.q.confidence||"zzz"),
    topic: (a,b) => (a.topic?.name||"").localeCompare(b.topic?.name||""),
    pattern: (a,b) => (a.pattern?.name||"").localeCompare(b.pattern?.name||""),
  };
  rows.sort(sorters[sortBy]);

  const availPatterns = fTopic ? T.patterns.filter(p=>p.topicId===fTopic) : T.patterns;

  return (
    <div className="fade-in max-w-6xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-extrabold">Question Tracker</h1>
      </div>

      <div className="card p-3 mb-4">
        <div className="lc-search flex items-center gap-2 px-3 py-2.5 mb-2">
          <Search size={15} style={{color:'var(--muted)'}}/>
          <input className="bg-transparent flex-1 text-sm outline-none border-none focus:ring-0 focus:border-none" placeholder="Search by topic, pattern, ID, notes, key concept…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="lc-select" value={fTopic} onChange={e=>{setFTopic(e.target.value); setFPattern("");}}><option value="">All Topics</option>{T.topics.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <select className="lc-select" value={fPattern} onChange={e=>setFPattern(e.target.value)}><option value="">All Patterns</option>{availPatterns.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className="lc-select" value={fDiff} onChange={e=>setFDiff(e.target.value)}><option value="">All Difficulty</option>{DIFFICULTIES.map(d=><option key={d}>{d}</option>)}</select>
          <select className="lc-select" value={fStatus} onChange={e=>setFStatus(e.target.value)}><option value="">All Status</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
          <select className="lc-select" value={fConf} onChange={e=>setFConf(e.target.value)}><option value="">All Confidence</option>{CONFIDENCES.map(c=><option key={c}>{c}</option>)}<option value="Unrated">Unrated</option></select>
          <select className="lc-select" value={fDue} onChange={e=>setFDue(e.target.value)}><option value="">All Due Status</option><option value="overdue">Overdue</option><option value="today">Due Today</option><option value="upcoming">Upcoming</option></select>
          <select className="lc-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="createdAt">Sort: Newest</option><option value="lastSolved">Sort: Last Solved</option><option value="nextRevision">Sort: Next Revision</option>
            <option value="confidence">Sort: Confidence</option><option value="topic">Sort: Topic</option><option value="pattern">Sort: Pattern</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center"><EmptyNote text="No questions match these filters yet." /></div>
      ) : (
        <div className="space-y-2">
          {rows.map(({q,topic,pattern}) => (
            <div key={q.id} className="card w-full text-left p-3.5 flex items-center flex-wrap gap-x-4 gap-y-2 cursor-default">
              <span className="mono text-sm font-semibold" style={{color:'var(--accent)', minWidth:150}}>{topic?.name} / {pattern?.name} <span style={{color:'var(--text)'}}>#{q.seq}</span></span>
              <Badge tone="neutral">{q.difficulty}</Badge>
              <Badge tone="neutral">{q.status}</Badge>
              <ConfidenceBadge c={q.confidence} />
              {q.recognitionCorrect != null && (
                <Badge tone={q.recognitionCorrect ? 'green' : 'red'}>
                  {q.recognitionCorrect ? 'Correct Pattern 🟢' : 'Incorrect Pattern 🔴'}
                </Badge>
              )}
              <span className="text-xs mono" style={{color:'var(--muted)'}}><Clock size={11} className="inline mr-1"/>{fmtDate(q.lastSolvedAt)}</span>
              {q.nextRevision && <span className="text-xs mono" style={{color: q.nextRevision < today ? 'var(--red)' : q.nextRevision === today ? 'var(--yellow)' : 'var(--muted2)'}}><Calendar size={11} className="inline mr-1"/>next {fmtDate(q.nextRevision)}</span>}
              {onDelete && (
                <button
                  onClick={()=>onDelete(q)}
                  title="Delete question"
                  className="btn-ghost p-1.5 rounded-lg text-xs"
                  style={{color:'var(--red)', marginLeft:'auto'}}
                >
                  <Trash2 size={14}/>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== DAILY REVISION QUEUE ============================== */
function DailyRevision({ T, topicById, patternById, onRevise, onView }){
  const today = localToday();
  const due = T.questions
    .filter(q => q.nextRevision && q.nextRevision <= today)
    .sort((a,b) => revisionPriority(b) - revisionPriority(a));
  const overdueCount = T.questions.filter(q => q.nextRevision && q.nextRevision < today).length;
  const dueTodayCount = T.questions.filter(q => q.nextRevision === today).length;
  const todayRevised = T.revisions.filter(r => r.actualRevisionDate === today).length;
  const streak = calcRevisionStreak(T.revisions);

  return (
    <div className="fade-in max-w-5xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Flame size={24} style={{ color: 'var(--accent)' }} /> Daily Revision Queue
        </h1>
      </div>
      <p className="text-sm mb-6" style={{color:'var(--muted)'}}>Everything due today (or overdue), ordered by priority. Click a card to see details, or press Revise Now.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Current Streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} sub="consecutive revision days" tone="var(--accent)" />
        <StatCard label="Revised Today" value={`${todayRevised} / ${due.length}`} sub={`${dueTodayCount} due today, ${overdueCount} overdue`} tone="var(--green)" />
        <StatCard label="Due Today" value={dueTodayCount} tone="var(--yellow)" />
        <StatCard label="Overdue" value={overdueCount} tone="var(--red)" />
      </div>

      {due.length === 0 ? (
        <div className="card p-10 text-center">
          <EmptyNote text="You're all caught up! Nothing is due today or overdue. Nice work." />
        </div>
      ) : (
        <div className="space-y-2.5">
          {due.map(q => {
            const topic = topicById[q.topicId], pattern = patternById[q.patternId];
            const daysOver = q.nextRevision < today ? daysBetween(q.nextRevision, today) : 0;
            return (
              <div
                key={q.id}
                onClick={() => onView && onView(q)}
                className="card p-3.5 flex items-center flex-wrap gap-x-3 gap-y-2 cursor-pointer transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="mono text-sm font-semibold" style={{ minWidth: 170 }}>
                  {topic?.name} / {pattern?.name} <span style={{ color: 'var(--accent)' }}>#{q.seq}</span>
                </span>
                <ConfidenceBadge c={q.confidence} />
                <Badge tone="neutral">{q.difficulty}</Badge>
                {q.neededHint && <Badge tone="yellow">needed hint</Badge>}
                {daysOver > 0 ? <Badge tone="red">{daysOver}d overdue</Badge> : <Badge tone="yellow">due today</Badge>}
                <span className="text-xs mono" style={{ color: 'var(--muted)' }}>last solved {fmtDate(q.lastSolvedAt)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRevise(q); }}
                  className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold ml-auto flex items-center gap-1.5"
                >
                  <RotateCcw size={15} /> Revise Now
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================== REVISION PLANNER ============================== */
function RevisionPlanner({ T, topicById, patternById, onRevise, onView }){
  const today = localToday();
  const withRev = T.questions.filter(q => q.nextRevision);
  const overdue = withRev.filter(q => q.nextRevision < today).sort((a,b)=>revisionPriority(b)-revisionPriority(a));
  const dueToday = withRev.filter(q => q.nextRevision === today).sort((a,b)=>revisionPriority(b)-revisionPriority(a));
  const upcoming = withRev.filter(q => q.nextRevision > today).sort((a,b)=>a.nextRevision.localeCompare(b.nextRevision)).slice(0,20);

  const Section = ({ title, list, tone, emptyText }) => (
    <div className="card p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <p className="font-bold text-sm">{title}</p>
        <Badge tone={tone}>{list.length}</Badge>
      </div>
      {list.length === 0 ? <EmptyNote text={emptyText} /> : (
        <div className="space-y-2">
          {list.map(q => {
            const topic = topicById[q.topicId], pattern = patternById[q.patternId];
            const daysOver = q.nextRevision < today ? daysBetween(q.nextRevision, today) : 0;
            return (
              <div key={q.id} onClick={()=> onView && onView(q)} className="flex items-center flex-wrap gap-x-3 gap-y-2 p-3 rounded-lg cursor-pointer transition-colors hover:border" style={{background:'var(--surface2)', border:'1px solid transparent'}}>
                <span className="mono text-sm font-semibold" style={{minWidth:170}}>{topic?.name} / {pattern?.name} <span style={{color:'var(--accent)'}}>#{q.seq}</span></span>
                <ConfidenceBadge c={q.confidence} />
                <Badge tone="neutral">{q.difficulty}</Badge>
                <span className="text-xs mono" style={{color:'var(--muted)'}}>last solved {fmtDate(q.lastSolvedAt)}</span>
                {daysOver > 0 && <Badge tone="red">{daysOver}d overdue</Badge>}
                {q.neededHint && <Badge tone="yellow">needed hint</Badge>}
                <button onClick={(e)=>{ e.stopPropagation(); onRevise(q); }} className="btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold ml-auto">Revise Now</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="fade-in max-w-5xl">
      <h1 className="text-2xl font-extrabold mb-1">Revision Planner</h1>
      <p className="text-sm mb-6" style={{color:'var(--muted)'}}>Prioritized by overdue time, confidence, and hint usage.</p>
      <Section title="Overdue" list={overdue} tone="red" emptyText="Nothing overdue. Nice work." />
      <Section title="Due Today" list={dueToday} tone="yellow" emptyText="Nothing due today." />
      <Section title="Upcoming" list={upcoming} tone="green" emptyText="No upcoming revisions scheduled." />
    </div>
  );
}

/* ============================== ANALYTICS ============================== */
function Analytics({ T, overall }){
  const days = [...Array(14)].map((_,i) => addDaysToDateStr(localToday(), -13+i));
  const solvedByDay = days.map(d => ({ day: d.slice(5), count: T.questions.filter(q=>q.lastSolvedAt===d).length }));
  const revisedByDay = days.map(d => ({ day: d.slice(5), count: T.revisions.filter(r=>r.actualRevisionDate===d).length }));
  const weak = getWeakPatterns(T.patterns, T.questions, T.settings, 8);
  const strong = getMasteredPatterns(T.patterns, T.questions, T.settings);

  return (
    <div className="fade-in max-w-6xl">
      <h1 className="text-2xl font-extrabold mb-6">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Questions" value={overall.totalQuestions} />
        <StatCard label="Total Patterns" value={overall.totalPatterns} />
        <StatCard label="Pattern Coverage" value={`${overall.coverage}%`} />
        <StatCard label="Question Completion" value={`${overall.progress}%`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <p className="font-bold text-sm mb-3">Questions Solved — Last 14 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={solvedByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
              <Bar dataKey="count" fill="var(--accent)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] mt-1" style={{color:'var(--muted2)'}}>Based on the Last Solved date you entered, not creation time.</p>
        </div>
        <div className="card p-4">
          <p className="font-bold text-sm mb-3">Revisions Logged — Last 14 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revisedByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
              <Bar dataKey="count" fill="var(--indigo)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="font-bold text-sm mb-3">Weakest Patterns</p>
          {weak.length === 0 ? <EmptyNote text="No weak patterns detected." /> : weak.map(w => (
            <div key={w.pattern.id} className="flex justify-between text-xs py-1.5 border-b" style={{borderColor:'var(--border)'}}>
              <span className="mono">{topicNameOf(T,w.pattern)} / {w.pattern.name}</span>
              <span className="mono" style={{color:'var(--red)'}}>{w.stats.red}R {w.stats.yellow}Y / {w.stats.total}</span>
            </div>
          ))}
        </div>
        <div className="card p-4">
          <p className="font-bold text-sm mb-3">Strongest (Mastered) Patterns</p>
          {strong.length === 0 ? <EmptyNote text="None mastered yet." /> : strong.map(s => (
            <div key={s.pattern.id} className="flex justify-between text-xs py-1.5 border-b" style={{borderColor:'var(--border)'}}>
              <span className="mono">{topicNameOf(T,s.pattern)} / {s.pattern.name}</span>
              <span className="mono" style={{color:'var(--green)'}}>{s.stats.green}/{s.stats.total} green</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
function StatCard({ label, value, sub, tone }){
  return (
    <div className="card p-4">
      <p className="text-[11px] font-semibold" style={{color:'var(--muted)'}}>{label}</p>
      <p className="text-2xl font-extrabold mono mt-1" style={{color: tone || 'var(--text)'}}>{value}</p>
      {sub && <p className="text-[11px] mt-1" style={{color:'var(--muted2)'}}>{sub}</p>}
    </div>
  );
}
function Dashboard({ T, overall, onGoto }){
  const weak = getWeakPatterns(T.patterns, T.questions, T.settings, 5);
  const mastered = getMasteredPatterns(T.patterns, T.questions, T.settings);
  const today = localToday();
  const solvedToday = T.questions.filter(q => q.lastSolvedAt === today).length;
  const revisedToday = T.revisions.filter(r => r.actualRevisionDate === today).length;
  const recentSolved = [...T.questions]
    .filter(q => q.lastSolvedAt)
    .sort((a,b) => b.lastSolvedAt.localeCompare(a.lastSolvedAt))
    .slice(0, 5);
  const pById = Object.fromEntries(T.patterns.map(p => [p.id, p]));
  const tById = Object.fromEntries(T.topics.map(t => [t.id, t]));

  const confData = [
    { name: "Green", value: overall.green, color: "var(--green)" },
    { name: "Yellow", value: overall.yellow, color: "var(--yellow)" },
    { name: "Red", value: overall.red, color: "var(--red)" },
    { name: "Unrated", value: overall.totalQuestions - overall.green - overall.yellow - overall.red, color: "var(--muted2)" },
  ].filter(d => d.value > 0);

  const topicBarData = overall.topicStats.map(t => ({ name: t.topic.name.length > 12 ? t.topic.name.slice(0,11)+'…' : t.topic.name, progress: t.stats.progress, coverage: t.stats.coverage }));

  return (
    <div className="fade-in max-w-6xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
      </div>
      <p className="text-sm mb-6" style={{color:'var(--muted)'}}>Complete every important DSA pattern, systematically.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <StatCard label="Total Classified Questions" value={overall.totalQuestions} sub={`${overall.completedQuestions} completed`} />
        <StatCard label="Question Progress" value={`${overall.progress}%`} tone="var(--accent)" />
        <StatCard label="Pattern Coverage" value={`${overall.coverage}%`} sub={`${overall.covered}/${overall.totalPatterns} patterns`} tone="var(--indigo)" />
        <StatCard label="Patterns Remaining" value={overall.remaining} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Overdue" value={overall.overdue} tone="var(--red)" />
        <StatCard label="Due Today" value={overall.dueToday} tone="var(--yellow)" />
        <StatCard label="Upcoming" value={overall.upcoming} tone="var(--green)" />
        <StatCard label="Solved Today / Revised Today" value={`${solvedToday} / ${revisedToday}`} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={()=>onGoto('revision')} className="btn-ghost px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5"><AlertTriangle size={15}/> View Overdue ({overall.overdue})</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <p className="font-bold text-sm mb-3">Confidence Distribution</p>
          {confData.length === 0 ? <EmptyNote text="No rated questions yet." /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={confData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {confData.map((d,i) => <Cell key={i} fill={d.color} stroke="var(--surface)" />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-4">
          <p className="font-bold text-sm mb-3">Topic Progress vs Coverage</p>
          {topicBarData.length === 0 ? <EmptyNote text="No data yet." /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topicBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--muted)' }} interval={0} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                <Tooltip contentStyle={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="progress" fill="var(--accent)" name="Question Progress %" radius={[3,3,0,0]} />
                <Bar dataKey="coverage" fill="var(--indigo)" name="Pattern Coverage %" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="font-bold text-sm mb-3 flex items-center gap-1.5"><Flame size={14} style={{color:'var(--red)'}}/> Weakest Patterns</p>
          {weak.length === 0 ? <EmptyNote text="No weak patterns detected." /> : (
            <div className="space-y-2">
              {weak.map(w => (
                <div key={w.pattern.id} className="flex items-center justify-between text-xs">
                  <span className="mono truncate pr-2">{topicNameOf(T, w.pattern)} / {w.pattern.name}</span>
                  <Badge tone="red">{w.stats.red} red / {w.stats.total}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-4">
          <p className="font-bold text-sm mb-3 flex items-center gap-1.5"><ListChecks size={14} style={{color:'var(--accent)'}}/> Recently Solved</p>
          {recentSolved.length === 0 ? <EmptyNote text="No solved questions yet." /> : (
            <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-thin pr-1">
              {recentSolved.map(q => (
                <div key={q.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="mono truncate pr-1">
                    {tById[pById[q.patternId]?.topicId]?.name} / {pById[q.patternId]?.name} <span style={{color:'var(--accent)'}}>#{q.seq}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <ConfidenceBadge c={q.confidence} />
                    <span className="mono" style={{color:'var(--muted2)'}}>{q.lastSolvedAt.slice(5)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          <button onClick={()=>onGoto('tracker')} className="btn-ghost w-full mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
            View All in Question Tracker <ChevronRight size={13}/>
          </button>
        </div>
        <div className="card p-4">
          <p className="font-bold text-sm mb-3 flex items-center gap-1.5"><CheckCircle2 size={14} style={{color:'var(--green)'}}/> Mastered Patterns</p>
          {mastered.length === 0 ? <EmptyNote text="Keep practicing — none mastered yet." /> : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin pr-1">
              {mastered.map(m => <p key={m.pattern.id} className="text-xs mono" style={{color:'var(--green)'}}>✓ {m.pattern.name}</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function topicNameOf(T, pattern){ return T.topics.find(t=>t.id===pattern.topicId)?.name || ""; }
const EmptyNote = ({ text }) => <p className="text-sm py-6 text-center" style={{color:'var(--muted2)'}}>{text}</p>;

/* ============================== SETTINGS ============================== */
function SettingsPage({ T }){
  const [intervals, setIntervals] = useState({
    green: T.settings.greenIntervals.join(","), yellow: T.settings.yellowIntervals.join(","), red: T.settings.redIntervals.join(","),
    growth: T.settings.growthFactor, masteryMin: T.settings.masteryMinQuestions,
    masteryPct: Math.round(T.settings.masteryGreenPct*100), comfyPct: Math.round((T.settings.comfortableGreenPct||0.5)*100)
  });
  const [savedFlash, setSavedFlash] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);

  const isAdmin = T.user?.role === "ADMIN";

  const loadUsersList = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingAdminUsers(true);
    try {
      const uList = await T.fetchAdminUsers();
      setAdminUsers(uList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdminUsers(false);
    }
  }, [T, isAdmin]);

  useEffect(() => {
    loadUsersList();
  }, [loadUsersList]);

  const handleDeleteSpecificUser = async (uId, uEmail) => {
    if (window.confirm(`ADMIN ACTION:\n\nAre you sure you want to PERMANENTLY DELETE user "${uEmail}" and ALL their database records?\n\nThis action CANNOT be undone.`)) {
      try {
        await T.deleteAdminUser(uId);
        loadUsersList();
        alert(`User ${uEmail} has been completely deleted.`);
      } catch (e) {
        alert("Failed to delete user: " + e.message);
      }
    }
  };

  const saveIntervals = async () => {
    const parseList = s => s.split(",").map(x=>parseInt(x.trim(),10)).filter(n=>!isNaN(n));
    await T.persistSettings({
      ...T.settings,
      greenIntervals: parseList(intervals.green), yellowIntervals: parseList(intervals.yellow), redIntervals: parseList(intervals.red),
      growthFactor: Number(intervals.growth) || 1.5,
      masteryMinQuestions: Number(intervals.masteryMin) || 3,
      masteryGreenPct: (Number(intervals.masteryPct)||70)/100,
      comfortableGreenPct: (Number(intervals.comfyPct)||50)/100,
    });
    setSavedFlash(true); setTimeout(()=>setSavedFlash(false), 1800);
  };

  const exportCSV = () => {
    const topicById = Object.fromEntries(T.topics.map(t=>[t.id,t]));
    const patternById = Object.fromEntries(T.patterns.map(p=>[p.id,p]));
    const header = ["Topic","Pattern","Seq","Difficulty","Status","Confidence","LastSolved","NextRevision","TimeTaken","NeededHint","KeyConcept","Notes","ProblemLink"];
    const rows = T.questions.map(q => [
      topicById[q.topicId]?.name, patternById[q.patternId]?.name, q.seq, q.difficulty, q.status, q.confidence||"", q.lastSolvedAt||"", q.nextRevision||"",
      q.timeTaken ?? "", q.neededHint ? "Yes":"No", q.keyConcept||"", (q.notes||"").replace(/\n/g," "), q.problemLink||""
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "dsa_questions_export.csv"; a.click();
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const topicById = Object.fromEntries(T.topics.map(t=>[t.id,t]));
      const patternById = Object.fromEntries(T.patterns.map(p=>[p.id,p]));
      const qRows = T.questions.map(q => ({
        Topic: topicById[q.topicId]?.name, Pattern: patternById[q.patternId]?.name, Seq: q.seq, Difficulty: q.difficulty,
        Status: q.status, Confidence: q.confidence||"", LastSolved: q.lastSolvedAt||"", NextRevision: q.nextRevision||"",
        TimeTaken: q.timeTaken ?? "", NeededHint: q.neededHint?"Yes":"No", KeyConcept: q.keyConcept||"", Notes: q.notes||"", ProblemLink: q.problemLink||""
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(qRows), "Questions");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(T.topics.map(t=>({Topic:t.name}))), "Topics");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(T.patterns.map(p=>({Topic:topicById[p.topicId]?.name, Pattern:p.name}))), "Patterns");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(T.revisions.map(r=>({...r}))), "Revisions");
      XLSX.writeFile(wb, "dsa_tracker_export.xlsx");
    } catch (e) { alert("Excel export needs the xlsx library, which isn't available here — use Export CSV instead."); }
  };

  return (
    <div className="fade-in max-w-4xl">
      <h1 className="text-2xl font-extrabold mb-6">Settings</h1>

      <div className="card p-5 mb-5">
        <p className="font-bold text-sm mb-1">Revision Algorithm</p>
        <p className="text-xs mb-4" style={{color:'var(--muted)'}}>Comma-separated day intervals per revision, in order. Beyond the list, intervals grow by the growth factor.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Green intervals (days)"><input className={inputCls} value={intervals.green} onChange={e=>setIntervals(v=>({...v,green:e.target.value}))} /></Field>
          <Field label="Yellow intervals (days)"><input className={inputCls} value={intervals.yellow} onChange={e=>setIntervals(v=>({...v,yellow:e.target.value}))} /></Field>
          <Field label="Red intervals (days)"><input className={inputCls} value={intervals.red} onChange={e=>setIntervals(v=>({...v,red:e.target.value}))} /></Field>
          <Field label="Growth factor beyond list"><input type="number" step="0.1" className={inputCls} value={intervals.growth} onChange={e=>setIntervals(v=>({...v,growth:e.target.value}))} /></Field>
          <Field label="Mastery — min questions"><input type="number" className={inputCls} value={intervals.masteryMin} onChange={e=>setIntervals(v=>({...v,masteryMin:e.target.value}))} /></Field>
          <Field label="Mastery — green % required"><input type="number" className={inputCls} value={intervals.masteryPct} onChange={e=>setIntervals(v=>({...v,masteryPct:e.target.value}))} /></Field>
          <Field label="Comfortable — green % required"><input type="number" className={inputCls} value={intervals.comfyPct} onChange={e=>setIntervals(v=>({...v,comfyPct:e.target.value}))} /></Field>
        </div>
        <button onClick={saveIntervals} className="btn-primary px-4 py-2 rounded-lg text-sm mt-2 flex items-center gap-1.5"><Save size={14}/> Save Algorithm Settings</button>
        {savedFlash && <span className="text-xs ml-3" style={{color:'var(--green)'}}>Saved.</span>}
      </div>

      <div className="card p-5 mb-5">
        <p className="font-bold text-sm mb-3">Data Export</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={exportCSV} className="btn-ghost px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5"><Download size={14}/> Export CSV</button>
          <button onClick={exportExcel} className="btn-ghost px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5"><Download size={14}/> Export Excel</button>
        </div>
      </div>

      {/* ADMIN CONTROL PANEL: VISIBLE ONLY TO USERS WITH role === "ADMIN" (enforced server-side too) */}
      {isAdmin && (
        <div className="card p-5 mb-5" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                👑 Admin Panel — All Registered Database Users ({adminUsers.length})
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                As an Admin (<span className="mono font-semibold" style={{ color: 'var(--accent)' }}>{T.user?.email}</span>), you can view all registered users in the database and delete any specific user's data with one click.
              </p>
            </div>
            <button onClick={loadUsersList} className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold">
              Refresh Users List
            </button>
          </div>

          {loadingAdminUsers ? (
            <p className="text-xs mono py-4 text-center" style={{ color: 'var(--muted)' }}>Loading registered users...</p>
          ) : adminUsers.length === 0 ? (
            <EmptyNote text="No registered users found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b text-[11px] uppercase mono" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                    <th className="p-2">User Email</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">E-mail Verified</th>
                    <th className="p-2">Created Date</th>
                    <th className="p-2">Questions Solved</th>
                    <th className="p-2">Total Logged</th>
                    <th className="p-2 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map(u => (
                    <tr key={u.id} className="border-b hover:bg-[var(--surface)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                      <td className="p-2 font-bold mono">
                        {u.email} {u.email === T.user?.email && <span className="text-[10px] px-1.5 py-0.5 rounded ml-1" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>(You)</span>}
                        {u.name ? <p className="text-[10px] font-normal not-mono" style={{ color: 'var(--muted)' }}>{u.name}</p> : null}
                      </td>
                      <td className="p-2">
                        {u.role === "ADMIN" ? <Badge tone="green">ADMIN</Badge> : <Badge tone="neutral">USER</Badge>}
                      </td>
                      <td className="p-2">
                        {u.isActive === false ? <Badge tone="red">Disabled</Badge> : <Badge tone="green">Active</Badge>}
                      </td>
                      <td className="p-2">
                        {u.isVerified === false ? <Badge tone="yellow">Unverified</Badge> : <Badge tone="neutral">Verified</Badge>}
                      </td>
                      <td className="p-2 mono" style={{ color: 'var(--muted)' }}>{fmtDate(u.createdAt)}</td>
                      <td className="p-2 mono font-bold" style={{ color: 'var(--green)' }}>{u.questionsSolved}</td>
                      <td className="p-2 mono" style={{ color: 'var(--muted)' }}>{u.totalQuestionsLogged}</td>
                      <td className="p-2">
                        <div className="flex items-center justify-end gap-2">
                          {u.email !== T.user?.email && (
                            <button
                              onClick={async () => {
                                try {
                                  const next = !(u.isActive === false);
                                  await T.updateAdminUser(u.id, { isActive: next });
                                  loadUsersList();
                                } catch (e) { alert(e.message); }
                              }}
                              className="px-2.5 py-1 rounded text-xs font-semibold"
                              style={{ background: 'var(--surface2)', color: u.isActive === false ? 'var(--green)' : 'var(--red)', border: '1px solid var(--border)' }}
                            >
                              {u.isActive === false ? "Enable" : "Disable"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSpecificUser(u.id, u.email)}
                            className="px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                            style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--border)' }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card p-5" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
        <p className="font-bold text-sm mb-1 flex items-center gap-1.5" style={{ color: 'var(--red)' }}>
          <Trash2 size={16} /> Account & Complete Data Management
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
          Permanently delete your user account (<span className="mono font-semibold" style={{ color: 'var(--accent)' }}>{T.user?.email}</span>) and purge all your logged questions, patterns, topics, and revision history from the database.
        </p>
        <button
          onClick={() => {
            if (window.confirm(`PERMANENTLY DELETE ACCOUNT (${T.user?.email})?\n\nThis will completely wipe all your topics, patterns, solved questions, and revision history from the database. This action CANNOT be undone.`)) {
              T.deleteAccount();
            }
          }}
          className="px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"
          style={{ background: 'var(--red)', color: '#fff8ee' }}
        >
          <Trash2 size={14} /> Delete Account & Purge All Data
        </button>
      </div>
    </div>
  );
}

/* ============================== REVISION MODAL ============================== */
function RevisionModal({ question, topic, pattern, settings, onSubmit, onClose }){
  const [date, setDate] = useState("");
  const [result, setResult] = useState(null); // Green | Yellow | Red
  const canSubmit = date && result;
  return (
    <Modal title="Log Revision" onClose={onClose}>
      <p className="mono text-sm path-crumb mb-3"><b>{topic?.name}</b> / <b>{pattern?.name}</b> / <b>#{question.seq}</b></p>
      <Field label="Revision Date — the actual day you revised this (you choose it)" required>
        <input type="date" className={inputCls} value={date} onChange={e=>setDate(e.target.value)} />
      </Field>
      <Field label="How did it go?" required>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={()=>setResult("Green")} className={`py-2.5 rounded-lg text-sm font-semibold border ${result==="Green" ? "badge-green" : "btn-ghost"}`}>Solved — Green</button>
          <button onClick={()=>setResult("Yellow")} className={`py-2.5 rounded-lg text-sm font-semibold border ${result==="Yellow" ? "badge-yellow" : "btn-ghost"}`}>Solved — Yellow</button>
          <button onClick={()=>setResult("Red")} className={`py-2.5 rounded-lg text-sm font-semibold border ${result==="Red" ? "badge-red" : "btn-ghost"}`}>Struggled — Red</button>
        </div>
      </Field>
      {date && result && (
        <p className="text-xs mono mt-2" style={{color:'var(--muted)'}}>
          Next revision will be calculated as {result} interval #{question.revisionCount+1} from {fmtDate(date)}.
        </p>
      )}
      <div className="flex justify-between gap-2 mt-5 pt-4 border-t" style={{borderColor:'var(--border)'}}>
        <button onClick={onClose} className="btn-ghost px-4 py-2 rounded-lg text-sm font-semibold">Skip for now</button>
        <button disabled={!canSubmit} onClick={()=>onSubmit(date, result)} className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-40">Submit Revision</button>
      </div>
    </Modal>
  );
}

/* ============================== QUESTION DETAIL MODAL ============================== */
function QuestionDetail({ question, topic, pattern, revisions, onClose, onEdit, onDelete }){
  const revs = revisions.filter(r => r.questionId === question.id).sort((a,b)=> a.actualRevisionDate < b.actualRevisionDate ? 1 : -1);
  return (
    <Modal title="Question Details" onClose={onClose} wide>
      <div className="flex items-center justify-between mb-4">
        <p className="mono text-sm path-crumb"><b>{topic?.name}</b> / <b>{pattern?.name}</b> / <b className="text-lg" style={{color:'var(--accent)'}}>#{question.seq}</b></p>
        <div className="flex gap-2">
          {onEdit && <button onClick={onEdit} className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"><Edit3 size={13}/> Edit</button>}
          <button onClick={onDelete} className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1" style={{background:'var(--red-dim)', color:'var(--red)'}}><Trash2 size={13}/> Delete</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="card p-3"><p className="text-[11px]" style={{color:'var(--muted)'}}>Difficulty</p><p className="font-semibold text-sm mt-0.5">{question.difficulty}</p></div>
        <div className="card p-3"><p className="text-[11px]" style={{color:'var(--muted)'}}>Status</p><p className="font-semibold text-sm mt-0.5">{question.status}</p></div>
        <div className="card p-3"><p className="text-[11px]" style={{color:'var(--muted)'}}>Confidence</p><div className="mt-1"><ConfidenceBadge c={question.confidence}/></div></div>
        <div className="card p-3"><p className="text-[11px]" style={{color:'var(--muted)'}}>Hint Needed</p><p className="font-semibold text-sm mt-0.5">{question.neededHint ? "Yes" : "No"}</p></div>
        <div className="card p-3"><p className="text-[11px]" style={{color:'var(--muted)'}}>Last Solved</p><p className="font-semibold text-sm mt-0.5 mono">{fmtDate(question.lastSolvedAt)}</p></div>
        <div className="card p-3"><p className="text-[11px]" style={{color:'var(--muted)'}}>Next Revision</p><p className="font-semibold text-sm mt-0.5 mono">{fmtDate(question.nextRevision)}</p></div>
        <div className="card p-3"><p className="text-[11px]" style={{color:'var(--muted)'}}>Time Taken</p><p className="font-semibold text-sm mt-0.5">{question.timeTaken ? `${question.timeTaken} min` : "—"}</p></div>
        <div className="card p-3"><p className="text-[11px]" style={{color:'var(--muted)'}}>Revisions Logged</p><p className="font-semibold text-sm mt-0.5">{question.revisionCount}</p></div>
      </div>
      {question.keyConcept && <div className="mb-3"><p className="text-[11px] mb-1" style={{color:'var(--muted)'}}>Key Pattern / Concept</p><p className="text-sm">{question.keyConcept}</p></div>}
      {question.notes && <div className="mb-3"><p className="text-[11px] mb-1" style={{color:'var(--muted)'}}>Notes</p><p className="text-sm whitespace-pre-wrap">{question.notes}</p></div>}
      {question.problemLink && <a href={question.problemLink} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center gap-1 mb-3" style={{color:'var(--accent)'}}><Link2 size={13}/> {question.problemLink} <ExternalLink size={12}/></a>}
      <div className="mt-4">
        <p className="text-xs font-semibold mb-2" style={{color:'var(--muted)'}}>Revision History</p>
        {revs.length === 0 ? <p className="text-sm" style={{color:'var(--muted2)'}}>No revisions logged yet.</p> : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs mono">
              <thead><tr style={{color:'var(--muted)'}} className="text-left"><th className="py-1.5 pr-3">#</th><th className="py-1.5 pr-3">Actual Date</th><th className="py-1.5 pr-3">Confidence</th><th className="py-1.5 pr-3">Prev Interval</th><th className="py-1.5 pr-3">Next Revision (days)</th></tr></thead>
              <tbody>
                {revs.map(r => (
                  <tr key={r.id} className="border-t" style={{borderColor:'var(--border)'}}>
                    <td className="py-1.5 pr-3">{r.revisionNumber}</td>
                    <td className="py-1.5 pr-3">{fmtDate(r.actualRevisionDate)}</td>
                    <td className="py-1.5 pr-3"><ConfidenceBadge c={r.confidence}/></td>
                    <td className="py-1.5 pr-3">{r.previousIntervalDays != null ? `${r.previousIntervalDays}d` : "—"}</td>
                    <td className="py-1.5 pr-3">+{r.nextIntervalDays}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ============================== NAVIGATION ============================== */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tracker", label: "Question Tracker", icon: ListChecks },
  { id: "roadmap", label: "DSA Roadmap & Patterns", icon: GitBranch },
  { id: "pattern-hunt", label: "Pattern Hunt", icon: Target },
  { id: "revision", label: "Revision Planner", icon: RotateCcw },
  { id: "daily-revision", label: "Daily Revision Queue", icon: Flame },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

/* ============================== MAIN APP ============================== */
export default function App(){
  const T = useApiTracker();
  const [page, setPageState] = useState(() => {
    return localStorage.getItem("dsa_active_page") || "dashboard";
  });

  const setPage = useCallback((newPage) => {
    localStorage.setItem("dsa_active_page", newPage);
    setPageState(newPage);
  }, []);
  const [mobileNav, setMobileNav] = useState(false);
  const [detailQ, setDetailQ] = useState(null);
  const [revisingQ, setRevisingQ] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const overall = useMemo(() => T.loading || !T.user ? null : calcOverall(T.topics, T.patterns, T.questions, T.phProblems, T.settings), [T.loading, T.user, T.topics, T.patterns, T.questions, T.phProblems, T.settings]);

  if (!T.token || !T.user) {
    if (T.loading) return (
      <div className="dsa-root flex flex-col items-center justify-center min-h-screen p-4"><GlobalStyle/>
        <div className="card p-6 max-w-sm text-center space-y-3 fade-in">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mono text-sm font-semibold" style={{color:'var(--accent)'}}>Loading DSA Tracker…</p>
          <p className="text-xs" style={{color:'var(--muted)'}}>Connecting to local server...</p>
          <div className="pt-2">
            <button
              onClick={() => T.logout()}
              className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              Reset Session / Go to Login
            </button>
          </div>
        </div>
      </div>
    );
    return <AuthScreen onLogin={T.login} onSignup={T.signup} onVerify={T.verifyOtp} onResendOtp={T.resendOtp} />;
  }

  /* ---------- mutations ---------- */
  const deleteQuestion = async (id) => {
    await T.deleteQuestion(id);
    setConfirmDel(null); setDetailQ(null);
  };

  const submitRevision = async (question, actualDate, confidence) => {
    await T.submitRevision(question, actualDate, confidence);
    setRevisingQ(null);
  };

  if (T.loading) return (
    <div className="dsa-root flex items-center justify-center min-h-screen"><GlobalStyle/>
      <p className="mono text-sm" style={{color:'var(--muted)'}}>Loading tracker…</p>
    </div>
  );

  const topicById = Object.fromEntries(T.topics.map(t=>[t.id,t]));
  const patternById = Object.fromEntries(T.patterns.map(p=>[p.id,p]));

  return (
    <div className="dsa-root min-h-screen flex">
      <GlobalStyle/>
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r p-4 sticky top-0 h-screen" style={{borderColor:'var(--border)'}}>
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black mono" style={{background:'var(--accent)', color:'#fff8ee'}}>{'</>'}</div>
          <div>
            <p className="font-extrabold text-sm leading-tight">CodeCance</p>
            <p className="text-[11px] mono" style={{color:'var(--muted2)'}}>pattern tracker</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={()=>setPage(n.id)} className={`sidebar-item w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium ${page===n.id?'active':''}`}>
              <n.icon size={16}/> {n.label}
            </button>
          ))}
        </nav>

        {/* User Account & Logout */}
        <div className="pt-3 border-t mt-3" style={{borderColor:'var(--border)'}}>
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-semibold mono truncate max-w-[130px]" style={{color:'var(--text)'}} title={T.user?.email}>
              {T.user?.email}
            </span>
            <button onClick={T.logout} title="Log Out" className="btn-ghost p-1.5 rounded-lg text-xs text-[var(--red)]">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b" style={{background:'var(--bg)', borderColor:'var(--border)'}}>
        <button onClick={()=>setMobileNav(true)} className="btn-ghost p-2 rounded-lg"><Menu size={18}/></button>
        <p className="font-extrabold text-sm">{NAV.find(n=>n.id===page)?.label}</p>
        <div className="w-6" />
      </div>
      {mobileNav && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onMouseDown={(e)=>{ if(e.target===e.currentTarget) setMobileNav(false); }}>
          <div className="w-64 h-full p-4 flex flex-col justify-between" style={{background:'var(--bg)'}}>
            <div>
              <div className="flex justify-between items-center mb-5"><p className="font-extrabold text-sm">Menu</p><button onClick={()=>setMobileNav(false)} className="btn-ghost p-1.5 rounded-lg"><X size={16}/></button></div>
              {NAV.map(n => (
                <button key={n.id} onClick={()=>{ setPage(n.id); setMobileNav(false); }} className={`sidebar-item w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium mb-1 ${page===n.id?'active':''}`}>
                  <n.icon size={16}/> {n.label}
                </button>
              ))}
            </div>
            <div className="pt-3 border-t" style={{borderColor:'var(--border)'}}>
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-semibold truncate max-w-[130px]" style={{color:'var(--text)'}} title={T.user?.email}>
                  {T.user?.name || T.user?.email}
                </span>
                <button onClick={T.logout} title="Log Out" className="btn-ghost p-1.5 rounded-lg text-xs text-[var(--red)]">
                  <LogOut size={14} />
                </button>
              </div>
              <p className="text-[10px] mono px-2 pb-1 truncate max-w-[200px]" style={{color:'var(--muted2)'}}>{T.user?.email}</p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 pb-20 md:pb-8 scrollbar-thin max-w-full overflow-x-hidden">
        {page === "dashboard" && overall && <Dashboard T={T} overall={overall} onGoto={setPage} />}
        {page === "tracker" && <Tracker T={T} topicById={topicById} patternById={patternById} onDelete={(q)=>setConfirmDel({ type:'question', id: q.id })} />}
        {page === "roadmap" && <UnifiedRoadmapPatterns T={T} onGoto={setPage} />}
        {page === "pattern-hunt" && <PatternHunt T={T} onGoto={setPage} />}
        {page === "revision" && <RevisionPlanner T={T} topicById={topicById} patternById={patternById} onRevise={setRevisingQ} onView={setDetailQ} />}
        {page === "daily-revision" && <DailyRevision T={T} topicById={topicById} patternById={patternById} onRevise={setRevisingQ} onView={setDetailQ} />}
        {page === "analytics" && overall && <Analytics T={T} overall={overall} />}
        {page === "settings" && <SettingsPage T={T} />}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t py-1.5" style={{background:'var(--bg)', borderColor:'var(--border)'}}>
        {NAV.slice(0,5).map(n => (
          <button key={n.id} onClick={()=>setPage(n.id)} className="flex flex-col items-center gap-0.5 px-2 py-1" style={{color: page===n.id ? 'var(--accent)' : 'var(--muted)'}}>
            <n.icon size={18}/><span className="text-[9px] font-medium">{n.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {detailQ && (
        <QuestionDetail question={detailQ} topic={topicById[detailQ.topicId]} pattern={patternById[detailQ.patternId]} revisions={T.revisions}
          onClose={()=>setDetailQ(null)} onDelete={()=>setConfirmDel({ type:'question', id: detailQ.id })} />
      )}
      {revisingQ && (
        <RevisionModal question={revisingQ} topic={topicById[revisingQ.topicId]} pattern={patternById[revisingQ.patternId]} settings={T.settings}
          onClose={()=>setRevisingQ(null)} onSubmit={(date, conf)=>submitRevision(revisingQ, date, conf)} />
      )}
      {confirmDel && (
        <ConfirmDialog msg="This will permanently delete this record and its history. Continue?" onCancel={()=>setConfirmDel(null)}
          onConfirm={()=>{
            if (confirmDel.type === 'question') deleteQuestion(confirmDel.id);
          }} />
      )}
    </div>
  );
}
