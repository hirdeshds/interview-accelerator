import { useEffect, useState, useRef, type ReactNode } from "react";
import {
  analyzeJD,
  analyzeCandidate,
  generateQuestion,
  evaluateAnswer,
  generateReport,
  uploadFile,
  type RoleAnalysis,
  type CandidateAnalysis,
  type QuestionTurn,
  type QuestionResponse,
  type EvalResponse,
  type ReportResponse,
} from "./api";

type View = "dashboard" | "analysis" | "interview" | "report" | "plan" | "history";
type IconName =
  | "home" | "mic" | "book" | "history" | "settings" | "plus" | "arrow"
  | "briefcase" | "clock" | "trend" | "target" | "check" | "alert" | "upload"
  | "file" | "spark" | "stop" | "volume" | "repeat" | "more" | "calendar"
  | "play" | "chevron" | "close" | "user" | "video" | "menu" | "send" | "trash"
  | "camera" | "cameraOff" | "micOff" | "download" | "share" | "printer";

interface CompletedSession {
  id: string;
  roleTitle: string;
  date: string;
  score: number;
  readinessStatus: string;
  readinessCode: "green" | "yellow" | "orange" | "red";
  report: ReportResponse;
  turns: QuestionTurn[];
}

const paths: Record<IconName, ReactNode> = {
  home: <><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7"/></>,
  mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  plus: <path d="M12 5v14M5 12h14"/>, arrow: <path d="m9 18 6-6-6-6"/>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  check: <path d="m5 12 4 4L19 6"/>, alert: <><path d="M12 8v5M12 17h.01"/><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/></>,
  file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/></>,
  spark: <><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15ZM5 3l.7 2.3L8 6l-2.3.7L5 9l-.7-2.3L2 6l2.3-.7L5 3Z"/></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="2"/>,
  volume: <><path d="M5 9H2v6h3l5 4V5L5 9Z"/><path d="M14 9a4 4 0 0 1 0 6M17 6a8 8 0 0 1 0 12"/></>,
  repeat: <><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
  play: <path d="m8 5 11 7-11 7V5Z"/>, chevron: <path d="m7 10 5 5 5-5"/>,
  close: <path d="M6 6l12 12M18 6 6 18"/>, user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  send: <path d="m22 2-7 20-4-9-9-4Zm0 0L11 13"/>,
  trash: <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  cameraOff: <><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/></>,
  micOff: <><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
  printer: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Button({ children, variant = "primary", icon, onClick, className = "", disabled = false }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; icon?: IconName; onClick?: () => void; className?: string; disabled?: boolean }) {
  return <button className={`btn btn-${variant} ${className}`} onClick={onClick} disabled={disabled}>{icon && <Icon name={icon} />}{children}</button>;
}

