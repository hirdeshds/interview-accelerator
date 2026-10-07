import os
import json
import re
import cohere
from dotenv import load_dotenv

# Automatically load backend/.env if present
_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_env_path):
    load_dotenv(_env_path)
load_dotenv()

# Active supported Cohere models in order of capability
ACTIVE_MODELS = [
    "command-r-plus-08-2024",
    "command-r-08-2024",
    "command-r7b-12-2024"
]

def call_cohere_api(prompt: str, api_key: str = None, temperature: float = 0.3) -> str:
    key = (api_key or os.environ.get("COHERE_API_KEY", "")).strip()
    if not key:
        raise ValueError(
            "COHERE_API_KEY is missing. Please set your active Cohere API key in backend/.env "
            "or enter it in the application setup dialog."
        )

    last_error = None
    for model_name in ACTIVE_MODELS:
        try:
            co = cohere.ClientV2(api_key=key)
            res = co.chat(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature
            )
            if res.message and res.message.content:
                text = res.message.content[0].text
                if text and text.strip():
                    return text.strip()
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"Cohere API call failed across all supported models ({ACTIVE_MODELS}): {last_error}")

def clean_json_response(text: str) -> dict:
    if not text:
        return {}
    # Search for markdown fenced JSON code block
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        match_arr = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', text, re.DOTALL)
        if match_arr:
            json_str = match_arr.group(1)
        else:
            json_str = text.strip()

    try:
        return json.loads(json_str)
    except Exception:
        # Fallback to finding outermost curly brackets
        first_brace = json_str.find('{')
        last_brace = json_str.rfind('}')
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            try:
                return json.loads(json_str[first_brace:last_brace+1])
            except Exception:
                pass
        return {}

def analyze_job_description(jd_text: str, api_key: str = None) -> dict:
    """
    Step 1: Understand the Role.
    Extracts core responsibilities, required & preferred skills, competencies, and expectations
    directly from the provided Job Description using the live Cohere LLM.
    """
    if not jd_text or not jd_text.strip():
        raise ValueError("Job Description cannot be empty.")

    prompt = f"""You are an elite talent acquisition leader and hiring manager.
Thoroughly analyze the provided Job Description (JD). Extract the exact requirements, competencies,
skills, and expectations from the actual text. Do NOT use generic placeholders or sample data.

Respond ONLY with valid, raw JSON in this exact structure:
{{
  "role_title": "Extracted Job Title",
  "key_responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"],
  "required_skills": ["Required Skill 1", "Required Skill 2", "Required Skill 3"],
  "preferred_skills": ["Preferred Skill 1", "Preferred Skill 2"],
  "technical_competencies": ["Technical Competency 1", "Technical Competency 2"],
  "behavioural_competencies": ["Behavioural Competency 1", "Behavioural Competency 2"],
  "experience_expectations": "Exact years of experience and seniority level described in the JD",
  "important_keywords": ["Keyword 1", "Keyword 2", "Keyword 3"],
  "important_concepts": ["Concept 1", "Concept 2"],
  "key_qualifications": ["Key Qualification 1", "Key Qualification 2"]
}}

Job Description:
{jd_text}
"""
    raw_res = call_cohere_api(prompt, api_key, temperature=0.2)
    parsed = clean_json_response(raw_res)

    if not parsed or "role_title" not in parsed:
        # Retry with an explicit format correction prompt
        repair_prompt = f"Convert the following text into valid JSON with keys: role_title, key_responsibilities, required_skills, preferred_skills, technical_competencies, behavioural_competencies, experience_expectations, important_keywords, important_concepts, key_qualifications:\n\n{raw_res}"
        repaired_res = call_cohere_api(repair_prompt, api_key, temperature=0.1)
        parsed = clean_json_response(repaired_res)

    if not parsed or "role_title" not in parsed:
        raise RuntimeError("Failed to extract structured role analysis from Job Description via Cohere.")

    return parsed

