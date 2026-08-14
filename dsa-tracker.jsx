import { useState, useEffect, useMemo, useCallback } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import {
  Plus, LayoutDashboard, ListChecks, GitBranch, Layers, RotateCcw, BarChart2,
  Settings as SettingsIcon, Search, X, ChevronRight, ChevronDown, Clock,
  AlertTriangle, Download, Upload, Trash2, Edit3, ExternalLink, Menu, Flame,
  CheckCircle2, Circle, MinusCircle, Calendar, Link2, Save, ArrowLeft
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

/* ============================== SEED ROADMAP ============================== */
const ROADMAP_SOURCE = {
  "Arrays": ["Traversal","Hashing","Frequency Counting","Prefix Sum","Difference Array","Kadane's Algorithm","Two Sum","Three Sum","Four Sum","Sorting-Based Problems","Dutch National Flag","Majority Element","Stock Buy/Sell","Merge Intervals","Subarrays","Subsequences","Matrix Traversal","Spiral Matrix","Rotate Matrix","Set Matrix Zeroes","Pascal's Triangle","Cyclic Sort","Missing & Repeating Number","Range Queries"],
  "Strings": ["Character Frequency","Hashing","Two Pointer","Sliding Window","Palindrome","Anagram","Substrings","Subsequences","String Matching","Pattern Matching","Prefix Function","KMP","Z Algorithm","Rolling Hash","Trie-Based String Problems","String Transformation"],
  "Binary Search": ["Basic Binary Search","Lower Bound","Upper Bound","Search Insert Position","First Occurrence","Last Occurrence","Count Occurrences","Search in Rotated Sorted Array","Search in Rotated (Duplicates)","Find Minimum in Rotated Array","Peak Element","Single Element in Sorted Array","Binary Search on Answer","Koko Eating Bananas","Capacity to Ship Packages","Book Allocation","Aggressive Cows","Split Array","Median of Two Sorted Arrays"],
  "Linked List": ["Traversal","Reversal","Reverse in Groups","Middle of Linked List","Fast & Slow Pointer","Cycle Detection","Cycle Entry Point","Remove Nth Node","Merge Two Lists","Merge K Lists","Intersection","Palindrome","Reordering","Sorting","Flattening","Doubly Linked List","Random Pointer"],
  "Recursion": ["Basic Recursion","Subsequences","Subsets","Permutations","Combination Sum","Combinations","Generate Parentheses"],
  "Backtracking": ["Palindrome Partitioning","N-Queens","Sudoku Solver","Rat in a Maze","Word Search","Grid Backtracking","Subset Backtracking"],
  "Bit Manipulation": ["Basic Bit Operations","XOR Tricks","Single Number","Counting Bits","Power of Two","Subsets via Bitmask","Bit DP Basics"],
  "Stack": ["Stack Basics","Monotonic Stack","Next Greater Element","Next Smaller Element","Previous Greater/Smaller Element","Largest Rectangle in Histogram","Stock Span","Parentheses Matching","Min Stack","Expression Evaluation"],
  "Queue": ["Queue Basics","Monotonic Queue","Circular Queue","Queue Using Stack","Stack Using Queue","Sliding Window Maximum","Deque"],
  "Sliding Window": ["Fixed Size Window","Variable Size Window","Longest Substring Patterns","Minimum Window Substring","At Most K Distinct","Window with Frequency Map"],
  "Two Pointer": ["Opposite Direction","Same Direction","Sorted Array Two Pointer","Partitioning","Container With Most Water","Trapping Rain Water"],
  "Heap / Priority Queue": ["Min Heap","Max Heap","Kth Largest/Smallest","Top K Elements","K Closest Elements","Merge K Sorted Lists","Median from Data Stream","Two Heap Pattern","Task Scheduling","Greedy + Heap"],
  "Greedy": ["Activity Selection","Interval Scheduling","Fractional Knapsack","Job Sequencing","Gas Station","Jump Game","Greedy + Sorting"],
  "Binary Trees": ["DFS Traversals","BFS / Level Order","Height & Depth","Diameter","Balanced Tree Check","Maximum Path Sum","Lowest Common Ancestor","Tree Views","Boundary Traversal","Vertical Traversal","Zigzag Traversal","Serialize / Deserialize","Construct Tree from Traversals","Morris Traversal","Root to Leaf Paths"],
  "Binary Search Trees": ["Search","Insert","Delete","Validate BST","LCA in BST","Kth Smallest/Largest","Predecessor/Successor","Recover BST","BST Iterator","Balanced BST Construction"],
  "Graphs": ["Graph Representation","BFS","DFS","Connected Components","Cycle Detection (Undirected)","Cycle Detection (Directed)","Bipartite Graph","Topological Sort (Kahn's)","Topological Sort (DFS)","Dijkstra","Bellman-Ford","Floyd-Warshall","0-1 BFS","Prim's MST","Kruskal's MST","Bridges","Articulation Points","Strongly Connected Components","Multi-source BFS","Grid Graphs","Word Ladder"],
  "Trie": ["Trie Construction","Word Search with Trie","Prefix Matching","Auto-complete","XOR Trie"],
  "Disjoint Set Union": ["DSU Basics","Union by Rank/Size","Path Compression","Kruskal's with DSU","Number of Components","Cycle Detection with DSU"],
  "Segment Tree": ["Segment Tree Construction","Range Sum Query","Range Min/Max Query","Point Update","Range Update (Lazy Propagation)","Merge Sort Tree"],
  "Fenwick Tree / BIT": ["BIT Construction","Point Update Range Query","Range Update Point Query","2D BIT","Inversion Count with BIT"],
  "Dynamic Programming": ["Fibonacci / 1D DP","Climbing Stairs","House Robber","Grid DP","2D DP","Longest Increasing Subsequence","Longest Common Subsequence","Longest Common Substring","Edit Distance","0/1 Knapsack","Unbounded Knapsack","Coin Change","Subset Sum","Partition DP","Target Sum","String DP","Interval DP","Matrix Chain Multiplication","Palindrome DP","Stock DP","State Machine DP","DP on Trees","DP on Graphs","Bitmask DP","Digit DP"],
  "Advanced Graphs": ["Tarjan's Algorithm","Euler Path / Circuit","Minimum Cost to Connect Points","Network Delay Time","Critical Connections","Traveling Salesman (Bitmask)"],
  "Advanced Dynamic Programming": ["DP with Bitmask + Graph","DP with Segment Tree Optimization","Convex Hull Trick","Divide and Conquer DP","Digit DP Advanced","Profile DP"],
  "Mathematical / Number Theory": ["Sieve of Eratosthenes","GCD / LCM","Modular Exponentiation","Modular Inverse","Prime Factorization","Combinatorics (nCr)","Euler's Totient Function"]
};

function buildSeedRoadmap(){
  const topics = []; const patterns = [];
  Object.keys(ROADMAP_SOURCE).forEach((topicName, ti) => {
    const topicId = `t-${ti}-${slug(topicName)}`;
    topics.push({ id: topicId, name: topicName, isCustom: false, order: ti });
    ROADMAP_SOURCE[topicName].forEach((patName, pi) => {
      patterns.push({ id: `p-${ti}-${pi}-${slug(patName)}`, topicId, name: patName, seqCounter: 0, isCustom: false, order: pi });
    });
  });
  return { topics, patterns };
}
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,24); }

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
// Pattern status reflects completion only: whether the questions you logged for
// it are marked Solved. Confidence (green/yellow/red) never demotes a Solved
// pattern back to "Practicing" — instead it's surfaced separately as a "weak" flag.
function patternStatus(stats, settings){
  if (stats.total === 0) return "Not Started";
  if (stats.completed < stats.total) return "Practicing"; // still has un-solved attempts logged
  const greenPct = stats.green / stats.total;
  if (stats.total >= settings.masteryMinQuestions && greenPct >= settings.masteryGreenPct && stats.red === 0) return "Mastered";
  return "Solved";
}
function calcPatternStats(pattern, questions, settings){
  const qs = questions.filter(q => q.patternId === pattern.id);
  const total = qs.length;
  const completed = qs.filter(q => q.status === "Solved").length;
  const green = qs.filter(q => q.confidence === "Green").length;
  const yellow = qs.filter(q => q.confidence === "Yellow").length;
  const red = qs.filter(q => q.confidence === "Red").length;
  const stats = { total, completed, green, yellow, red };
  const status = patternStatus(stats, settings);
  // "Weak" is an observation drawn purely from how confident you were on review —
  // independent of whether the pattern's status is Practicing or Solved.
  const weak = total > 0 && (red > 0 || (yellow / total) >= (settings.weakYellowPct ?? 0.4));
  const lastActivity = qs.reduce((max,q)=> (q.lastSolvedAt && (!max || q.lastSolvedAt > max)) ? q.lastSolvedAt : max, null);
  const nextRevision = qs.reduce((min,q)=> (q.nextRevision && (!min || q.nextRevision < min)) ? q.nextRevision : min, null);
  return { ...stats, status, weak, lastActivity, nextRevision, progress: total ? Math.round(completed/total*100) : 0 };
}
function calcTopicStats(topic, patterns, questions, settings){
  const pats = patterns.filter(p => p.topicId === topic.id);
  const patStats = pats.map(p => ({ pattern: p, stats: calcPatternStats(p, questions, settings) }));
  const totalPatterns = pats.length;
  const covered = patStats.filter(p => p.stats.status !== "Not Started").length;
  const totalQuestions = patStats.reduce((s,p)=>s+p.stats.total,0);
  const completedQuestions = patStats.reduce((s,p)=>s+p.stats.completed,0);
  return {
    totalPatterns, covered, remaining: totalPatterns-covered,
    coverage: totalPatterns ? Math.round(covered/totalPatterns*100) : 0,
    totalQuestions, completedQuestions,
    progress: totalQuestions ? Math.round(completedQuestions/totalQuestions*100) : 0,
    patStats
  };
}
function calcOverall(topics, patterns, questions, settings){
  const topicStats = topics.map(t => ({ topic: t, stats: calcTopicStats(t, patterns, questions, settings) }));
  const totalPatterns = patterns.length;
  const covered = topicStats.reduce((s,t)=>s+t.stats.covered,0);
  const totalQuestions = questions.length;
  const completedQuestions = questions.filter(q=>q.status==="Solved").length;
  const today = localToday();
  const withRevision = questions.filter(q=>q.nextRevision);
  const overdue = withRevision.filter(q=>q.nextRevision < today).length;
  const dueToday = withRevision.filter(q=>q.nextRevision === today).length;
  const upcoming = withRevision.filter(q=>q.nextRevision > today).length;
  const green = questions.filter(q=>q.confidence==="Green").length;
  const yellow = questions.filter(q=>q.confidence==="Yellow").length;
  const red = questions.filter(q=>q.confidence==="Red").length;
  return {
    topicStats, totalPatterns, covered, remaining: totalPatterns-covered,
    coverage: totalPatterns ? Math.round(covered/totalPatterns*100) : 0,
    totalQuestions, completedQuestions, remainingQuestions: totalQuestions-completedQuestions,
    progress: totalQuestions ? Math.round(completedQuestions/totalQuestions*100) : 0,
    overdue, dueToday, upcoming, green, yellow, red
  };
}
function getWeakPatterns(patterns, questions, settings, limit=5){
  return patterns.map(p => ({ pattern: p, stats: calcPatternStats(p, questions, settings) }))
    .filter(p => p.stats.total > 0 && (p.stats.red > 0 || p.stats.yellow >= p.stats.total/2))
    .sort((a,b)=> (b.stats.red - a.stats.red) || (b.stats.yellow - a.stats.yellow))
    .slice(0, limit);
}
function getMasteredPatterns(patterns, questions, settings){
  return patterns.map(p => ({ pattern: p, stats: calcPatternStats(p, questions, settings) }))
    .filter(p => p.stats.status === "Mastered");
}
function getUnpracticed(topics, patterns, questions, settings){
  const byTopic = {};
  patterns.forEach(p => {
    const stats = calcPatternStats(p, questions, settings);
    if (stats.status === "Not Started"){
      const t = topics.find(t=>t.id===p.topicId);
      const key = t ? t.name : "Other";
      if (!byTopic[key]) byTopic[key] = [];
      byTopic[key].push(p);
    }
  });
  return byTopic;
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

/* ============================== STORAGE HOOK ============================== */
function useTracker(){
  const [topics, setTopics] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { (async () => {
    try {
      let roadmap;
      try {
        const r = await window.storage.get('roadmap', false);
        roadmap = r ? JSON.parse(r.value) : null;
      } catch { roadmap = null; }
      if (!roadmap) {
        roadmap = buildSeedRoadmap();
        await window.storage.set('roadmap', JSON.stringify(roadmap), false);
      }
      setTopics(roadmap.topics); setPatterns(roadmap.patterns);

      let qs = [];
      try { const r = await window.storage.get('questions', false); qs = r ? JSON.parse(r.value) : []; } catch { qs = []; }
      setQuestions(qs);

      let revs = [];
      try { const r = await window.storage.get('revisions', false); revs = r ? JSON.parse(r.value) : []; } catch { revs = []; }
      setRevisions(revs);

      let st = DEFAULT_SETTINGS;
      try { const r = await window.storage.get('settings', false); st = r ? { ...DEFAULT_SETTINGS, ...JSON.parse(r.value) } : DEFAULT_SETTINGS; } catch { st = DEFAULT_SETTINGS; }
      setSettings(st);
    } catch (e) { setError("Could not load saved data. Starting fresh."); }
    setLoading(false);
  })(); }, []);

  const persistRoadmap = useCallback(async (t, p) => {
    setTopics(t); setPatterns(p);
    try { await window.storage.set('roadmap', JSON.stringify({ topics: t, patterns: p }), false); } catch {}
  }, []);
  const persistQuestions = useCallback(async (qs) => {
    setQuestions(qs);
    try { await window.storage.set('questions', JSON.stringify(qs), false); } catch {}
  }, []);
  const persistRevisions = useCallback(async (revs) => {
    setRevisions(revs);
    try { await window.storage.set('revisions', JSON.stringify(revs), false); } catch {}
  }, []);
  const persistSettings = useCallback(async (s) => {
    setSettings(s);
    try { await window.storage.set('settings', JSON.stringify(s), false); } catch {}
  }, []);

  return {
    topics, patterns, questions, revisions, settings, loading, error,
    persistRoadmap, persistQuestions, persistRevisions, persistSettings
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

/* ============================== ADD / EDIT QUESTION MODAL ============================== */
function QuestionForm({ initial, topics, patterns, onSave, onClose, defaultTopicId, defaultPatternId }){
  const [topicId, setTopicId] = useState(initial?.topicId || defaultTopicId || (topics[0]?.id ?? ""));
  const [patternId, setPatternId] = useState(initial?.patternId || defaultPatternId || "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "Medium");
  const [status, setStatus] = useState(initial?.status || "Solved");
  const [confidence, setConfidence] = useState(initial?.confidence || "");
  const [lastSolvedAt, setLastSolvedAt] = useState(initial?.lastSolvedAt || "");
  const [timeTaken, setTimeTaken] = useState(initial?.timeTaken ?? "");
  const [neededHint, setNeededHint] = useState(initial?.neededHint ?? false);
  const [keyConcept, setKeyConcept] = useState(initial?.keyConcept || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [problemLink, setProblemLink] = useState(initial?.problemLink || "");

  const availablePatterns = patterns.filter(p => p.topicId === topicId);
  useEffect(() => { if (!availablePatterns.find(p=>p.id===patternId)) setPatternId(availablePatterns[0]?.id || ""); }, [topicId]);

  const canSave = topicId && patternId && difficulty && status;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Topic" required>
          <select className={inputCls} value={topicId} onChange={e=>setTopicId(e.target.value)}>
            {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Pattern" required>
          <select className={inputCls} value={patternId} onChange={e=>setPatternId(e.target.value)}>
            {availablePatterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Difficulty" required>
          <select className={inputCls} value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Status" required>
          <select className={inputCls} value={status} onChange={e=>setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Confidence (optional)">
          <select className={inputCls} value={confidence} onChange={e=>setConfidence(e.target.value)}>
            <option value="">Unrated</option>
            {CONFIDENCES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Last Solved Date (you enter this — never auto-filled)">
          <input type="date" className={inputCls} value={lastSolvedAt} onChange={e=>setLastSolvedAt(e.target.value)} />
        </Field>
        <Field label="Time Taken (minutes)">
          <input type="number" min="0" className={inputCls} value={timeTaken} onChange={e=>setTimeTaken(e.target.value)} placeholder="e.g. 25" />
        </Field>
        <Field label="Needed Hint?">
          <select className={inputCls} value={neededHint ? "yes" : "no"} onChange={e=>setNeededHint(e.target.value==="yes")}>
            <option value="no">No</option><option value="yes">Yes</option>
          </select>
        </Field>
      </div>
      <Field label="Key Pattern / Concept"><input className={inputCls} value={keyConcept} onChange={e=>setKeyConcept(e.target.value)} placeholder="e.g. two-pointer shrink on sum > target" /></Field>
      <Field label="Notes"><textarea className={inputCls} rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Approach, edge cases, what tripped you up..." /></Field>
      <Field label="Problem Link"><input className={inputCls} value={problemLink} onChange={e=>setProblemLink(e.target.value)} placeholder="https://..." /></Field>
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t" style={{borderColor:'var(--border)'}}>
        <button onClick={onClose} className="btn-ghost px-4 py-2 rounded-lg text-sm font-semibold">Cancel</button>
        <button disabled={!canSave} onClick={() => onSave({
          topicId, patternId, difficulty, status,
          confidence: confidence || null,
          lastSolvedAt: lastSolvedAt || null,
          timeTaken: timeTaken === "" ? null : Number(timeTaken),
          neededHint, keyConcept, notes, problemLink
        })} className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-40 flex items-center gap-1.5">
          <Save size={15}/> Save Question
        </button>
      </div>
    </div>
  );
}

/* ============================== REVISION SESSION MODAL ============================== */
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
          <button onClick={onEdit} className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"><Edit3 size={13}/> Edit</button>
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
  { id: "roadmap", label: "DSA Roadmap", icon: GitBranch },
  { id: "patterns", label: "Pattern Overview", icon: Layers },
  { id: "revision", label: "Revision Planner", icon: RotateCcw },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

/* ============================== MAIN APP ============================== */
export default function App(){
  const T = useTracker();
  const [page, setPage] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addDefaults, setAddDefaults] = useState({});
  const [detailQ, setDetailQ] = useState(null);
  const [editQ, setEditQ] = useState(null);
  const [revisingQ, setRevisingQ] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const overall = useMemo(() => T.loading ? null : calcOverall(T.topics, T.patterns, T.questions, T.settings), [T.loading, T.topics, T.patterns, T.questions, T.settings]);

  /* ---------- mutations ---------- */
  const addQuestion = async (data) => {
    const patterns = [...T.patterns];
    const pIdx = patterns.findIndex(p => p.id === data.patternId);
    const seq = patterns[pIdx].seqCounter + 1;
    patterns[pIdx] = { ...patterns[pIdx], seqCounter: seq };
    let nextRevision = null;
    if (data.confidence && data.lastSolvedAt) nextRevision = calculateNextRevision(data.confidence, 0, data.lastSolvedAt, T.settings);
    const q = { id: crypto.randomUUID(), seq, revisionCount: 0, lastRevisedAt: null, nextRevision, createdAt: new Date().toISOString(), ...data };
    await T.persistRoadmap(T.topics, patterns);
    await T.persistQuestions([q, ...T.questions]);
    setAddOpen(false); setAddDefaults({});
  };

  const updateQuestion = async (id, data) => {
    let patterns = T.patterns;
    const qs = T.questions.map(q => {
      if (q.id !== id) return q;
      let seq = q.seq;
      if (data.patternId !== q.patternId) {
        const pIdx = T.patterns.findIndex(p => p.id === data.patternId);
        seq = T.patterns[pIdx].seqCounter + 1;
        patterns = T.patterns.map((p,i) => i===pIdx ? { ...p, seqCounter: seq } : p);
      }
      let nextRevision = q.nextRevision;
      if (q.revisionCount === 0 && data.confidence && data.lastSolvedAt) {
        nextRevision = calculateNextRevision(data.confidence, 0, data.lastSolvedAt, T.settings);
      }
      return { ...q, ...data, seq, nextRevision };
    });
    if (patterns !== T.patterns) await T.persistRoadmap(T.topics, patterns);
    await T.persistQuestions(qs);
    setEditQ(null); setDetailQ(null);
  };

  const deleteQuestion = async (id) => {
    await T.persistQuestions(T.questions.filter(q => q.id !== id));
    await T.persistRevisions(T.revisions.filter(r => r.questionId !== id));
    setConfirmDel(null); setDetailQ(null);
  };

  const submitRevision = async (question, actualDate, confidence) => {
    const newCount = question.revisionCount + 1;
    const baseForPrev = question.lastRevisedAt || question.lastSolvedAt || actualDate;
    const previousIntervalDays = daysBetween(baseForPrev, actualDate);
    const nextRevision = calculateNextRevision(confidence, newCount, actualDate, T.settings);
    const nextIntervalDays = daysBetween(actualDate, nextRevision);
    const rec = {
      id: crypto.randomUUID(), questionId: question.id, revisionNumber: newCount,
      actualRevisionDate: actualDate, confidence, result: confidence === "Red" ? "Struggled" : "Solved",
      previousIntervalDays, nextIntervalDays, createdAt: new Date().toISOString()
    };
    await T.persistRevisions([rec, ...T.revisions]);
    await T.persistQuestions(T.questions.map(q => q.id === question.id ? { ...q, confidence, lastRevisedAt: actualDate, revisionCount: newCount, nextRevision } : q));
    setRevisingQ(null);
  };

  const addTopic = async (name) => {
    const id = `t-custom-${Date.now()}`;
    await T.persistRoadmap([...T.topics, { id, name, isCustom: true, order: T.topics.length }], T.patterns);
  };
  const addPattern = async (topicId, name) => {
    const id = `p-custom-${Date.now()}`;
    await T.persistRoadmap(T.topics, [...T.patterns, { id, topicId, name, seqCounter: 0, isCustom: true, order: T.patterns.length }]);
  };
  const deleteTopic = async (id) => {
    const patIds = T.patterns.filter(p=>p.topicId===id).map(p=>p.id);
    await T.persistRoadmap(T.topics.filter(t=>t.id!==id), T.patterns.filter(p=>p.topicId!==id));
    await T.persistQuestions(T.questions.filter(q=>!patIds.includes(q.patternId)));
  };
  const deletePattern = async (id) => {
    await T.persistRoadmap(T.topics, T.patterns.filter(p=>p.id!==id));
    await T.persistQuestions(T.questions.filter(q=>q.patternId!==id));
  };

  const openAddFor = (topicId, patternId) => { setAddDefaults({ defaultTopicId: topicId, defaultPatternId: patternId }); setAddOpen(true); };

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
            <p className="font-extrabold text-sm leading-tight">DSA A2Z</p>
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
        <button onClick={()=>{ setAddDefaults({}); setAddOpen(true); }} className="btn-primary w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 mt-4">
          <Plus size={16}/> Add Question
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b" style={{background:'var(--bg)', borderColor:'var(--border)'}}>
        <button onClick={()=>setMobileNav(true)} className="btn-ghost p-2 rounded-lg"><Menu size={18}/></button>
        <p className="font-extrabold text-sm">{NAV.find(n=>n.id===page)?.label}</p>
        <button onClick={()=>{ setAddDefaults({}); setAddOpen(true); }} className="btn-primary p-2 rounded-lg"><Plus size={18}/></button>
      </div>
      {mobileNav && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onMouseDown={(e)=>{ if(e.target===e.currentTarget) setMobileNav(false); }}>
          <div className="w-64 h-full p-4" style={{background:'var(--bg)'}}>
            <div className="flex justify-between items-center mb-5"><p className="font-extrabold text-sm">Menu</p><button onClick={()=>setMobileNav(false)} className="btn-ghost p-1.5 rounded-lg"><X size={16}/></button></div>
            {NAV.map(n => (
              <button key={n.id} onClick={()=>{ setPage(n.id); setMobileNav(false); }} className={`sidebar-item w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium mb-1 ${page===n.id?'active':''}`}>
                <n.icon size={16}/> {n.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 pb-20 md:pb-8 scrollbar-thin max-w-full overflow-x-hidden">
        {page === "dashboard" && <Dashboard T={T} overall={overall} onAdd={()=>{setAddDefaults({}); setAddOpen(true);}} onGoto={setPage} onAddFor={openAddFor} />}
        {page === "tracker" && <Tracker T={T} topicById={topicById} patternById={patternById} onView={setDetailQ} onAdd={()=>{setAddDefaults({}); setAddOpen(true);}} />}
        {page === "roadmap" && <Roadmap T={T} onAddFor={openAddFor} />}
        {page === "patterns" && <PatternOverview T={T} onAddFor={openAddFor} />}
        {page === "revision" && <RevisionPlanner T={T} topicById={topicById} patternById={patternById} onRevise={setRevisingQ} />}
        {page === "analytics" && <Analytics T={T} overall={overall} />}
        {page === "settings" && <SettingsPage T={T} addTopic={addTopic} addPattern={addPattern} deleteTopic={deleteTopic} deletePattern={deletePattern} onConfirmDelete={setConfirmDel} />}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t py-1.5" style={{background:'var(--bg)', borderColor:'var(--border)'}}>
        {NAV.slice(0,5).map(n => (
          <button key={n.id} onClick={()=>setPage(n.id)} className="flex flex-col items-center gap-0.5 px-2 py-1" style={{color: page===n.id ? 'var(--accent)' : 'var(--muted)'}}>
            <n.icon size={18}/><span className="text-[9px] font-medium">{n.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {addOpen && (
        <Modal title="Add Question" onClose={()=>{setAddOpen(false); setAddDefaults({});}} wide>
          <QuestionForm topics={T.topics} patterns={T.patterns} onSave={addQuestion} onClose={()=>{setAddOpen(false); setAddDefaults({});}} {...addDefaults} />
        </Modal>
      )}
      {detailQ && !editQ && (
        <QuestionDetail question={detailQ} topic={topicById[detailQ.topicId]} pattern={patternById[detailQ.patternId]} revisions={T.revisions}
          onClose={()=>setDetailQ(null)} onEdit={()=>setEditQ(detailQ)} onDelete={()=>setConfirmDel({ type:'question', id: detailQ.id })} />
      )}
      {editQ && (
        <Modal title="Edit Question" onClose={()=>setEditQ(null)} wide>
          <QuestionForm initial={editQ} topics={T.topics} patterns={T.patterns} onSave={(data)=>updateQuestion(editQ.id, data)} onClose={()=>setEditQ(null)} />
        </Modal>
      )}
      {revisingQ && (
        <RevisionModal question={revisingQ} topic={topicById[revisingQ.topicId]} pattern={patternById[revisingQ.patternId]} settings={T.settings}
          onClose={()=>setRevisingQ(null)} onSubmit={(date, conf)=>submitRevision(revisingQ, date, conf)} />
      )}
      {confirmDel && (
        <ConfirmDialog msg="This will permanently delete this record and its history. Continue?" onCancel={()=>setConfirmDel(null)}
          onConfirm={()=>{
            if (confirmDel.type === 'question') deleteQuestion(confirmDel.id);
            if (confirmDel.type === 'topic') { deleteTopic(confirmDel.id); setConfirmDel(null); }
            if (confirmDel.type === 'pattern') { deletePattern(confirmDel.id); setConfirmDel(null); }
          }} />
      )}
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
function Dashboard({ T, overall, onAdd, onGoto, onAddFor }){
  const weak = getWeakPatterns(T.patterns, T.questions, T.settings, 5);
  const mastered = getMasteredPatterns(T.patterns, T.questions, T.settings);
  const unpracticed = getUnpracticed(T.topics, T.patterns, T.questions, T.settings);
  const today = localToday();
  const solvedToday = T.questions.filter(q => q.lastSolvedAt === today).length;
  const revisedToday = T.revisions.filter(r => r.actualRevisionDate === today).length;

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
        <StatCard label="Total Questions" value={overall.totalQuestions} sub={`${overall.completedQuestions} completed`} />
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
        <button onClick={onAdd} className="btn-primary px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5"><Plus size={15}/> Add Question</button>
        <button onClick={()=>onGoto('revision')} className="btn-ghost px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5"><RotateCcw size={15}/> Start Revision</button>
        <button onClick={()=>onGoto('revision')} className="btn-ghost px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5"><AlertTriangle size={15}/> View Overdue ({overall.overdue})</button>
        <button onClick={()=>onGoto('patterns')} className="btn-ghost px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5"><Flame size={15}/> Weak Patterns</button>
        <button onClick={()=>onGoto('roadmap')} className="btn-ghost px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5"><GitBranch size={15}/> Uncovered Patterns</button>
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
          <p className="font-bold text-sm mb-3 flex items-center gap-1.5"><Circle size={13} style={{color:'var(--muted)'}}/> Not Yet Practiced</p>
          <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-thin pr-1">
            {Object.entries(unpracticed).slice(0,6).map(([topicName, pats]) => (
              <div key={topicName}>
                <p className="text-[11px] font-semibold mb-1" style={{color:'var(--muted)'}}>{topicName}</p>
                {pats.slice(0,3).map(p => (
                  <button key={p.id} onClick={()=>onAddFor(p.topicId, p.id)} className="block text-xs mono w-full text-left py-0.5 hover:underline" style={{color:'var(--muted)'}}>○ {p.name}</button>
                ))}
              </div>
            ))}
          </div>
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

/* ============================== QUESTION TRACKER ============================== */
function Tracker({ T, topicById, patternById, onView, onAdd }){
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
    createdAt: (a,b) => b.q.createdAt.localeCompare(a.q.createdAt),
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
        <button onClick={onAdd} className="btn-primary px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5"><Plus size={15}/> Add Question</button>
      </div>

      <div className="card p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Search size={15} style={{color:'var(--muted)'}}/>
          <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Search by topic, pattern, ID, notes, key concept…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <select className={inputCls+" text-xs"} value={fTopic} onChange={e=>{setFTopic(e.target.value); setFPattern("");}}><option value="">All Topics</option>{T.topics.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <select className={inputCls+" text-xs"} value={fPattern} onChange={e=>setFPattern(e.target.value)}><option value="">All Patterns</option>{availPatterns.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className={inputCls+" text-xs"} value={fDiff} onChange={e=>setFDiff(e.target.value)}><option value="">All Difficulty</option>{DIFFICULTIES.map(d=><option key={d}>{d}</option>)}</select>
          <select className={inputCls+" text-xs"} value={fStatus} onChange={e=>setFStatus(e.target.value)}><option value="">All Status</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
          <select className={inputCls+" text-xs"} value={fConf} onChange={e=>setFConf(e.target.value)}><option value="">All Confidence</option>{CONFIDENCES.map(c=><option key={c}>{c}</option>)}<option value="Unrated">Unrated</option></select>
          <select className={inputCls+" text-xs"} value={fDue} onChange={e=>setFDue(e.target.value)}><option value="">All Due Status</option><option value="overdue">Overdue</option><option value="today">Due Today</option><option value="upcoming">Upcoming</option></select>
          <select className={inputCls+" text-xs"} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
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
            <button key={q.id} onClick={()=>onView(q)} className="card w-full text-left p-3.5 flex items-center flex-wrap gap-x-4 gap-y-2">
              <span className="mono text-sm font-semibold" style={{color:'var(--accent)', minWidth:150}}>{topic?.name} / {pattern?.name} <span style={{color:'var(--text)'}}>#{q.seq}</span></span>
              <Badge tone="neutral">{q.difficulty}</Badge>
              <Badge tone="neutral">{q.status}</Badge>
              <ConfidenceBadge c={q.confidence} />
              <span className="text-xs mono" style={{color:'var(--muted)'}}><Clock size={11} className="inline mr-1"/>{fmtDate(q.lastSolvedAt)}</span>
              {q.nextRevision && <span className="text-xs mono" style={{color: q.nextRevision < today ? 'var(--red)' : q.nextRevision === today ? 'var(--yellow)' : 'var(--muted2)'}}><Calendar size={11} className="inline mr-1"/>next {fmtDate(q.nextRevision)}</span>}
              <ChevronRight size={16} style={{color:'var(--muted2)', marginLeft:'auto'}} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== DSA ROADMAP ============================== */
function Roadmap({ T, onAddFor }){
  const [open, setOpen] = useState({});
  return (
    <div className="fade-in max-w-4xl">
      <h1 className="text-2xl font-extrabold mb-1">DSA Roadmap</h1>
      <p className="text-sm mb-6" style={{color:'var(--muted)'}}>✓ Mastered &nbsp; ◐ In Progress &nbsp; ○ Not Started</p>
      <div className="space-y-2">
        {T.topics.map(topic => {
          const stats = calcTopicStats(topic, T.patterns, T.questions, T.settings);
          const isOpen = open[topic.id] ?? false;
          return (
            <div key={topic.id} className="card overflow-hidden">
              <button onClick={()=>setOpen(o=>({...o,[topic.id]:!isOpen}))} className="w-full flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                  <span className="font-bold text-sm">{topic.name}</span>
                  <span className="text-xs mono" style={{color:'var(--muted2)'}}>{stats.covered}/{stats.totalPatterns} patterns</span>
                </div>
                <div className="flex items-center gap-3 w-40">
                  <ProgressBar pct={stats.coverage} color="var(--indigo)" />
                  <span className="text-xs mono w-9 text-right" style={{color:'var(--muted)'}}>{stats.coverage}%</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t" style={{borderColor:'var(--border)'}}>
                  {stats.patStats.map(({pattern, stats: ps}) => {
                    const glyph = ps.status === "Mastered" ? "✓" : ps.status === "Not Started" ? "○" : "◐";
                    const color = ps.status === "Mastered" ? "var(--green)" : ps.status === "Not Started" ? "var(--muted2)" : "var(--yellow)";
                    return (
                      <button key={pattern.id} onClick={()=>onAddFor(topic.id, pattern.id)} className="w-full flex items-center justify-between py-2 text-left group" style={{borderTop:'1px dashed var(--border)'}}>
                        <span className="mono text-sm flex items-center gap-2"><span style={{color}}>{glyph}</span> {pattern.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs mono" style={{color:'var(--muted2)'}}>{ps.total} q</span>
                          <StatusPill status={ps.status} />
                          <Plus size={13} className="opacity-0 group-hover:opacity-100" style={{color:'var(--accent)'}}/>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== PATTERN OVERVIEW ============================== */
function PatternOverview({ T, onAddFor }){
  const [fStatus, setFStatus] = useState("");
  const rows = T.patterns.map(p => ({ pattern: p, topic: T.topics.find(t=>t.id===p.topicId), stats: calcPatternStats(p, T.questions, T.settings) }))
    .filter(r => !fStatus || r.stats.status === fStatus)
    .sort((a,b) => (a.topic?.name||"").localeCompare(b.topic?.name||"") || a.pattern.order - b.pattern.order);

  return (
    <div className="fade-in max-w-6xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-extrabold">Pattern Overview</h1>
        <select className={inputCls+" text-xs"} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {["Not Started","Started","Practicing","Comfortable","Mastered"].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto scrollbar-thin card">
        <table className="w-full text-xs">
          <thead style={{color:'var(--muted)'}}><tr className="text-left border-b" style={{borderColor:'var(--border)'}}>
            <th className="p-3">Topic</th><th className="p-3">Pattern</th><th className="p-3">Qs</th><th className="p-3">Done</th>
            <th className="p-3">G</th><th className="p-3">Y</th><th className="p-3">R</th><th className="p-3">Progress</th>
            <th className="p-3">Status</th><th className="p-3">Last Activity</th><th className="p-3">Next Revision</th><th className="p-3"></th>
          </tr></thead>
          <tbody>
            {rows.map(({pattern, topic, stats}) => (
              <tr key={pattern.id} className="border-b" style={{borderColor:'var(--border)'}}>
                <td className="p-3 mono" style={{color:'var(--muted)'}}>{topic?.name}</td>
                <td className="p-3 font-semibold">{pattern.name}</td>
                <td className="p-3 mono">{stats.total}</td>
                <td className="p-3 mono">{stats.completed}</td>
                <td className="p-3 mono" style={{color:'var(--green)'}}>{stats.green}</td>
                <td className="p-3 mono" style={{color:'var(--yellow)'}}>{stats.yellow}</td>
                <td className="p-3 mono" style={{color:'var(--red)'}}>{stats.red}</td>
                <td className="p-3 w-24"><ProgressBar pct={stats.progress} /></td>
                <td className="p-3"><StatusPill status={stats.status} /></td>
                <td className="p-3 mono" style={{color:'var(--muted)'}}>{fmtDate(stats.lastActivity)}</td>
                <td className="p-3 mono" style={{color:'var(--muted)'}}>{fmtDate(stats.nextRevision)}</td>
                <td className="p-3"><button onClick={()=>onAddFor(topic.id, pattern.id)} className="btn-ghost px-2 py-1 rounded-md text-[11px] flex items-center gap-1"><Plus size={11}/> Add</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================== REVISION PLANNER ============================== */
function RevisionPlanner({ T, topicById, patternById, onRevise }){
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
              <div key={q.id} className="flex items-center flex-wrap gap-x-3 gap-y-2 p-3 rounded-lg" style={{background:'var(--surface2)'}}>
                <span className="mono text-sm font-semibold" style={{minWidth:170}}>{topic?.name} / {pattern?.name} <span style={{color:'var(--accent)'}}>#{q.seq}</span></span>
                <ConfidenceBadge c={q.confidence} />
                <Badge tone="neutral">{q.difficulty}</Badge>
                <span className="text-xs mono" style={{color:'var(--muted)'}}>last solved {fmtDate(q.lastSolvedAt)}</span>
                {daysOver > 0 && <Badge tone="red">{daysOver}d overdue</Badge>}
                {q.neededHint && <Badge tone="yellow">needed hint</Badge>}
                <button onClick={()=>onRevise(q)} className="btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold ml-auto">Revise Now</button>
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

/* ============================== SETTINGS ============================== */
function SettingsPage({ T, addTopic, addPattern, deleteTopic, deletePattern, onConfirmDelete }){
  const [newTopic, setNewTopic] = useState("");
  const [patTopic, setPatTopic] = useState(T.topics[0]?.id || "");
  const [newPattern, setNewPattern] = useState("");
  const [intervals, setIntervals] = useState({
    green: T.settings.greenIntervals.join(","), yellow: T.settings.yellowIntervals.join(","), red: T.settings.redIntervals.join(","),
    growth: T.settings.growthFactor, masteryMin: T.settings.masteryMinQuestions,
    masteryPct: Math.round(T.settings.masteryGreenPct*100), comfyPct: Math.round(T.settings.comfortableGreenPct*100)
  });
  const [savedFlash, setSavedFlash] = useState(false);

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

  const [importMsg, setImportMsg] = useState("");
  const importExcel = async (file) => {
    setImportMsg("Importing…");
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames.find(n => /question/i.test(n)) || wb.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
      let topics = [...T.topics], patterns = [...T.patterns], questions = [...T.questions];
      let imported = 0, skipped = 0;
      for (const row of rows) {
        const keys = Object.keys(row);
        const get = (re) => { const k = keys.find(k => re.test(k)); return k ? String(row[k]).trim() : ""; };
        const topicName = get(/^topic$/i) || get(/topic/i);
        const patternName = get(/^pattern$/i) || get(/pattern/i);
        if (!topicName || !patternName) { skipped++; continue; }
        let topic = topics.find(t => t.name.toLowerCase() === topicName.toLowerCase());
        if (!topic) { topic = { id: `t-imp-${Date.now()}-${topics.length}`, name: topicName, isCustom: true, order: topics.length }; topics = [...topics, topic]; }
        let pattern = patterns.find(p => p.topicId === topic.id && p.name.toLowerCase() === patternName.toLowerCase());
        if (!pattern) { pattern = { id: `p-imp-${Date.now()}-${patterns.length}`, topicId: topic.id, name: patternName, seqCounter: 0, isCustom: true, order: patterns.length }; patterns = [...patterns, pattern]; }
        const seq = pattern.seqCounter + 1;
        patterns = patterns.map(p => p.id === pattern.id ? { ...p, seqCounter: seq } : p);
        const diffRaw = get(/difficult/i).toLowerCase();
        const difficulty = DIFFICULTIES.find(d => d.toLowerCase() === diffRaw) || "Medium";
        const confRaw = get(/confidence/i).toLowerCase();
        const confidence = CONFIDENCES.find(c => c.toLowerCase() === confRaw) || null;
        const lastSolvedRaw = get(/last\s*solved/i);
        let lastSolvedAt = null;
        if (lastSolvedRaw) { const d = new Date(lastSolvedRaw); if (!isNaN(d)) lastSolvedAt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
        let nextRevision = null;
        if (confidence && lastSolvedAt) nextRevision = calculateNextRevision(confidence, 0, lastSolvedAt, T.settings);
        questions = [{
          id: crypto.randomUUID(), topicId: topic.id, patternId: pattern.id, seq, difficulty,
          status: STATUSES.find(s=>s.toLowerCase()===get(/status/i).toLowerCase()) || "Solved",
          confidence, lastSolvedAt, timeTaken: null, neededHint: /yes|true/i.test(get(/hint/i)),
          keyConcept: get(/concept/i), notes: get(/notes?/i), problemLink: get(/link/i),
          revisionCount: 0, lastRevisedAt: null, nextRevision, createdAt: new Date().toISOString()
        }, ...questions];
        imported++;
      }
      await T.persistRoadmap(topics, patterns);
      await T.persistQuestions(questions);
      setImportMsg(`Imported ${imported} question(s), skipped ${skipped} row(s) without a Topic/Pattern.`);
    } catch (e) { setImportMsg("Import failed — make sure the file is a valid .xlsx with Topic/Pattern columns."); }
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
        <p className="font-bold text-sm mb-3">DSA Management</p>
        <div className="flex gap-2 mb-4">
          <input className={inputCls+" flex-1"} placeholder="New topic name" value={newTopic} onChange={e=>setNewTopic(e.target.value)} />
          <button onClick={()=>{ if(newTopic.trim()){ addTopic(newTopic.trim()); setNewTopic(""); } }} className="btn-ghost px-3 py-2 rounded-lg text-sm font-semibold">Add Topic</button>
        </div>
        <div className="flex gap-2 mb-4">
          <select className={inputCls} value={patTopic} onChange={e=>setPatTopic(e.target.value)}>{T.topics.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <input className={inputCls+" flex-1"} placeholder="New pattern name" value={newPattern} onChange={e=>setNewPattern(e.target.value)} />
          <button onClick={()=>{ if(newPattern.trim() && patTopic){ addPattern(patTopic, newPattern.trim()); setNewPattern(""); } }} className="btn-ghost px-3 py-2 rounded-lg text-sm font-semibold">Add Pattern</button>
        </div>
        <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-3">
          {T.topics.map(t => (
            <div key={t.id}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold" style={{color:'var(--muted)'}}>{t.name}</p>
                <button onClick={()=>onConfirmDelete({type:'topic', id:t.id})} className="text-[11px]" style={{color:'var(--red)'}}>delete topic</button>
              </div>
              {T.patterns.filter(p=>p.topicId===t.id).map(p => (
                <div key={p.id} className="flex items-center justify-between pl-3 py-1 text-xs">
                  <span className="mono">{p.name}</span>
                  <button onClick={()=>onConfirmDelete({type:'pattern', id:p.id})} className="text-[11px]" style={{color:'var(--red)'}}><Trash2 size={11} className="inline"/></button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <p className="font-bold text-sm mb-3">Data</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={exportCSV} className="btn-ghost px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5"><Download size={14}/> Export CSV</button>
          <button onClick={exportExcel} className="btn-ghost px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5"><Download size={14}/> Export Excel</button>
          <label className="btn-ghost px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5 cursor-pointer">
            <Upload size={14}/> Import Excel
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => e.target.files[0] && importExcel(e.target.files[0])} />
          </label>
        </div>
        {importMsg && <p className="text-xs" style={{color:'var(--muted)'}}>{importMsg}</p>}
        <p className="text-[11px] mt-2" style={{color:'var(--muted2)'}}>Import looks for Topic / Pattern / Difficulty / Status / Confidence / Last Solved / Notes / Link columns on the first matching sheet. Once imported, this app's database is the source of truth — the spreadsheet is not re-read.</p>
      </div>
    </div>
  );
}