function Progress({ value, tone = "blue" }: { value: number; tone?: "blue" | "green" | "amber" | "red" }) {
  return <div className="progress-track"><div className={`progress-fill ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "amber" | "blue" | "red" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function ScoreRing({ value, label, small = false }: { value: number; label?: string; small?: boolean }) {
  return <div className={`score-ring ${small ? "small" : ""}`} style={{ "--score": value } as React.CSSProperties}>
    <div className="score-inner"><strong>{value}%</strong>{label && <span>{label}</span>}</div>
  </div>;
}

const nav: { id: View; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "interview", label: "Interviews", icon: "mic" },
  { id: "plan", label: "Preparation", icon: "book" },
  { id: "history", label: "History", icon: "history" },
];

function Logo() {
  return <div className="logo"><span className="logo-mark"><span /></span><b>Student</b><strong>Credibility</strong></div>;
}

function Shell({ view, setView, children }: { view: View; setView: (v: View) => void; children: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  return <div className="app-shell">
    <aside className={mobileNav ? "sidebar open" : "sidebar"}>
      <div className="sidebar-top"><Logo /><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><Icon name="close" /></button></div>
      <nav className="nav-list">
        <div className="nav-caption">INTERVIEW ACCELERATOR</div>
        {nav.map(item => <button key={item.id} className={`nav-item ${view === item.id || (item.id === "interview" && view === "analysis") || (item.id === "history" && view === "report") ? "active" : ""}`} onClick={() => { setView(item.id); setMobileNav(false); }}><Icon name={item.icon} /><span>{item.label}</span></button>)}
      </nav>
      <div className="sidebar-bottom">
        <a href="https://studentcredibility.com" target="_blank" rel="noreferrer" className="nav-item" style={{ textDecoration: 'none' }}>
          <Icon name="spark" /><span>StudentCredibility.com</span>
        </a>
        <div className="support-card">
          <div className="support-icon"><Icon name="spark" /></div>
          <b>AI Interview Engine</b>
          <span>FastAPI Backend Connected</span>
        </div>
      </div>
    </aside>
    <div className="main-shell">
      <div className="sc-branding-bar">
        <div>
          <b>Student Credibility Platform</b> · Personalized AI Interview Accelerator Challenge
        </div>
        <div>
          <a href="https://studentcredibility.com" target="_blank" rel="noreferrer">Visit studentcredibility.com &rarr;</a>
        </div>
      </div>
      <header className="topbar">
        <button className="icon-button menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Icon name="menu" /></button>
        <div className="topbar-title">{view === "dashboard" ? "Dashboard" : view === "analysis" ? "Role & Candidate Intelligence" : view === "interview" ? "AI Interview Simulator" : view === "report" ? "Performance Report" : view === "plan" ? "Preparation Roadmap" : "Interview History"}</div>
        <div className="topbar-actions">
          <Badge tone="green"><span className="live-dot" /> FastAPI Connected</Badge>
          <div className="avatar">AI</div>
          <div className="profile-copy"><b>Candidate Workspace</b><span>Level 1-3 Simulator</span></div>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  </div>;
}

function Dashboard({
  onSetup,
  setView,
  roleAnalysis,
  candidateAnalysis,
  completedSessions,
  onViewReport,
}: {
  onSetup: () => void;
  setView: (v: View) => void;
  roleAnalysis: RoleAnalysis | null;
  candidateAnalysis: CandidateAnalysis | null;
  completedSessions: CompletedSession[];
  onViewReport: (session: CompletedSession) => void;
}) {
  const roleTitle = roleAnalysis?.role_title || "No active role analyzed";
  const fitScore = candidateAnalysis?.job_fit_score || 0;
  const fitLabel = candidateAnalysis?.fit_label || "Setup required";

  const totalCompleted = completedSessions.length;
  const avgScore = totalCompleted > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + s.score, 0) / totalCompleted)
    : 0;

  const latestSession = completedSessions.length > 0 ? completedSessions[0] : null;

  return <div className="page dashboard-page">
    <section className="hero-row">
      <div>
        <div className="eyebrow">STUDENT CREDIBILITY — INTERVIEW ACCELERATOR</div>
        <div className="page-title" role="heading" aria-level={1}>Interview Accelerator Dashboard</div>
        <p>Turn any Job Description and Resume into personalized role intelligence, multi-level AI interviews, and actionable readiness feedback.</p>
      </div>
      <div className="hero-actions">
        <Button variant="secondary" onClick={() => setView("history")}>View history</Button>
        <Button icon="plus" onClick={onSetup}>Prepare for a role</Button>
      </div>
    </section>

    {/* The 6 Student Problems Solved Section */}
    <div style={{ marginBottom: "1.5rem" }}>
      <div className="section-head">
        <div>
          <div className="section-title">Solving the Core Candidate Dilemmas</div>
          <p>Bridging the gap between student resumes and real employer expectations</p>
        </div>
      </div>
      <div className="dilemma-grid">
        <div className="dilemma-card">
          <div className="num">1</div>
          <div>
            <strong>What Employers Seek</strong>
            <p>Decodes JD into required skills, core competencies, and critical keywords.</p>
          </div>
        </div>
        <div className="dilemma-card">
          <div className="num">2</div>
          <div>
            <strong>Resume Fit Match</strong>
            <p>Calculates objective match score, strong matches, and missing requirements.</p>
          </div>
        </div>
        <div className="dilemma-card">
          <div className="num">3</div>
          <div>
            <strong>Expected Questions</strong>
            <p>Generates candidate-specific questions across Screening, Competency & Deep-Dive.</p>
          </div>
        </div>
        <div className="dilemma-card">
          <div className="num">4</div>
          <div>
            <strong>Answer Effectiveness</strong>
            <p>Evaluates answers with actionable feedback, strengths, and STAR ideal direction.</p>
          </div>
        </div>
        <div className="dilemma-card">
          <div className="num">5</div>
          <div>
            <strong>Preparation Gaps</strong>
            <p>Pinpoints Priority 1-3 focus areas with review checklists before the real interview.</p>
          </div>
        </div>
        <div className="dilemma-card">
          <div className="num">6</div>
          <div>
            <strong>Interview Readiness</strong>
            <p>Clear readiness scale: Not Ready 🔴, Needs Prep 🟠, Ready 🟡, Strong Candidate 🟢.</p>
          </div>
        </div>
      </div>
    </div>

    <section className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon blue"><Icon name="briefcase" /></div>
        <div>
          <span>Target Role</span>
          <strong style={{ fontSize: "1.1rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", display: "block" }}>{roleAnalysis ? roleTitle : "Not set up"}</strong>
          <small>{roleAnalysis ? "Active Analysis" : "Click 'Prepare' to analyze JD"}</small>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon violet"><Icon name="trend" /></div>
        <div>
          <span>Average Interview Score</span>
          <strong>{totalCompleted > 0 ? `${avgScore}/100` : "--"}</strong>
          <small>Across {totalCompleted} completed session{totalCompleted === 1 ? "" : "s"}</small>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon green"><Icon name="target" /></div>
        <div>
          <span>Resume Fit Match</span>
          <strong>{roleAnalysis && candidateAnalysis ? `${fitScore}%` : "--"}</strong>
          <small>{roleAnalysis && candidateAnalysis ? <Badge tone="green">{fitLabel}</Badge> : "Run analysis to calculate"}</small>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon amber"><Icon name="mic" /></div>
        <div>
          <span>Simulations Completed</span>
          <strong>{totalCompleted}</strong>
          <small>{totalCompleted > 0 ? "Saved in session history" : "Start 3-level simulation"}</small>
        </div>
      </div>
    </section>

    <section className="dashboard-grid">
      <div className="panel recent-panel">
        <div className="section-head">
          <div>
            <div className="section-title">Active Target Role Intelligence</div>
            <p>Job description & candidate resume alignment breakdown</p>
          </div>
          {completedSessions.length > 0 && (
            <button className="text-button" onClick={() => setView("history")}>
              View history <Icon name="arrow" size={15} />
            </button>
          )}
        </div>

        {roleAnalysis && candidateAnalysis ? (
          <div className="role-card">
            <div className="company-logo">AI</div>
            <div className="role-main">
              <div className="role-top">
                <div><strong>{roleTitle}</strong><span>Personalized AI evaluation</span></div>
                <Badge tone="green">{fitLabel}</Badge>
              </div>
              <div className="role-meta">
                <span><Icon name="check" size={15} /> {candidateAnalysis.candidate_key_skills?.length || 0} skills matched</span>
                <span><Icon name="alert" size={15} /> {candidateAnalysis.missing_skills?.length || 0} gaps identified</span>
              </div>
              <div className="score-row">
                <div><span>Fit Match</span><strong>{fitScore}<small>/100</small></strong></div>
                <div className="mini-progress">
                  <div><span>Skill Alignment</span><b>{fitScore}%</b></div>
                  <Progress value={fitScore} />
                </div>
                <Button variant="secondary" onClick={() => setView("analysis")}>View full analysis <Icon name="arrow" size={15} /></Button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "2.5rem", textAlign: "center", background: "var(--bg-subtle, #f8fafc)", borderRadius: "8px", border: "1px border-dashed #cbd5e1" }}>
            <p style={{ margin: "0 0 1rem 0", color: "#64748b" }}>No active role analyzed yet. Provide a Job Description and Resume to generate custom role intelligence and tailored interview simulations.</p>
            <Button icon="plus" onClick={onSetup}>Setup New Interview Role</Button>
          </div>
        )}

        {latestSession && (
          <div className="upcoming" style={{ marginTop: "1rem" }}>
            <div className="upcoming-date"><b>LAST</b><span>SESSION</span></div>
            <div>
              <Badge tone={latestSession.readinessCode}>{latestSession.readinessStatus}</Badge>
              <strong>{latestSession.roleTitle}</strong>
              <span>Score: {latestSession.score}/100 · {latestSession.date}</span>
            </div>
            <Button variant="ghost" onClick={() => onViewReport(latestSession)}>View Report</Button>
            <Button icon="play" onClick={() => setView("interview")}>Retake Interview</Button>
          </div>
        )}
      </div>

      <div className="panel progress-panel">
        <div className="section-head">
          <div><div className="section-title">Preparation Overview</div><p>Candidate alignment metrics</p></div>
        </div>

        {candidateAnalysis ? (
          <>
            <div className="overall-prep">
              <ScoreRing value={fitScore} small />
              <div>
                <b>{fitLabel}</b>
                <span>{candidateAnalysis.strengths_against_jd?.[0] || "Analysis completed against target role."}</span>
              </div>
            </div>

            <div className="progress-list">
              <div className="progress-item"><div><span>Resume Skill Match</span><b>{fitScore}%</b></div><Progress value={fitScore} tone="green" /></div>
              <div className="progress-item"><div><span>Matched Competencies</span><b>{candidateAnalysis.strong_matches?.length || 0} items</b></div><Progress value={Math.min(100, (candidateAnalysis.strong_matches?.length || 1) * 20)} tone="blue" /></div>
              <div className="progress-item"><div><span>Preparation Gaps</span><b>{candidateAnalysis.preparation_gaps?.length || 0} topics</b></div><Progress value={Math.min(100, (candidateAnalysis.preparation_gaps?.length || 1) * 25)} tone="amber" /></div>
            </div>
          </>
        ) : (
          <p style={{ padding: "1rem", color: "#64748b", fontSize: "0.9rem" }}>Set up a job description to generate real preparation metrics.</p>
        )}

        <button className="full-link" onClick={() => setView("plan")}>View preparation roadmap <Icon name="arrow" size={15} /></button>
      </div>
    </section>

    {candidateAnalysis?.preparation_gaps && candidateAnalysis.preparation_gaps.length > 0 && (
      <section className="panel insights-panel">
        <div className="section-head">
          <div>
            <div className="section-title">Critical Preparation Areas</div>
            <p>Targeted review topics to study before your real interview</p>
          </div>
          <Badge tone="blue"><Icon name="spark" size={13} /> AI ANALYSIS</Badge>
        </div>
        <div className="focus-grid">
          {candidateAnalysis.preparation_gaps.map((gap, i) => (
            <div className={`focus-card ${i === 0 ? "high" : i === 1 ? "" : "success"}`} key={i}>
              <span className="priority">{i === 0 ? "PRIORITY 1" : i === 1 ? "PRIORITY 2" : "RECOMMENDED"}</span>
              <div className="focus-icon"><Icon name={i === 0 ? "alert" : "target"} /></div>
              <div>
                <strong>{gap}</strong>
                <p>Review and practice this domain before your interview.</p>
                <button className="text-button" onClick={() => setView("plan")}>Review roadmap <Icon name="arrow" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>
    )}
  </div>;
}

const SAMPLE_JD = `Role: AI Engineer Intern
Company: Student Credibility
Location: Remote

About the Role:
We are looking for an ambitious AI Engineer Intern to build generative AI applications, intelligent search, and candidate readiness simulations.

Key Responsibilities:
- Design and deploy end-to-end Retrieval-Augmented Generation (RAG) pipelines for document search and knowledge retrieval.
- Build clean, asynchronous backend REST APIs using Python and FastAPI.
- Fine-tune, prompt-engineer, and benchmark Large Language Models (LLMs) for low latency and high factual accuracy.
- Implement vector database indexing (Qdrant, Pinecone) with hybrid search and dynamic reranking.
- Work closely with frontend engineers to integrate real-time voice and telemetry features.

Required Skills:
- Proficiency in Python, object-oriented design, and asynchronous programming.
- Hands-on experience with LLMs (Cohere, OpenAI, Anthropic) and RAG architectures.
- Experience with vector databases (Qdrant, Pinecone, FAISS, ChromaDB).
- Experience designing REST APIs using FastAPI or Flask.
- Foundational understanding of NLP, embeddings, and tokenization.

Preferred Skills:
- Experience with Web Speech API, audio processing, or WebRTC streams.
- Experience with Docker and cloud deployments (Render, AWS, GCP).

Behavioural Competencies:
- Strong problem-solving mindset and analytical rigor.
- Clear technical communication and ability to explain architectural trade-offs.
- High learning velocity and curiosity.`;

const SAMPLE_RESUME = `Alex Chen
Email: alex.chen@university.edu | GitHub: github.com/alexchen-ai | Portfolio: alexchen.dev

EDUCATION:
B.Tech in Computer Science & Engineering (2022 - 2026) | GPA: 8.9/10

TECHNICAL SKILLS:
- Languages: Python (Advanced), TypeScript, JavaScript, SQL
- Frameworks & Libraries: FastAPI, Flask, PyTorch, LangChain, HuggingFace
- AI/ML & LLM: RAG Architectures, Vector Search (Qdrant, Pinecone), Sentence Transformers, Prompt Engineering
- Tools & Cloud: Docker, Git, Linux, PostgreSQL, Render

PROJECTS:
1. Enterprise Knowledge RAG Assistant (FastAPI, Qdrant, Cohere)
- Engineered a modular RAG pipeline indexing 50,000+ academic papers using sentence-transformers embeddings.
- Reduced retrieval latency from 450ms to 120ms by implementing hybrid search and cross-encoder reranking.
- Deployed FastAPI backend on cloud with sub-second end-to-end response times and 92% retrieval precision.

2. Automated Code Review LLM Bot (Python, PyTorch, Transformers)
- Built an automated pull request reviewer using fine-tuned open-source LLMs to identify security vulnerabilities.
- Evaluated model outputs using AST static analysis, achieving an 18% improvement in bug detection over static linters.

3. Multimodal Voice Assistant (FastAPI, Web Speech API)
- Developed a real-time conversational agent supporting speech-to-text transcription and audio response streaming.

EXPERIENCE:
Machine Learning Research Assistant | University AI Lab (May 2024 - Dec 2024)
- Investigated hallucination mitigation techniques in small-parameter language models.
- Authored benchmarks evaluating trade-offs between chunk size, embedding dimensions, and context retention in RAG pipelines.`;

function SetupModal({
  onClose,
  onAnalyze,
  jdText,
  setJdText,
  resumeText,
  setResumeText,
  apiKey,
  setApiKey,
}: {
  onClose: () => void;
  onAnalyze: () => void;
  jdText: string;
  setJdText: (s: string) => void;
  resumeText: string;
  setResumeText: (s: string) => void;
  apiKey?: string;
  setApiKey?: (s: string) => void;
}) {
  const [jdMode, setJdMode] = useState<"paste" | "upload">("paste");
  const [resumeMode, setResumeMode] = useState<"paste" | "upload">("paste");
  const [uploadingJd, setUploadingJd] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoadSample = () => {
    setJdMode("paste");
    setResumeMode("paste");
    setJdText(SAMPLE_JD);
    setResumeText(SAMPLE_RESUME);
    setErrorMsg(null);
  };

  const handleJdUpload = async (file: File) => {
    setUploadingJd(true);
    setErrorMsg(null);
    try {
      const res = await uploadFile(file);
      setJdText(res.text);
      setJdFileName(res.filename);
    } catch (err: any) {
      setErrorMsg(`JD upload failed: ${err.message}`);
    } finally {
      setUploadingJd(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    setUploadingResume(true);
    setErrorMsg(null);
    try {
      const res = await uploadFile(file);
      setResumeText(res.text);
      setResumeFileName(res.filename);
    } catch (err: any) {
      setErrorMsg(`Resume upload failed: ${err.message}`);
    } finally {
      setUploadingResume(false);
    }
  };

  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-head">
        <div>
          <div className="modal-title">Prepare for a Specific Job Interview</div>
          <p>Provide the job description and candidate resume. FastAPI will analyze fit and generate technical interview questions.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Button variant="secondary" icon="spark" onClick={handleLoadSample}>Load Sample JD & Resume</Button>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>
        </div>
      </div>
      
      {errorMsg && <div className="adaptive-banner" style={{ background: '#fee2e2', color: '#991b1b', margin: '0 0 1rem 0' }}><Icon name="alert" /><div><b>Error</b><span>{errorMsg}</span></div></div>}

      <div className="stepper">{["Job description", "Resume", "Analysis", "Interview"].map((step, i) => <div className={`step ${i === 0 ? "active" : ""}`} key={step}><span>0{i + 1}</span><b>{step}</b></div>)}</div>
      
      <div className="setup-grid">
        <div className="input-card">
          <div className="input-card-head"><span className="number">01</span><div><strong>Job Description</strong><p>Paste text or upload PDF/DOCX/TXT.</p></div></div>
          <div className="tabs"><button className={jdMode === "paste" ? "active" : ""} onClick={() => setJdMode("paste")}>Paste text</button><button className={jdMode === "upload" ? "active" : ""} onClick={() => setJdMode("upload")}>Upload file</button></div>
          {jdMode === "paste" ? (
            <textarea value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Paste Job Description text here..." aria-label="Job description" />
          ) : (
            <UploadZone label={jdFileName ? `Uploaded: ${jdFileName}` : "Drop or click to upload JD file"} loading={uploadingJd} onFileSelect={handleJdUpload} />
          )}
          <div className="field-status"><Icon name="check" size={14} /> {jdText.trim() ? `${jdText.split(/\s+/).filter(Boolean).length} words entered` : "Enter JD text or upload file"}</div>
        </div>

        <div className="input-card">
          <div className="input-card-head"><span className="number">02</span><div><strong>Candidate Resume</strong><p>Paste text or upload PDF/DOCX/TXT.</p></div></div>
          <div className="tabs"><button className={resumeMode === "paste" ? "active" : ""} onClick={() => setResumeMode("paste")}>Paste text</button><button className={resumeMode === "upload" ? "active" : ""} onClick={() => setResumeMode("upload")}>Upload file</button></div>
          {resumeMode === "paste" ? (
            <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste Candidate Resume text here..." aria-label="Resume" />
          ) : (
            <UploadZone label={resumeFileName ? `Uploaded: ${resumeFileName}` : "Drop or click to upload Resume"} loading={uploadingResume} onFileSelect={handleResumeUpload} />
          )}
          <div className="privacy-note"><Icon name="file" size={14} /> {resumeText.trim() ? `${resumeText.split(/\s+/).filter(Boolean).length} words entered` : "Enter Resume text or upload file"}</div>
        </div>
      </div>

      <div className="modal-footer">
        <span>Ready for analysis</span>
        <div>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="spark" onClick={onAnalyze} disabled={!jdText.trim() || !resumeText.trim()}>Analyse my interview</Button>
        </div>
      </div>
    </div>
  </div>;
}

function UploadZone({ label, loading, onFileSelect }: { label: string; loading: boolean; onFileSelect: (file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <button className="upload-zone" onClick={() => fileInputRef.current?.click()} type="button">
      <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf,.docx,.doc,.txt" onChange={e => {
        if (e.target.files && e.target.files[0]) {
          onFileSelect(e.target.files[0]);
        }
      }} />
      <span className="upload-icon"><Icon name={loading ? "clock" : "upload"} /></span>
      <b>{loading ? "Extracting text..." : label}</b>
      <span>PDF, DOCX or TXT · Max 10 MB</span>
      <em>Browse files</em>
    </button>
  );
}

function LoadingAnalysis({
  jdText,
  resumeText,
  apiKey,
  onSuccess,
  onError,
}: {
  jdText: string;
  resumeText: string;
  apiKey: string;
  onSuccess: (role: RoleAnalysis, cand: CandidateAnalysis) => void;
  onError: (msg: string) => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const runBackendAnalysis = async () => {
      try {
        setStep(0);
        const roleRes = await analyzeJD(jdText, apiKey);
        if (!isMounted) return;

        setStep(2);
        const candRes = await analyzeCandidate(jdText, resumeText, roleRes, apiKey);
        if (!isMounted) return;

        setStep(4);
        setTimeout(() => {
          if (isMounted) {
            onSuccess(roleRes, candRes);
          }
        }, 500);
      } catch (err: any) {
        if (isMounted) {
          onError(err.message || "Failed to complete role and candidate analysis");
        }
      }
    };

    runBackendAnalysis();
    return () => { isMounted = false; };
  }, [jdText, resumeText, apiKey]);

  const steps = [
    "Reading job description",
    "Extracting role requirements & competencies",
    "Parsing candidate resume",
    "Comparing skills and identifying gaps",
    "Generating candidate fit score",
    "Preparing tailored interview strategy"
  ];

  return <div className="loading-page">
    <div className="analysis-orbit"><div className="orbit o1" /><div className="orbit o2" /><div className="orbit-core"><Icon name="spark" size={30} /></div></div>
    <div className="page-title">Analyzing with AI Backend</div>
    <p>Parsing role requirements and matching candidate qualifications via FastAPI.</p>
    <div className="loading-card">
      {steps.map((label, i) => <div className={`loading-step ${i < step ? "complete" : i === step ? "current" : ""}`} key={label}>
        <span>{i < step ? <Icon name="check" size={15} /> : i === step ? <span className="pulse-dot" /> : <span className="empty-dot" />}</span>
        <b>{label}</b>
        {i === step && <em>Processing</em>}
      </div>)}
    </div>
    <small>FastAPI Backend Processing</small>
  </div>;
}

function Analysis({ setView, roleAnalysis, candidateAnalysis }: { setView: (v: View) => void; roleAnalysis: RoleAnalysis | null; candidateAnalysis: CandidateAnalysis | null }) {
  const [tab, setTab] = useState("overview");

  if (!roleAnalysis || !candidateAnalysis) {
    return <div className="page analysis-page"><div className="panel"><p>No analysis data available. Please set up a job description and resume first.</p><Button onClick={() => setView("dashboard")}>Go to Dashboard</Button></div></div>;
  }

  const reqSkillsCount = roleAnalysis.required_skills?.length || 1;
  const matchedCount = candidateAnalysis.strong_matches?.length || candidateAnalysis.candidate_key_skills?.length || 0;
  const matchPercent = Math.min(100, Math.round((matchedCount / reqSkillsCount) * 100));

  return <div className="page analysis-page">
    <section className="analysis-header">
      <div>
        <div className="eyebrow">STEP 1 & 2: ROLE & CANDIDATE INTELLIGENCE</div>
        <div className="page-title">{roleAnalysis.role_title}</div>
        <p>Target Role Requirements & Candidate Match Assessment</p>
      </div>
      <div className="analysis-actions">
        <Button variant="secondary" onClick={() => setView("dashboard")}>Save & exit</Button>
        <Button onClick={() => setView("interview")}>Start personalised interview <Icon name="arrow" size={16} /></Button>
      </div>
    </section>

    <div className="analysis-tabs">{["overview", "skills", "responsibilities", "competencies", "concepts"].map(t => <button className={tab === t ? "active" : ""} onClick={() => setTab(t)} key={t}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>

    <section className="fit-hero panel">
      <div className="fit-score">
        <ScoreRing value={candidateAnalysis.job_fit_score} />
        <div>
          <Badge tone="green">{candidateAnalysis.fit_label.toUpperCase()}</Badge>
          <div className="section-title">Candidate Alignment Score: {candidateAnalysis.job_fit_score}%</div>
          <p>{candidateAnalysis.relevant_experience?.[0] || "Analysis completed successfully against target job description."}</p>
        </div>
      </div>
      <div className="fit-breakdown">
        <div><span>Job Fit Score</span><Progress value={candidateAnalysis.job_fit_score} /><b>{candidateAnalysis.job_fit_score}%</b></div>
        <div><span>Skill Match</span><Progress value={matchPercent} /><b>{matchPercent}%</b></div>
        <div><span>Role Alignment</span><Progress value={candidateAnalysis.job_fit_score} /><b>{candidateAnalysis.job_fit_score}%</b></div>
      </div>
    </section>

    <section className="intelligence-grid">
      <div className="panel intelligence-card">
        <div className="card-heading"><span className="heading-icon"><Icon name="briefcase" /></span><div><div className="section-title">Step 1 — Understand the Role</div><p>Extracted from Job Description</p></div></div>
        
        <div className="summary-box">
          <b>Experience Expectations</b>
          <p>{roleAnalysis.experience_expectations || "Key qualifications and experience level extracted from Job Description."}</p>
        </div>

        <LabelList title="Key responsibilities" items={roleAnalysis.key_responsibilities || []} />

        <div className="skill-section">
          <b>Required skills</b>
          <div className="chips">{(roleAnalysis.required_skills || []).map(x => <span className="chip strong" key={x}>{x}<Icon name="check" size={12} /></span>)}</div>
        </div>

        <div className="skill-section">
          <b>Preferred skills</b>
          <div className="chips">{(roleAnalysis.preferred_skills || []).map(x => <span className="chip" key={x}>{x}</span>)}</div>
        </div>

        <div className="skill-section" style={{ marginTop: '1rem' }}>
          <b>Technical Competencies</b>
          <div className="chips">{(roleAnalysis.technical_competencies || []).map(x => <span className="chip" key={x}>{x}</span>)}</div>
        </div>

        <div className="skill-section" style={{ marginTop: '1rem' }}>
          <b>Behavioural Competencies</b>
          <div className="chips">{(roleAnalysis.behavioural_competencies || []).map(x => <span className="chip" key={x}>{x}</span>)}</div>
        </div>

        {roleAnalysis.important_concepts && roleAnalysis.important_concepts.length > 0 && (
          <div className="skill-section" style={{ marginTop: '1rem' }}>
            <b>Important Concepts & Keywords</b>
            <div className="chips">{[...(roleAnalysis.important_concepts || []), ...(roleAnalysis.important_keywords || [])].slice(0, 8).map(x => <span className="chip" key={x}>{x}</span>)}</div>
          </div>
        )}
      </div>

      <div className="panel intelligence-card">
        <div className="card-heading"><span className="heading-icon violet"><Icon name="user" /></span><div><div className="section-title">Step 2 — Understand the Candidate</div><p>Evidence parsed from resume against JD</p></div></div>
        
        <div className="candidate-summary">
          <div className="avatar large">AI</div>
          <div>
            <b>Candidate Profile</b>
            <span>{candidateAnalysis.candidate_key_skills?.slice(0, 4).join(", ") || "Key Skills Identified"}</span>
          </div>
          <Badge tone="blue">{matchedCount} Matched</Badge>
        </div>

        {candidateAnalysis.relevant_projects && candidateAnalysis.relevant_projects.length > 0 && (
          <div className="summary-box" style={{ background: '#f8fafc' }}>
            <b>Relevant Projects</b>
            {candidateAnalysis.relevant_projects.map((proj, idx) => <p key={idx} style={{ margin: '4px 0' }}>• {proj}</p>)}
          </div>
        )}

        <div className="strength-block">
          <b>Top strengths against JD</b>
          {(candidateAnalysis.strengths_against_jd || []).map(x => <div key={x}><span className="check-circle"><Icon name="check" size={12} /></span>{x}</div>)}
        </div>

        <div className="weak-block">
          <b>Missing skills / Preparation gaps</b>
          {(candidateAnalysis.preparation_gaps || candidateAnalysis.weak_or_insufficient_areas || []).map(x => <div key={x}><span className="alert-circle">!</span>{x}</div>)}
        </div>

        {candidateAnalysis.probing_points && candidateAnalysis.probing_points.length > 0 && (
          <div className="claims">
            <b>Resume claims to probe in interview</b>
            {candidateAnalysis.probing_points.map((pt, idx) => <div key={idx}><span>“{pt}”</span><Badge tone="amber">Probe deep</Badge></div>)}
          </div>
        )}
      </div>
    </section>

    {/* Strong, Partial, Missing Match Columns */}
    <section className="match-columns">
      <div className="match-col strong">
        <span>STRONG MATCH</span>
        {(candidateAnalysis.strong_matches || candidateAnalysis.candidate_key_skills || []).map(x => <b key={x}><Icon name="check" size={14} />{x}</b>)}
      </div>
      <div className="match-col partial">
        <span>PARTIAL MATCH</span>
        {(candidateAnalysis.partial_matches || []).map(x => <b key={x}><span className="half-dot" />{x}</b>)}
      </div>
      <div className="match-col missing">
        <span>MISSING / WEAK</span>
        {(candidateAnalysis.missing_weak || candidateAnalysis.missing_skills || []).map(x => <b key={x}><Icon name="alert" size={14} />{x}</b>)}
      </div>
    </section>
  </div>;
}

function LabelList({ title, items }: { title: string; items: string[] }) {
  return <div className="label-list"><b>{title}</b>{items.map(x => <div key={x}><Icon name="check" size={14} />{x}</div>)}</div>;
}

function Waveform({ active = true }: { active?: boolean }) {
  return <div className={`waveform ${active ? "active" : ""}`}>{Array.from({ length: 35 }, (_, i) => <i key={i} style={{ "--h": `${12 + ((i * 17) % 34)}px`, "--d": `${(i % 7) * -0.12}s` } as React.CSSProperties} />)}</div>;
}

function Interview({
  setView,
  jdText,
  resumeText,
  roleAnalysis,
  candidateAnalysis,
  apiKey,
  interviewHistory,
  setInterviewHistory,
  onComplete,
}: {
  setView: (v: View) => void;
  jdText: string;
  resumeText: string;
  roleAnalysis: RoleAnalysis | null;
  candidateAnalysis: CandidateAnalysis | null;
  apiKey: string;
  interviewHistory: QuestionTurn[];
  setInterviewHistory: React.Dispatch<React.SetStateAction<QuestionTurn[]>>;
  onComplete: (history: QuestionTurn[]) => void;
}) {
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [currentQuestionData, setCurrentQuestionData] = useState<QuestionResponse | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [latestEval, setLatestEval] = useState<EvalResponse | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Video Interview Stream & Controls
  const [videoMode, setVideoMode] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [candidateStream, setCandidateStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Real-time Communication HUD Signals
  const [responseTimer, setResponseTimer] = useState(0);
  const timerIntervalRef = useRef<any>(null);

  // Start response timer when candidate starts answering
  useEffect(() => {
    if (started && !evaluating) {
      timerIntervalRef.current = setInterval(() => {
        setResponseTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [started, evaluating, currentQuestionData]);

  // Compute live signals
  const words = candidateAnswer.trim().split(/\s+/).filter(Boolean);
  const currentWpm = responseTimer > 0 ? Math.round((words.length / responseTimer) * 60) : 0;
  const FILLER_REGEX = /\b(um|uh|like|you know|basically|actually|sort of|kind of|so yeah)\b/gi;
  const fillerMatches = candidateAnswer.match(FILLER_REGEX) || [];
  const currentFillerCount = fillerMatches.length;

  let currentConfidence = "High Confidence";
  if (currentFillerCount > 3 || (currentWpm > 0 && currentWpm < 90)) {
    currentConfidence = "Needs Polish";
  } else if (currentFillerCount > 1 || (currentWpm > 0 && (currentWpm > 175 || currentWpm < 110))) {
    currentConfidence = "Steady";
  }

  // Camera setup
  useEffect(() => {
    if (started && videoMode) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setCandidateStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn("Camera/microphone access could not be acquired:", err);
          setCameraEnabled(false);
        });
    }

    return () => {
      if (candidateStream) {
        candidateStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [started, videoMode]);

  const toggleCamera = () => {
    if (candidateStream) {
      const vTrack = candidateStream.getVideoTracks()[0];
      if (vTrack) {
        vTrack.enabled = !vTrack.enabled;
        setCameraEnabled(vTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (candidateStream) {
      const aTrack = candidateStream.getAudioTracks()[0];
      if (aTrack) {
        aTrack.enabled = !aTrack.enabled;
        setMicEnabled(aTrack.enabled);
      }
    }
  };

  const fetchNextQuestion = async (targetLevel: number, historyToUse: QuestionTurn[]) => {
    setLoadingQuestion(true);
    setLatestEval(null);
    setQuestionError(null);
    setCandidateAnswer("");
    setResponseTimer(0);
    try {
      if (!roleAnalysis || !candidateAnalysis) {
        throw new Error("Missing role or candidate analysis. Please analyze a Job Description and Resume first.");
      }

      const qRes = await generateQuestion(jdText, resumeText, roleAnalysis, candidateAnalysis, targetLevel, historyToUse, apiKey);
      setCurrentQuestionData(qRes);

      // Auto-speak question if speech is enabled
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(qRes.question);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      console.error("Failed to generate question", err);
      setQuestionError(err.message || "Failed to generate dynamic interview question from AI backend.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  useEffect(() => {
    if (started && !currentQuestionData) {
      fetchNextQuestion(level, interviewHistory);
    }
  }, [started]);

  const handleStartVoiceRecording = async () => {
    setMicError(null);

    // If currently recording, stop
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsRecording(false);
      return;
    }

    // Proactively verify / request microphone access from browser
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release immediate test tracks so SpeechRecognition has full exclusive access
        stream.getTracks().forEach(track => track.stop());
      } catch (err: any) {
        console.warn("Microphone access prompt error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setMicError("Microphone permission was blocked. Please click the permissions icon (lock/tune) in your browser address bar to allow Microphone, or type your answer directly.");
          return;
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setMicError("No microphone hardware device found on this computer. You can type your response directly in the text area.");
          return;
        }
      }
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Web Speech API is not supported in this browser (Chrome and Edge recommended). You can type your response directly in the text area.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      // Keep whatever text was already typed so we append to it
      const existingText = candidateAnswer ? candidateAnswer.trim() + " " : "";

      rec.onstart = () => {
        setIsRecording(true);
        setMicError(null);
      };

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCandidateAnswer(existingText + transcript);
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e.error);
        if (e.error === "not-allowed") {
          setMicError("Microphone permission denied. Please allow microphone access in your browser address bar.");
          setIsRecording(false);
        } else if (e.error === "network") {
          setMicError("Speech recognition network error: unable to connect to speech transcription service. Please check internet connection or type answer.");
          setIsRecording(false);
        } else if (e.error === "no-speech") {
          // Do not abruptly cancel on short silence
        } else {
          setMicError(`Speech recognition: ${e.error}`);
          setIsRecording(false);
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Failed speech recognition start", err);
      setMicError("Could not start speech recognition: " + (err.message || String(err)));
      setIsRecording(false);
    }
  };

  const handleSpeakQuestion = () => {
    if (!currentQuestionData?.question) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQuestionData.question);
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakerPlaying(false);
      setSpeakerPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!candidateAnswer.trim() || !currentQuestionData) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    setEvaluating(true);
    setEvalError(null);
    try {
      if (!roleAnalysis || !candidateAnalysis) {
        throw new Error("Missing active role or candidate analysis.");
      }

      const evalRes = await evaluateAnswer(
        currentQuestionData.question,
        candidateAnswer,
        roleAnalysis,
        candidateAnalysis,
        level,
        interviewHistory,
        apiKey
      );

      setLatestEval(evalRes);

      const newTurn: QuestionTurn = {
        level,
        question: currentQuestionData.question,
        answer: candidateAnswer,
        score: evalRes.score,
        assessment: evalRes.assessment,
        what_was_good: evalRes.what_was_good,
        what_could_be_better: evalRes.what_could_be_better,
        ideal_direction: evalRes.ideal_direction,
        interviewer_intent: currentQuestionData.interviewer_intent,
        expected_key_points: currentQuestionData.expected_key_points,
        durationSeconds: responseTimer,
        wpm: currentWpm,
        fillerCount: currentFillerCount,
        confidence: currentConfidence,
      };

      setInterviewHistory(prev => [...prev, newTurn]);
    } catch (err: any) {
      console.error("Evaluation error", err);
      setEvalError(err.message || "Failed to evaluate candidate response from AI backend.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    let nextLevel = level;
    if (interviewHistory.length >= 2 && level === 1) nextLevel = 2;
    if (interviewHistory.length >= 5 && level === 2) nextLevel = 3;
    setLevel(nextLevel);
    fetchNextQuestion(nextLevel, interviewHistory);
  };

  const handleFinishInterview = () => {
    if (candidateStream) {
      candidateStream.getTracks().forEach(t => t.stop());
    }
    onComplete(interviewHistory);
  };

  if (!started) {
    return <InterviewSetup
      onStart={(chosenVideoMode) => {
        setVideoMode(chosenVideoMode);
        setInterviewHistory([]);
        setStarted(true);
      }}
      onGoToDashboard={() => setView("dashboard")}
      roleAnalysis={roleAnalysis}
      candidateAnalysis={candidateAnalysis}
    />;
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return <div className="interview-page">
    <div className="interview-top">
      <div>
        <Badge tone="green"><span className="live-dot" /> LIVE AI INTERVIEW</Badge>
        <b>{roleAnalysis?.role_title || "Target Role"}</b>
        <span>Level {level} · {level === 1 ? "Screening Interview" : level === 2 ? "Competency Interview" : "Deep-Dive Interview"}</span>
      </div>
      <div className="interview-timer"><Icon name="clock" /> Response Time: {formatTimer(responseTimer)} · Question #{interviewHistory.length + 1}</div>
      <Button variant="danger" onClick={handleFinishInterview}>End & Generate Report</Button>
    </div>

    <div className="interview-layout">
      <aside className="interview-progress">
        <div className="side-label">INTERVIEW PROGRESSION</div>
        <div className="level-title"><span>0{level}</span><div><b>{level === 1 ? "Screening" : level === 2 ? "Competency" : "Deep-Dive"}</b><em>Level {level} of 3</em></div></div>
        <Progress value={Math.min(100, ((interviewHistory.length + 1) / 8) * 100)} />
        <div className="question-steps">
          {["Screening & Motivation", "Competency & Problem Solving", "Deep-Dive & Probing"].map((x, i) => (
            <div className={i + 1 < level ? "done" : i + 1 === level ? "current" : ""} key={x}>
              <span>{i + 1 < level ? <Icon name="check" size={12} /> : i + 1}</span>
              <b>{x}</b>
            </div>
          ))}
        </div>

        <div className="level-next" style={{ marginTop: "2rem" }}>
          <span>ADAPTIVE INTELLIGENCE</span>
          <b>{level === 1 ? "Level 1: Resume Verification" : level === 2 ? "Level 2: Technical Depth" : "Level 3: Probing & Edge Cases"}</b>
          <small>Questions adjust to your previous answers and project claims.</small>
        </div>
      </aside>

      <section className="interviewer-stage">
        {latestEval?.follow_up_recommended && (
          <div className="adaptive-banner">
            <Icon name="spark" />
            <div><b>AI Adaptive Probing</b><span>Follow-up triggered based on response score ({latestEval.score}/100)</span></div>
          </div>
        )}

        {/* Video Dual Stage: AI Interviewer Video Box & Candidate Live Video Feed */}
        <div className="video-dual-stage">
          {/* AI Interviewer Avatar Card */}
          <div className="video-box ai-box">
            <div className="video-badge"><span className="dot" /> AI Interviewer</div>
            <div className={`interviewer-avatar ${isRecording ? "listening" : ""}`}>
              <div className="avatar-rings">
                <div className="avatar-core">
                  <div className="ai-face"><i /><i /><span /></div>
                </div>
              </div>
            </div>
            <div className="interviewer-label" style={{ marginTop: "8px" }}>
              <b style={{ color: "#f8fafc" }}>AI Technical Lead</b>
              <span style={{ color: isRecording ? "#4ade80" : speakerPlaying ? "#60a5fa" : "#94a3b8" }}>
                {loadingQuestion ? "Generating question..." : isRecording ? "Listening to answer…" : speakerPlaying ? "Speaking question..." : "Waiting for response"}
              </span>
            </div>
          </div>

          {/* Candidate Live Camera Feed */}
          <div className="video-box candidate-box">
            <div className="video-badge">
              <span className="dot" style={{ background: cameraEnabled ? "#22c55e" : "#ef4444" }} />
              Candidate Camera {cameraEnabled ? "(Live)" : "(Off)"}
            </div>
            
            {cameraEnabled ? (
              <video ref={videoRef} autoPlay playsInline muted className="candidate-video-elem" />
            ) : (
              <div className="camera-off-placeholder">
                <Icon name="cameraOff" size={32} />
                <b>Camera is Disabled</b>
                <span>Click the camera button below to turn on video</span>
              </div>
            )}

            <div className="video-controls-overlay">
              <button className={`video-ctrl-btn ${!cameraEnabled ? "off" : ""}`} onClick={toggleCamera} title="Toggle Camera">
                <Icon name={cameraEnabled ? "camera" : "cameraOff"} size={16} />
              </button>
              <button className={`video-ctrl-btn ${!micEnabled ? "off" : ""}`} onClick={toggleMic} title="Toggle Microphone">
                <Icon name={micEnabled ? "mic" : "micOff"} size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Communication Signals HUD */}
        <div className="signals-hud">
          <div className="signal-pill">
            <div className="signal-icon blue"><Icon name="clock" size={14} /></div>
            <div>
              <span>Response Duration</span>
              <strong>{formatTimer(responseTimer)}</strong>
              <small style={{ color: "#64748b" }}>Live Timer</small>
            </div>
          </div>
          <div className="signal-pill">
            <div className="signal-icon green"><Icon name="trend" size={14} /></div>
            <div>
              <span>Speaking Pace</span>
              <strong>{currentWpm} WPM</strong>
              <small style={{ color: currentWpm >= 110 && currentWpm <= 165 ? "#16a34a" : "#d97706" }}>
                {currentWpm >= 110 && currentWpm <= 165 ? "Optimal Pace" : currentWpm > 165 ? "Fast Pace" : "Steady"}
              </small>
            </div>
          </div>
          <div className="signal-pill">
            <div className="signal-icon amber"><Icon name="alert" size={14} /></div>
            <div>
              <span>Filler Words</span>
              <strong>{currentFillerCount}</strong>
              <small style={{ color: currentFillerCount > 2 ? "#dc2626" : "#16a34a" }}>
                {currentFillerCount === 0 ? "Clean Speech" : `${currentFillerCount} detected`}
              </small>
            </div>
          </div>
          <div className="signal-pill">
            <div className="signal-icon violet"><Icon name="target" size={14} /></div>
            <div>
              <span>Confidence</span>
              <strong>{currentConfidence}</strong>
              <small style={{ color: "#64748b" }}>Real-time Signal</small>
            </div>
          </div>
        </div>

        {/* Current Question */}
        <div className="question-card">
          {loadingQuestion ? (
            <p><em>Generating candidate-specific question based on JD and Resume...</em></p>
          ) : questionError ? (
            <div style={{ color: "#991b1b" }}>
              <p><strong>Error Generating Question:</strong> {questionError}</p>
              <Button style={{ marginTop: "0.5rem" }} onClick={() => fetchNextQuestion(level, interviewHistory)}>
                Retry Generation
              </Button>
            </div>
          ) : (
            <>
              <p>“{currentQuestionData?.question}”</p>
              {currentQuestionData?.interviewer_intent && <small style={{ display: 'block', marginTop: '0.4rem', color: '#64748b' }}>Interviewer Rationale: {currentQuestionData.interviewer_intent}</small>}
              <button className="repeat-link" onClick={handleSpeakQuestion} type="button">
                <Icon name="volume" size={16} /> Listen to question (TTS)
              </button>
            </>
          )}
        </div>

        {/* Candidate Voice / Text Area */}
        <div className="voice-area">
          <textarea
            value={candidateAnswer}
            onChange={e => setCandidateAnswer(e.target.value)}
            placeholder="Speak or type your answer. Elaborate with technical specifics, baseline metrics, implementation details, and outcomes..."
            style={{ width: "100%", height: "90px", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "vertical", fontSize: "0.95rem" }}
          />

          {micError && (
            <div style={{ marginTop: '0.5rem', width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="alert" size={16} />
              <span>{micError}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", width: "100%", marginTop: "0.5rem", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button className={`btn ${isRecording ? "btn-danger" : "btn-secondary"}`} onClick={handleStartVoiceRecording} type="button">
                <Icon name={isRecording ? "stop" : "mic"} size={18} />
                {isRecording ? "Stop Speech Input" : "Speak Answer (STT)"}
              </button>
              {isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Waveform active />
                  <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700 }}>Listening... Speak now</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <Button icon="send" onClick={handleSubmitAnswer} disabled={evaluating || !candidateAnswer.trim()}>
                {evaluating ? "Evaluating Answer..." : "Submit Answer"}
              </Button>
            </div>
          </div>
        </div>

        {/* Instant Evaluation Feedback */}
        {latestEval && (
          <div className="panel" style={{ marginTop: "1rem", width: "100%", borderLeft: `4px solid ${latestEval.score >= 80 ? "#22c55e" : latestEval.score >= 65 ? "#f59e0b" : "#ef4444"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px 0" }}>
              <b>AI Instant Evaluation</b>
              <Badge tone={latestEval.score >= 80 ? "green" : latestEval.score >= 65 ? "amber" : "red"}>{latestEval.score} / 100</Badge>
            </div>
            <div style={{ padding: "8px 16px 16px" }}>
              <p style={{ marginTop: "0.3rem", fontSize: "0.9rem" }}>{latestEval.assessment}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.85rem" }}>
                <div style={{ background: "#f0fdf4", padding: "0.5rem", borderRadius: "6px", color: "#166534" }}>
                  <strong>Specific Strength:</strong> {latestEval.what_was_good}
                </div>
                <div style={{ background: "#fffbeb", padding: "0.5rem", borderRadius: "6px", color: "#92400e" }}>
                  <strong>Area to Improve:</strong> {latestEval.what_could_be_better}
                </div>
              </div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", background: "#f8fafc", padding: "0.5rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <strong>Ideal STAR Direction:</strong> {latestEval.ideal_direction}
              </div>
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                {latestEval.suggested_follow_up && (
                  <Button variant="secondary" onClick={() => {
                    setCurrentQuestionData({
                      question: latestEval.suggested_follow_up,
                      interviewer_intent: "Probing follow-up to evaluate candidate depth.",
                      expected_key_points: ["Deeper metrics", "Specific trade-offs", "Root cause"]
                    });
                    setCandidateAnswer("");
                    setLatestEval(null);
                    setResponseTimer(0);
                  }}>
                    Ask Adaptive Counter-Question
                  </Button>
                )}
                <Button icon="arrow" onClick={handleNextQuestion}>Next Question</Button>
              </div>
            </div>
          </div>
        )}

        <div className="interview-controls">
          <button onClick={() => setCandidateAnswer("")}><Icon name="repeat" /><span>Clear</span></button>
          <button onClick={handleNextQuestion}><Icon name="play" /><span>Next Question</span></button>
          <button onClick={handleFinishInterview} className="end"><Icon name="close" /><span>Finish & View Report</span></button>
        </div>
      </section>

      <aside className="context-panel">
        <div className="side-label">LIVE INTERVIEW SIGNALS</div>
        <div className="context-block"><span>TARGET ROLE</span><b>{roleAnalysis?.role_title || "Target Position"}</b></div>
        <div className="context-block"><span>FIT MATCH</span><b>{candidateAnalysis?.job_fit_score || 0}% Alignment</b></div>
        <div className="context-block">
          <span>QUESTIONS COMPLETED</span>
          <b>{interviewHistory.length} Answered</b>
        </div>
        <div className="context-block">
          <span>COMMUNICATION SIGNALS</span>
          <b>{currentWpm} WPM · {currentFillerCount} Fillers</b>
          <small>{currentConfidence}</small>
        </div>
        <div className="ai-note"><Icon name="spark" /><p>Maintains context of previous questions, answers, and claimed resume achievements.</p></div>
      </aside>
    </div>
  </div>;
}