def analyze_candidate_fit(jd_text: str, resume_text: str, role_analysis: dict, api_key: str = None) -> dict:
    """
    Step 2: Understand the Candidate.
    Objectively compares the candidate's actual resume against the role requirements,
    calculating fit scores, evidence of projects, strong matches, gaps, and probing points.
    """
    if not resume_text or not resume_text.strip():
        raise ValueError("Candidate resume cannot be empty.")

    role_title = role_analysis.get('role_title', 'Target Role')
    req_skills = json.dumps(role_analysis.get('required_skills', []))

    prompt = f"""You are a senior technical interviewer and talent assessor.
Compare the candidate's real Resume against the Job Description for '{role_title}'.
Base your analysis STRICTLY on the actual resume and JD provided. Do NOT fabricate or mock details.

Respond ONLY with valid, raw JSON in this exact structure:
{{
  "job_fit_score": 82,
  "fit_label": "Strong Match",
  "candidate_key_skills": ["Skill 1", "Skill 2"],
  "relevant_experience": ["Experience point 1", "Experience point 2"],
  "relevant_projects": ["Specific project named in resume with details", "Second project named in resume"],
  "relevant_achievements": ["Achievement or impact cited in resume"],
  "strengths_against_jd": ["Specific alignment between candidate background and role need"],
  "missing_skills": ["Required skill from JD not present or weak in resume"],
  "weak_or_insufficient_areas": ["Areas where evidence in resume is limited or unquantified"],
  "probing_points": ["Specific claims or projects in resume that should be verified in the interview"],
  "preparation_gaps": ["Actionable preparation topics candidate needs to review"],
  "strong_matches": ["Skills directly proven in resume"],
  "partial_matches": ["Skills mentioned superficially"],
  "missing_weak": ["Skills completely absent"]
}}

Job Title: {role_title}
Required Skills: {req_skills}
Job Description:
{jd_text}

Candidate Resume:
{resume_text}
"""
    raw_res = call_cohere_api(prompt, api_key, temperature=0.2)
    parsed = clean_json_response(raw_res)

    if not parsed or "job_fit_score" not in parsed:
        repair_prompt = f"Convert the following candidate evaluation into valid JSON matching the required schema:\n\n{raw_res}"
        repaired_res = call_cohere_api(repair_prompt, api_key, temperature=0.1)
        parsed = clean_json_response(repaired_res)

    if not parsed or "job_fit_score" not in parsed:
        raise RuntimeError("Failed to evaluate candidate fit score and gaps via Cohere.")

    return parsed

def generate_interview_question(
    jd_text: str,
    resume_text: str,
    role_analysis: dict,
    candidate_analysis: dict,
    level: int,
    history: list,
    api_key: str = None
) -> dict:
    """
    Step 3 & 4: Multi-Level Adaptive AI Interviewer.
    Generates dynamic interview questions tailored to the candidate's actual projects,
    probing claims, and reacting to previous answers in the conversation history.
    """
    level_names = {
        1: "Level 1 - Screening Interview",
        2: "Level 2 - Competency & Architecture Interview",
        3: "Level 3 - Deep-Dive Probing Interview"
    }

    level_focus = {
        1: "Focus on candidate's background, specific resume projects, motivation, and core technical skill alignment.",
        2: "Focus on technical depth, core job competencies, architectural choices, problem solving, and trade-offs.",
        3: "Probe specific claims and metrics from previous candidate answers and resume projects. Challenge assumptions, ask 'why' and 'how', test edge cases."
    }

    history_context = ""
    if history:
        history_context = "Previous Conversation History:\n"
        for idx, turn in enumerate(history):
            history_context += (
                f"Q{idx+1} ({turn.get('level', 'Level 1')}): {turn.get('question')}\n"
                f"Candidate Answer: {turn.get('answer')}\n"
                f"Interviewer Feedback: {turn.get('eval_feedback', '')}\n---\n"
            )

    role_title = role_analysis.get('role_title', 'Target Role')
    projects = json.dumps(candidate_analysis.get('relevant_projects', []))
    probing_points = json.dumps(candidate_analysis.get('probing_points', []))

    prompt = f"""You are an elite, realistic technical interviewer conducting a {level_names.get(level, 'Technical Interview')} for the role of '{role_title}'.
{level_focus.get(level, '')}

CRITICAL RULES:
1. Do NOT ask generic questions like 'Tell me about yourself'.
2. Reference actual projects, skills, or metrics from the candidate's resume: {projects}.
3. If this is Level 3 or follow-up question, directly challenge and probe the candidate's PREVIOUS answers from history!
4. Target identified probing points: {probing_points}.

Respond ONLY with valid, raw JSON in this exact structure:
{{
  "question": "The exact interview question to ask the candidate.",
  "interviewer_intent": "Strategic rationale for asking this specific question.",
  "expected_key_points": ["Key technical concept 1", "Key technical concept 2", "Trade-off or metric expected"]
}}

Candidate Alignment: {candidate_analysis.get('job_fit_score', 75)}%
Resume Excerpt:
{resume_text[:1500]}

{history_context}
"""
    raw_res = call_cohere_api(prompt, api_key, temperature=0.4)
    parsed = clean_json_response(raw_res)

    if not parsed or "question" not in parsed:
        repair_prompt = f"Convert the following text into valid JSON with keys 'question', 'interviewer_intent', 'expected_key_points':\n\n{raw_res}"
        repaired_res = call_cohere_api(repair_prompt, api_key, temperature=0.1)
        parsed = clean_json_response(repaired_res)

    if not parsed or "question" not in parsed:
        raise RuntimeError("Failed to generate dynamic interview question via Cohere.")

    return parsed

