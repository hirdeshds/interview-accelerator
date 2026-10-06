let RAW_BASE_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
if (RAW_BASE_URL && !RAW_BASE_URL.startsWith("http://") && !RAW_BASE_URL.startsWith("https://")) {
  RAW_BASE_URL = `https://${RAW_BASE_URL}`;
}
const BASE_URL = RAW_BASE_URL;
const DIRECT_BACKEND_URL = "http://127.0.0.1:8005";

export interface RoleAnalysis {
  role_title: string;
  key_responsibilities: string[];
  required_skills: string[];
  preferred_skills: string[];
  technical_competencies: string[];
  behavioural_competencies: string[];
  experience_expectations: string;
  important_keywords: string[];
  important_concepts: string[];
  key_qualifications: string[];
}

export interface CandidateAnalysis {
  job_fit_score: number;
  fit_label: string;
  candidate_key_skills: string[];
  relevant_experience: string[];
  relevant_projects: string[];
  relevant_achievements: string[];
  strengths_against_jd: string[];
  missing_skills: string[];
  weak_or_insufficient_areas: string[];
  probing_points: string[];
  preparation_gaps: string[];
  strong_matches: string[];
  partial_matches: string[];
  missing_weak: string[];
}

export interface QuestionTurn {
  level: number;
  question: string;
  answer?: string;
  score?: number;
  assessment?: string;
  what_was_good?: string;
  what_could_be_better?: string;
  ideal_direction?: string;
  interviewer_intent?: string;
  expected_key_points?: string[];
  durationSeconds?: number;
  wpm?: number;
  fillerCount?: number;
  confidence?: string;
}

export interface QuestionResponse {
  question: string;
  interviewer_intent: string;
  expected_key_points: string[];
}

export interface EvalResponse {
  score: number;
  assessment: string;
  what_was_good: string;
  what_could_be_better: string;
  ideal_direction: string;
  follow_up_recommended: boolean;
  suggested_follow_up: string;
}

export interface ReportResponse {
  overall_score: number;
  readiness_status: string;
  readiness_code: "green" | "yellow" | "orange" | "red";
  readiness_description: string;
  competency_scores: {
    role_fit: number;
    technical_knowledge: number;
    problem_solving: number;
    communication: number;
    confidence: number;
    depth_of_understanding: number;
    behavioural_fit: number;
  };
  strengths: string[];
  weaknesses: string[];
  preparation_gaps: {
    priority: string;
    topic: string;
    review_points: string[];
  }[];
  question_evaluations: {
    question: string;
    candidate_answer: string;
    assessment: string;
    what_was_good: string;
    what_could_be_better: string;
    ideal_direction: string;
  }[];
  communication_signals?: {
    avg_wpm: number;
    total_filler_words: number;
    confidence_level: string;
    pace_status: string;
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const tryFetch = async (targetBase: string): Promise<Response> => {
    return fetch(`${targetBase}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  };

  let response: Response;
  try {
    response = await tryFetch(BASE_URL);
  } catch (err) {
    if (BASE_URL === "") {
      try {
        response = await tryFetch(DIRECT_BACKEND_URL);
      } catch {
        throw new Error("Unable to reach backend server. Please verify FastAPI is running at http://127.0.0.1:8000.");
      }
    } else {
      throw err;
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let message = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.detail) message = errJson.detail;
    } catch {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }

  return response.json();
}

export async function uploadFile(file: File): Promise<{ filename: string; text: string; length: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const tryUpload = async (targetBase: string): Promise<Response> => {
    return fetch(`${targetBase}/api/upload-file`, {
      method: "POST",
      body: formData,
    });
  };

  let response: Response;
  try {
    response = await tryUpload(BASE_URL);
  } catch (err) {
    if (BASE_URL === "") {
      try {
        response = await tryUpload(DIRECT_BACKEND_URL);
      } catch {
        throw new Error("Failed to reach backend at http://127.0.0.1:8000 to upload document.");
      }
    } else {
      throw err;
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let message = `Failed to upload file: ${response.statusText}`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.detail) message = errJson.detail;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export async function analyzeJD(jdText: string, apiKey?: string): Promise<RoleAnalysis> {
  return request<RoleAnalysis>("/api/analyze-jd", {
    method: "POST",
    body: JSON.stringify({ jd_text: jdText, api_key: apiKey }),
  });
}

export async function analyzeCandidate(
  jdText: string,
  resumeText: string,
  roleAnalysis: RoleAnalysis,
  apiKey?: string
): Promise<CandidateAnalysis> {
  return request<CandidateAnalysis>("/api/analyze-candidate", {
    method: "POST",
    body: JSON.stringify({
      jd_text: jdText,
      resume_text: resumeText,
      role_analysis: roleAnalysis,
      api_key: apiKey,
    }),
  });
}

export async function generateQuestion(
  jdText: string,
  resumeText: string,
  roleAnalysis: RoleAnalysis,
  candidateAnalysis: CandidateAnalysis,
  level: number,
  history: QuestionTurn[],
  apiKey?: string
): Promise<QuestionResponse> {
  return request<QuestionResponse>("/api/generate-question", {
    method: "POST",
    body: JSON.stringify({
      jd_text: jdText,
      resume_text: resumeText,
      role_analysis: roleAnalysis,
      candidate_analysis: candidateAnalysis,
      level,
      history,
      api_key: apiKey,
    }),
  });
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  roleAnalysis: RoleAnalysis,
  candidateAnalysis: CandidateAnalysis,
  level: number,
  history: QuestionTurn[],
  apiKey?: string
): Promise<EvalResponse> {
  return request<EvalResponse>("/api/evaluate-answer", {
    method: "POST",
    body: JSON.stringify({
      question,
      answer,
      role_analysis: roleAnalysis,
      candidate_analysis: candidateAnalysis,
      level,
      history,
      api_key: apiKey,
    }),
  });
}

export async function generateReport(
  jdText: string,
  resumeText: string,
  roleAnalysis: RoleAnalysis,
  candidateAnalysis: CandidateAnalysis,
  history: QuestionTurn[],
  apiKey?: string
): Promise<ReportResponse> {
  return request<ReportResponse>("/api/generate-report", {
    method: "POST",
    body: JSON.stringify({
      jd_text: jdText,
      resume_text: resumeText,
      role_analysis: roleAnalysis,
      candidate_analysis: candidateAnalysis,
      history,
      api_key: apiKey,
    }),
  });
}