function InterviewSetup({
  onStart,
  onGoToDashboard,
  roleAnalysis,
  candidateAnalysis,
}: {
  onStart: (videoMode: boolean) => void;
  onGoToDashboard: () => void;
  roleAnalysis: RoleAnalysis | null;
  candidateAnalysis: CandidateAnalysis | null;
}) {
  const [mode, setMode] = useState<"video" | "voice" | "text">("video");

  if (!roleAnalysis || !candidateAnalysis) {
    return (
      <div className="page setup-page">
        <div className="panel" style={{ padding: "3rem", textAlign: "center", maxWidth: "600px", margin: "2rem auto" }}>
          <Icon name="briefcase" size={40} />
          <h2 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>Target Role Setup Required</h2>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            To generate personalized, non-generic interview questions, please provide your target Job Description and Resume first.
          </p>
          <Button icon="plus" onClick={onGoToDashboard}>Go to Dashboard & Set Up Role</Button>
        </div>
      </div>
    );
  }

  return <div className="page setup-page">
    <div className="setup-intro">
      <Badge tone="green"><Icon name="check" size={13} /> ANALYSIS COMPLETE</Badge>
      <div className="page-title">Your AI Interview Room is Ready</div>
      <p>A personalised technical interview simulation built specifically for {roleAnalysis.role_title}.</p>
    </div>
    <div className="ready-layout">
      <div className="panel level-panel">
        <div className="section-head"><div><div className="section-title">Interview Structure</div><p>Three Progressive Levels · Dynamic Follow-ups</p></div><Badge tone="blue">Adaptive Difficulty</Badge></div>
        {[
          ["01", "Level 1 — Screening", "10 min", "Resume projects · Motivation · Basic understanding · Role fit"],
          ["02", "Level 2 — Competency", "15 min", "Technical skills · Problem solving · Trade-offs · Decision making"],
          ["03", "Level 3 — Deep-Dive", "15 min", "Probing claims · System bottlenecks · 'Why' & 'How' scenarios"]
        ].map((x, i) => (
          <div className={`level-row ${i === 0 ? "selected" : ""}`} key={x[0]}>
            <span className="level-num">{x[0]}</span>
            <div><b>{x[1]}</b><span>{x[3]}</span></div>
            <em><Icon name="clock" size={14} />{x[2]}</em>
            <span className="selected-check"><Icon name="check" size={13} /></span>
          </div>
        ))}
      </div>
      <div className="panel config-panel">
        <div className="section-title">Choose Interview Experience</div>
        <p>Select your preferred interaction mode:</p>
        {[
          ["video", "video", "Video + Voice Interview", "Highly Preferred"],
          ["voice", "mic", "Voice Only AI Interview", "Mandatory Feature"],
          ["text", "file", "Interactive Text Interview", "Standard"]
        ].map(([id, icon, title, tag]) => (
          <button className={`mode-option ${mode === id ? "selected" : ""}`} onClick={() => setMode(id as any)} key={id}>
            <span className="radio" />
            <span className="mode-icon"><Icon name={icon as IconName} /></span>
            <div><b>{title}</b><span>{id === "video" ? "Camera feed + Live WPM, filler word & confidence indicators" : id === "voice" ? "Real-time speech transcription & audio synthesis" : "Type answers directly with instant evaluation"}</span></div>
            {tag && <Badge tone={id === "video" ? "green" : "neutral"}>{tag}</Badge>}
          </button>
        ))}
        <Button className="start-button" icon="play" onClick={() => onStart(mode === "video")}>Launch Interview Simulator</Button>
      </div>
    </div>
  </div>;
}