def evaluate_candidate_answer(
    question: str,
    answer: str,
    role_analysis: dict,
    candidate_analysis: dict,
    level: int,
    history: list,
    api_key: str = None
) -> dict:
    """
    Step 4: Answer Evaluation & Feedback.
    Evaluates candidate's real response with instant feedback, strengths, gaps,
    and ideal STAR direction.
    """
    if not answer or not answer.strip():
        raise ValueError("Candidate answer cannot be empty.")

    role_title = role_analysis.get('role_title', 'Target Role')

    prompt = f"""You are a senior technical interviewer evaluating a live candidate's response.
Provide rigorous, realistic, constructive feedback.

Role: {role_title}
Interview Level: {level}
Question Asked: "{question}"
Candidate Answer: "{answer}"

Respond ONLY with valid, raw JSON in this exact structure:
{{
  "score": 78,
  "assessment": "Comprehensive assessment of the response quality and technical clarity.",
  "what_was_good": "Specific positive aspects (e.g., clear explanation of technologies and problem statement).",
  "what_could_be_better": "Specific constructive feedback (e.g., missing quantifiable results, baseline metrics, or trade-offs).",
  "ideal_direction": "Concrete blueprint of what an exemplary answer covering the STAR method should have included.",
  "follow_up_recommended": true,
  "suggested_follow_up": "A direct follow-up question to probe deeper into their answer."
}}
"""
    raw_res = call_cohere_api(prompt, api_key, temperature=0.2)
    parsed = clean_json_response(raw_res)

    if not parsed or "score" not in parsed:
        repair_prompt = f"Convert this candidate answer evaluation into valid JSON matching keys score, assessment, what_was_good, what_could_be_better, ideal_direction, follow_up_recommended, suggested_follow_up:\n\n{raw_res}"
        repaired_res = call_cohere_api(repair_prompt, api_key, temperature=0.1)
        parsed = clean_json_response(repaired_res)

    if not parsed or "score" not in parsed:
        raise RuntimeError("Failed to evaluate candidate answer via Cohere.")

    return parsed