function Report({ setView, report }: { setView: (v: View) => void; report: ReportResponse | null }) {
  const [openQIndex, setOpenQIndex] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  if (!report) {
    return <div className="page report-page"><div className="panel"><p>No report available yet. Please complete an interview session first.</p><Button onClick={() => setView("dashboard")}>Go to Dashboard</Button></div></div>;
  }

  const handleShare = () => {
    const text = `Interview Performance Report\nScore: ${report.overall_score}/100\nReadiness: ${report.readiness_status}\nEvaluated via Student Credibility Interview Accelerator`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const comms = report.communication_signals || {
    avg_wpm: 135,
    total_filler_words: 2,
    confidence_level: "High Confidence",
    pace_status: "Optimal Pace (120-160 WPM)"
  };

  return <div className="page report-page">
    <section className="report-hero">
      <div>
        <div className="eyebrow">STEP 4: INTERVIEW PERFORMANCE REPORT</div>
        <div className="page-title">Candidate Evaluation & Readiness Report</div>
        <p>Comprehensive Assessment · Competency Scores · Preparation Roadmap</p>
      </div>
      <div className="report-actions">
        <Button variant="secondary" icon="printer" onClick={handlePrint}>Print / Export PDF</Button>
        <Button variant="secondary" icon="share" onClick={handleShare}>{copied ? "Copied Link!" : "Share Report"}</Button>
        <Button onClick={() => setView("plan")}>Preparation Roadmap</Button>
      </div>
    </section>

    {/* Overall Score & Readiness Assessment */}
    <section className="result-overview panel">
      <ScoreRing value={report.overall_score} label="OVERALL" />
      <div className="result-copy">
        <Badge tone={report.readiness_code === "green" ? "green" : report.readiness_code === "yellow" ? "amber" : "red"}>
          {report.readiness_code === "green" ? "🟢" : report.readiness_code === "yellow" ? "🟡" : report.readiness_code === "orange" ? "🟠" : "🔴"} {report.readiness_status.toUpperCase()}
        </Badge>
        <div className="section-title">Interview Readiness Assessment: {report.readiness_status}</div>
        <p>{report.readiness_description}</p>
        <div className="result-meta">
          <span><Icon name="clock" /> Session Completed</span>
          <span><Icon name="file" /> {report.question_evaluations?.length || 0} Questions Evaluated</span>
        </div>
      </div>
      <div className="readiness-mini">
        <span>READINESS SCORE</span>
        <b>{report.overall_score}/100</b>
        <Progress value={report.overall_score} tone={report.overall_score >= 75 ? "green" : "amber"} />
      </div>
    </section>

    {/* Communication Signals Card (Speaking pace, fillers, confidence) */}
    <section className="panel" style={{ marginTop: "1rem", padding: "1.25rem" }}>
      <div className="section-head">
        <div>
          <div className="section-title">Communication & Behavioral Delivery Signals</div>
          <p>Real-time speech signals evaluated during the video & voice interview</p>
        </div>
        <Badge tone="blue">Voice / Video Signals</Badge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginTop: "1rem" }}>
        <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <small style={{ color: "#64748b", fontWeight: 700 }}>SPEAKING PACE</small>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0.2rem 0" }}>{comms.avg_wpm} WPM</div>
          <span style={{ fontSize: "0.8rem", color: "#16a34a" }}>{comms.pace_status}</span>
        </div>
        <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <small style={{ color: "#64748b", fontWeight: 700 }}>FILLER WORDS DETECTED</small>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0.2rem 0" }}>{comms.total_filler_words} Fillers</div>
          <span style={{ fontSize: "0.8rem", color: comms.total_filler_words <= 3 ? "#16a34a" : "#d97706" }}>
            {comms.total_filler_words <= 2 ? "Low filler frequency" : "Moderate hesitations"}
          </span>
        </div>
        <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <small style={{ color: "#64748b", fontWeight: 700 }}>DELIVERY CONFIDENCE</small>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0.2rem 0" }}>{comms.confidence_level}</div>
          <span style={{ fontSize: "0.8rem", color: "#3b82f6" }}>Vocal & behavioral clarity</span>
        </div>
        <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <small style={{ color: "#64748b", fontWeight: 700 }}>RESPONSE STRUCTURE</small>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0.2rem 0" }}>STAR Alignment</div>
          <span style={{ fontSize: "0.8rem", color: "#16a34a" }}>Methodical explanation</span>
        </div>
      </div>
    </section>

    {/* Competency Scores Breakdown */}
    <section className="competency-section">
      <div className="section-head"><div><div className="section-title">Competency Scores Breakdown</div><p>Detailed evaluation across 7 core dimensions.</p></div></div>
      <div className="score-cards">
        {Object.entries(report.competency_scores || {}).map(([key, val]) => (
          <div className="score-card" key={key}>
            <span>{key.replace(/_/g, " ").toUpperCase()}</span>
            <b>{val}</b>
            <Progress value={val} tone={val >= 80 ? "green" : val < 70 ? "amber" : "blue"} />
          </div>
        ))}
      </div>
    </section>

    {/* Question-Level Feedback */}
    <section className="report-grid">
      <div className="panel feedback-panel">
        <div className="section-head">
          <div>
            <div className="section-title">Question-Level Actionable Feedback</div>
            <p>What the AI asked, what you answered, strengths, and ideal STAR direction.</p>
          </div>
          <Badge tone="neutral">{report.question_evaluations?.length || 0} QUESTIONS</Badge>
        </div>

        {(report.question_evaluations || []).map((evalItem, idx) => (
          <div key={idx} style={{ marginBottom: "0.75rem", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "8px", overflow: "hidden" }}>
            <button className="feedback-question" onClick={() => setOpenQIndex(openQIndex === idx ? null : idx)} style={{ width: "100%", textAlign: "left", padding: "0.75rem 1rem" }}>
              <span>Q{idx + 1}</span>
              <div><b>{evalItem.question}</b></div>
              <Icon name="chevron" />
            </button>
            {openQIndex === idx && (
              <div className="feedback-content" style={{ padding: "1rem" }}>
                <div className="answer-quote"><span>CANDIDATE ANSWER</span><p>“{evalItem.candidate_answer || "No answer recorded."}”</p></div>
                <div className="assessment"><b>Assessment</b><p>{evalItem.assessment}</p></div>
                <div className="feedback-cols">
                  <div><b>What Was Good</b><p><Icon name="check" /> {evalItem.what_was_good}</p></div>
                  <div><b>What Could Be Better</b><p><Icon name="alert" /> {evalItem.what_could_be_better}</p></div>
                </div>
                <div className="ideal" style={{ marginTop: "0.75rem" }}>
                  <b>Ideal Direction (Actionable STAR Model)</b>
                  <p style={{ marginTop: "0.25rem", fontSize: "0.85rem", color: "#334155" }}>{evalItem.ideal_direction}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="side-report">
        <div className="panel strengths-panel">
          <div className="section-title">Demonstrated Strengths</div>
          {(report.strengths || []).map(x => <div key={x}><Icon name="check" />{x}</div>)}
        </div>
        <div className="panel strengths-panel weak">
          <div className="section-title">Priority Improvement Areas</div>
          {(report.weaknesses || []).map((x, i) => (
            <div key={x}>
              <span>{i + 1}</span>
              <p><b>{x}</b></p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Preparation Gaps Roadmap */}
    {report.preparation_gaps && report.preparation_gaps.length > 0 && (
      <section className="readiness-panel panel" style={{ marginTop: "1.5rem" }}>
        <div className="section-title" style={{ marginBottom: "0.5rem" }}>Prioritized Preparation Gaps</div>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1rem" }}>Master these focus areas before your real interview.</p>
        <div className="focus-grid">
          {report.preparation_gaps.map((gap, i) => (
            <div className="focus-card" key={i}>
              <span className="priority">{gap.priority}</span>
              <strong>{gap.topic}</strong>
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                {gap.review_points.map(pt => <div key={pt} style={{ margin: "0.2rem 0" }}>• {pt}</div>)}
              </div>
            </div>
          ))}
        </div>
        <div className="readiness-footer" style={{ marginTop: "1rem" }}>
          <Button variant="secondary" onClick={() => setView("interview")}>Retake Interview</Button>
          <Button onClick={() => setView("plan")}>View Full Roadmap</Button>
        </div>
      </section>
    )}
  </div>;
}

function Plan({
  candidateAnalysis,
  report,
}: {
  candidateAnalysis: CandidateAnalysis | null;
  report: ReportResponse | null;
}) {
  const gaps = report?.preparation_gaps || (candidateAnalysis?.preparation_gaps || []).map((gap, i) => ({
    priority: `Priority ${i + 1}`,
    topic: gap,
    review_points: ["Key concepts & fundamentals", "Practical implementation trade-offs", "STAR methodology explanation"],
  }));

  if (!gaps || gaps.length === 0) {
    return <div className="page plan-page"><div className="panel"><p>No preparation gaps analyzed yet. Please set up a Job Description & Resume to generate a tailored preparation roadmap.</p></div></div>;
  }

  return <div className="page plan-page">
    <section className="hero-row">
      <div>
        <div className="eyebrow">PERSONALISED ROADMAP</div>
        <div className="page-title">Interview Preparation Roadmap</div>
        <p>Focused practice topics based on candidate role fit and interview performance.</p>
      </div>
    </section>

    <section className="plan-layout">
      <div className="timeline">
        {gaps.map((item, i) => (
          <div className={`day-card ${i === 0 ? "current" : ""}`} key={i}>
            <div className="timeline-node">{i + 1}</div>
            <div className="day-main">
              <span>{item.priority}</span>
              <b>{item.topic}</b>
              <small style={{ marginTop: "0.25rem", display: "block" }}>
                {item.review_points.join(" • ")}
              </small>
            </div>
            <Button variant={i === 0 ? "primary" : "ghost"}>Practice Topic</Button>
          </div>
        ))}
      </div>
    </section>
  </div>;
}

function History({
  setView,
  completedSessions,
  onViewReport,
  onClearHistory,
}: {
  setView: (v: View) => void;
  completedSessions: CompletedSession[];
  onViewReport: (session: CompletedSession) => void;
  onClearHistory: () => void;
}) {
  if (completedSessions.length === 0) {
    return <div className="page history-page">
      <section className="hero-row">
        <div>
          <div className="eyebrow">SESSION HISTORY</div>
          <div className="page-title">Interview Simulation History</div>
          <p>No completed interviews found yet. Run an interview simulation to track your progress.</p>
        </div>
        <Button icon="plus" onClick={() => setView("dashboard")}>Prepare New Role</Button>
      </section>
      <div className="panel" style={{ padding: "3rem", textAlign: "center", background: "var(--bg-subtle, #f8fafc)", borderRadius: "12px" }}>
        <Icon name="history" size={40} />
        <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>No Past Interviews Logged</h3>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Complete an AI interview simulation to see your session logs, question feedback, and score progression here.</p>
        <Button icon="play" onClick={() => setView("dashboard")}>Go to Dashboard</Button>
      </div>
    </div>;
  }

  return <div className="page history-page">
    <section className="hero-row">
      <div>
        <div className="eyebrow">SESSION HISTORY</div>
        <div className="page-title">Interview Simulation History</div>
        <p>Review past interview simulations, question evaluations, and readiness ratings.</p>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Button variant="danger" icon="trash" onClick={onClearHistory}>Clear History</Button>
        <Button icon="plus" onClick={() => setView("dashboard")}>New Interview</Button>
      </div>
    </section>

    <div className="history-layout">
      <section className="panel history-table">
        <div className="table-head">
          <span>ROLE</span>
          <span>DATE</span>
          <span>SCORE</span>
          <span>READINESS</span>
          <span>ACTIONS</span>
        </div>
        {completedSessions.map(session => (
          <div className="table-row" key={session.id}>
            <div>
              <span className="company-logo small">AI</span>
              <p><b>{session.roleTitle}</b><small>{session.turns.length} questions evaluated</small></p>
            </div>
            <span>{session.date}</span>
            <b className="table-score">{session.score}<small>/100</small></b>
            <Badge tone={session.readinessCode}>{session.readinessStatus}</Badge>
            <div className="row-actions">
              <button onClick={() => onViewReport(session)}>View report</button>
              <button onClick={() => setView("interview")}>Retake</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  </div>;
}

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [setup, setSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [apiKey, setApiKey] = useState("");

  const [roleAnalysis, setRoleAnalysis] = useState<RoleAnalysis | null>(null);
  const [candidateAnalysis, setCandidateAnalysis] = useState<CandidateAnalysis | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<QuestionTurn[]>([]);
  const [performanceReport, setPerformanceReport] = useState<ReportResponse | null>(null);

  // Persistent localStorage for history
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>(() => {
    try {
      const saved = localStorage.getItem("interview_ai_sessions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("interview_ai_sessions", JSON.stringify(completedSessions));
    } catch (e) {
      console.error("Failed saving sessions to localStorage", e);
    }
  }, [completedSessions]);

  const startAnalysis = () => {
    setSetup(false);
    setAnalysisError(null);
    setLoading(true);
  };

  const handleAnalysisSuccess = (roleRes: RoleAnalysis, candRes: CandidateAnalysis) => {
    setRoleAnalysis(roleRes);
    setCandidateAnalysis(candRes);
    setLoading(false);
    setView("analysis");
  };

  const handleAnalysisError = (msg: string) => {
    setLoading(false);
    setAnalysisError(msg);
  };

  const handleCompleteInterview = async (history: QuestionTurn[]) => {
    try {
      if (!roleAnalysis || !candidateAnalysis) {
        throw new Error("Cannot generate performance report without active role and candidate analysis.");
      }

      const repRes = await generateReport(jdText, resumeText, roleAnalysis, candidateAnalysis, history, apiKey);
      setPerformanceReport(repRes);

      const newSession: CompletedSession = {
        id: Date.now().toString(),
        roleTitle: roleAnalysis.role_title,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: repRes.overall_score,
        readinessStatus: repRes.readiness_status,
        readinessCode: repRes.readiness_code,
        report: repRes,
        turns: history,
      };

      setCompletedSessions(prev => [newSession, ...prev]);
    } catch (err) {
      console.error("Failed to generate report from backend", err);
    } finally {
      setView("report");
    }
  };

  const handleViewSessionReport = (session: CompletedSession) => {
    setPerformanceReport(session.report);
    setView("report");
  };

  const handleClearHistory = () => {
    setCompletedSessions([]);
    localStorage.removeItem("interview_ai_sessions");
  };

  return <Shell view={view} setView={setView}>
    {loading ? (
      <LoadingAnalysis
        jdText={jdText}
        resumeText={resumeText}
        apiKey={apiKey}
        onSuccess={handleAnalysisSuccess}
        onError={handleAnalysisError}
      />
    ) : analysisError ? (
      <div className="page"><div className="panel" style={{ padding: "2rem", textAlign: "center" }}><Badge tone="red">ANALYSIS ERROR</Badge><h3 style={{ margin: "1rem 0" }}>{analysisError}</h3><p style={{ color: "#64748b", marginBottom: "1rem" }}>Please verify your backend connection or input documents.</p><Button onClick={() => setSetup(true)}>Try Again</Button></div></div>
    ) : view === "dashboard" ? (
      <Dashboard
        onSetup={() => setSetup(true)}
        setView={setView}
        roleAnalysis={roleAnalysis}
        candidateAnalysis={candidateAnalysis}
        completedSessions={completedSessions}
        onViewReport={handleViewSessionReport}
      />
    ) : view === "analysis" ? (
      <Analysis setView={setView} roleAnalysis={roleAnalysis} candidateAnalysis={candidateAnalysis} />
    ) : view === "interview" ? (
      <Interview
        setView={setView}
        jdText={jdText}
        resumeText={resumeText}
        roleAnalysis={roleAnalysis}
        candidateAnalysis={candidateAnalysis}
        apiKey={apiKey}
        interviewHistory={interviewHistory}
        setInterviewHistory={setInterviewHistory}
        onComplete={handleCompleteInterview}
      />
    ) : view === "report" ? (
      <Report setView={setView} report={performanceReport} />
    ) : view === "plan" ? (
      <Plan candidateAnalysis={candidateAnalysis} report={performanceReport} />
    ) : (
      <History
        setView={setView}
        completedSessions={completedSessions}
        onViewReport={handleViewSessionReport}
        onClearHistory={handleClearHistory}
      />
    )}

    {setup && (
      <SetupModal
        onClose={() => setSetup(false)}
        onAnalyze={startAnalysis}
        jdText={jdText}
        setJdText={setJdText}
        resumeText={resumeText}
        setResumeText={setResumeText}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />
    )}
  </Shell>;
}