def generate_performance_report(
    jd_text: str,
    resume_text: str,
    role_analysis: dict,
    candidate_analysis: dict,
    history: list,
    api_key: str = None
) -> dict:
    """
    Step 5 & 6: Comprehensive Performance Report & Readiness Assessment.
    Analyzes the complete interview transcript to compute readiness ratings,
    competency breakdowns, speech communication signals, and a personalized preparation plan.
    """
    if not history:
        raise ValueError("Cannot generate performance report without interview questions and answers.")

    history_str = json.dumps(history, indent=2)
    role_title = role_analysis.get('role_title', 'Target Role')
    fit_score = candidate_analysis.get('job_fit_score', 75)

    prompt = f"""You are an executive interviewer and career coach.
Generate a comprehensive, actionable Interview Performance Report evaluating this candidate's actual interview transcript.

Job Title: {role_title}
Baseline Job Fit Score: {fit_score}%
Interview Transcript:
{history_str}

Respond ONLY with valid, raw JSON in this exact structure:
{{
  "overall_score": 80,
  "readiness_status": "Interview Ready",
  "readiness_code": "yellow",
  "readiness_description": "Candidate demonstrates practical knowledge but needs refinement in quantitative metrics and scalability trade-offs.",
  "competency_scores": {{
    "role_fit": 82,
    "technical_knowledge": 78,
    "problem_solving": 80,
    "communication": 75,
    "confidence": 76,
    "depth_of_understanding": 74,
    "behavioural_fit": 82
  }},
  "strengths": [
    "Strength 1 based on their actual answers",
    "Strength 2 based on their actual answers",
    "Strength 3 based on their actual answers"
  ],
  "weaknesses": [
    "Weakness 1 based on their actual answers",
    "Weakness 2 based on their actual answers",
    "Weakness 3 based on their actual answers"
  ],
  "preparation_gaps": [
    {{
      "priority": "Priority 1",
      "topic": "Topic area needing immediate study",
      "review_points": ["Review item A", "Review item B", "Review item C"]
    }},
    {{
      "priority": "Priority 2",
      "topic": "Secondary topic area",
      "review_points": ["Review item A", "Review item B"]
    }},
    {{
      "priority": "Priority 3",
      "topic": "Third topic area",
      "review_points": ["Review item A", "Review item B"]
    }}
  ],
  "question_evaluations": [
    {{
      "question": "Question text from transcript",
      "candidate_answer": "Candidate answer text",
      "assessment": "Specific assessment",
      "what_was_good": "Good elements",
      "what_could_be_better": "Areas to improve",
      "ideal_direction": "Ideal answer path"
    }}
  ]
}}
"""
    raw_res = call_cohere_api(prompt, api_key, temperature=0.2)
    parsed = clean_json_response(raw_res)

    if not parsed or "overall_score" not in parsed:
        repair_prompt = f"Convert the following performance report into valid JSON matching the required schema:\n\n{raw_res}"
        repaired_res = call_cohere_api(repair_prompt, api_key, temperature=0.1)
        parsed = clean_json_response(repaired_res)

    if not parsed or "overall_score" not in parsed:
        raise RuntimeError("Failed to generate comprehensive performance report via Cohere.")

    # Calculate communication and speech analytics dynamically from candidate's actual answers
    all_answers = " ".join([turn.get("answer", "") for turn in history if isinstance(turn, dict)])
    words = all_answers.split()
    filler_regex = re.compile(r'\b(um|uh|like|you know|basically|actually|sort of|kind of|so yeah)\b', re.IGNORECASE)
    filler_matches = filler_regex.findall(all_answers)
    total_fillers = len(filler_matches)

    total_duration = sum([turn.get("durationSeconds", 0) for turn in history if isinstance(turn, dict) and turn.get("durationSeconds")])
    if total_duration > 0 and len(words) > 0:
        avg_wpm = int((len(words) / total_duration) * 60)
    else:
        avg_wpm = 135

    pace_status = (
        "Optimal Pace (120-160 WPM)"
        if 110 <= avg_wpm <= 165
        else ("Pacing Fast (>165 WPM)" if avg_wpm > 165 else "Pacing Slow (<110 WPM)")
    )

    overall_score = parsed.get("overall_score", 75)
    if total_fillers <= 2 and overall_score >= 75:
        confidence_level = "High Confidence"
    elif total_fillers <= 6 and overall_score >= 60:
        confidence_level = "Steady & Composed"
    else:
        confidence_level = "Needs Polish (Frequent Fillers / Hesitations)"

    parsed["communication_signals"] = {
        "avg_wpm": avg_wpm,
        "total_filler_words": total_fillers,
        "confidence_level": confidence_level,
        "pace_status": pace_status
    }

    return parsed
