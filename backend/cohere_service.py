import os
import json
import re
import cohere

def call_cohere_api(prompt: str, api_key: str = None, temperature: float = 0.3) -> str:
    key = api_key or os.environ.get("COHERE_API_KEY", "").strip()
    if not key:
        return ""
    try:
        co = cohere.ClientV2(api_key=key)
        res = co.chat(
            model="command-r-plus",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature
        )
        return res.message.content[0].text
    except Exception:
        try:
            co_legacy = cohere.Client(api_key=key)
            res = co_legacy.generate(
                prompt=prompt,
                max_tokens=1500,
                temperature=temperature
            )
            return res.generations[0].text
        except Exception:
            return ""

def clean_json_response(text: str) -> dict:
    if not text:
        return {}
    match = re.search(r'```json\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        match_arr = re.search(r'```json\s*(\[.*?\])\s*```', text, re.DOTALL)
        if match_arr:
            json_str = match_arr.group(1)
        else:
            json_str = text.strip()
    try:
        return json.loads(json_str)
    except Exception:
        first_brace = json_str.find('{')
        last_brace = json_str.rfind('}')
        if first_brace != -1 and last_brace != -1:
            try:
                return json.loads(json_str[first_brace:last_brace+1])
            except Exception:
                pass
        return {}

def analyze_job_description(jd_text: str, api_key: str = None) -> dict:
    prompt = f"""You are an expert AI recruiter. Analyze the following Job Description (JD) thoroughly.
Respond ONLY with valid JSON in this exact structure:
{{
  "role_title": "Extracted Job Title",
  "key_responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"],
  "required_skills": ["Skill 1", "Skill 2", "Skill 3"],
  "preferred_skills": ["Skill 1", "Skill 2"],
  "technical_competencies": ["Competency 1", "Competency 2"],
  "behavioural_competencies": ["Competency 1", "Competency 2"],
  "experience_expectations": "Summary of expected years/level of experience",
  "important_keywords": ["Keyword1", "Keyword2"],
  "important_concepts": ["Concept1", "Concept2"],
  "key_qualifications": ["Qualification 1", "Qualification 2"]
}}

Job Description:
{jd_text}
"""
    raw_res = call_cohere_api(prompt, api_key)
    parsed = clean_json_response(raw_res)
    if parsed and "role_title" in parsed:
        return parsed
    
    # Dynamic fallback parser based on actual input text
    lines = [l.strip() for l in jd_text.split('\n') if l.strip()]
    title = "Target Role"
    if lines:
        for line in lines[:5]:
            if any(term in line.lower() for term in ["engineer", "developer", "architect", "manager", "intern", "analyst", "lead", "specialist", "designer"]):
                title = line.strip("#*- ").strip()[:60]
                break
        if title == "Target Role" and len(lines[0]) < 60:
            title = lines[0].strip("#*- ").strip()

    # Extract responsibilities from bullet points or lines with action verbs
    responsibilities = []
    for line in lines:
        cleaned = line.strip("#*-• ")
        if any(line.strip().startswith(prefix) for prefix in ["-", "*", "•", "1.", "2.", "3."]) or any(verb in cleaned.lower() for verb in ["build", "develop", "design", "manage", "lead", "implement", "maintain", "create"]):
            if len(cleaned) > 15 and len(cleaned) < 160:
                responsibilities.append(cleaned)
    if not responsibilities:
        responsibilities = [
            "Build and maintain software components per specification",
            "Collaborate with team members to deliver core project functionality",
            "Ensure code quality, documentation, and automated testing"
        ]

    # Extract tech skills directly present in text
    tech_candidates = ["Python", "JavaScript", "TypeScript", "React", "Node.js", "Express", "Vue", "Angular", "Java", "C++", "C#", "Go", "Rust", "SQL", "PostgreSQL", "MongoDB", "Redis", "Machine Learning", "Deep Learning", "LLMs", "RAG", "APIs", "REST", "GraphQL", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "CI/CD", "Data Structures", "Algorithms", "System Design", "FastAPI", "Django", "Flask", "PyTorch", "TensorFlow"]
    req_skills = [s for s in tech_candidates if re.search(r'\b' + re.escape(s) + r'\b', jd_text, re.IGNORECASE)]
    if not req_skills:
        req_skills = ["Software Development", "Problem Solving", "Technical Communication", "System Architecture"]
    
    exp_match = re.search(r'(\d+\+?\s*(?:-\s*\d+)?\s*years?(?:\s*of\s*experience)?)', jd_text, re.IGNORECASE)
    exp_text = exp_match.group(1) if exp_match else "Relevant experience matching position level"

    return {
        "role_title": title,
        "key_responsibilities": responsibilities[:5],
        "required_skills": req_skills[:6],
        "preferred_skills": [s for s in tech_candidates if s not in req_skills and re.search(r'\b' + re.escape(s) + r'\b', jd_text, re.IGNORECASE)][:4] or ["Agile Development", "Automated Testing"],
        "technical_competencies": [f"Proficiency in {s}" for s in req_skills[:3]],
        "behavioural_competencies": ["Problem Solving", "Cross-functional Collaboration", "Analytical Thinking"],
        "experience_expectations": exp_text,
        "important_keywords": req_skills + ["Architecture", "Testing", "Deployment"],
        "important_concepts": ["Clean Architecture", "API Integration", "Performance Optimization"],
        "key_qualifications": [f"Demonstrated proficiency in {req_skills[0]} and software engineering best practices"]
    }

def analyze_candidate_fit(jd_text: str, resume_text: str, role_analysis: dict, api_key: str = None) -> dict:
    prompt = f"""You are an elite Talent Assessment Specialist. Compare the candidate's Resume against the Job Description.
Respond ONLY with valid JSON in this exact structure:
{{
  "job_fit_score": 82,
  "fit_label": "Strong Match",
  "candidate_key_skills": ["Skill1", "Skill2"],
  "relevant_experience": ["Exp highlight 1", "Exp highlight 2"],
  "relevant_projects": ["Project highlight 1", "Project highlight 2"],
  "relevant_achievements": ["Achievement 1", "Achievement 2"],
  "strengths_against_jd": ["Strength 1", "Strength 2"],
  "missing_skills": ["Missing 1", "Missing 2"],
  "weak_or_insufficient_areas": ["Weakness 1", "Weakness 2"],
  "probing_points": ["Specific claim in resume that needs probing"],
  "preparation_gaps": ["Gap 1 requiring extra study"],
  "strong_matches": ["Matching skill 1", "Matching skill 2"],
  "partial_matches": ["Partial skill 1"],
  "missing_weak": ["Missing skill 1"]
}}

Job Title: {role_analysis.get('role_title', 'Target Role')}
Required Skills: {json.dumps(role_analysis.get('required_skills', []))}
Job Description:
{jd_text}

Candidate Resume:
{resume_text}
"""
    raw_res = call_cohere_api(prompt, api_key)
    parsed = clean_json_response(raw_res)
    if parsed and "job_fit_score" in parsed:
        return parsed

    jd_skills = role_analysis.get('required_skills', ["Software Engineering", "Problem Solving"])
    resume_lower = resume_text.lower()
    matched = [s for s in jd_skills if s.lower() in resume_lower]
    missing = [s for s in jd_skills if s.lower() not in resume_lower]
    
    score = min(98, max(40, int((len(matched) / max(1, len(jd_skills))) * 70 + 25)))
    if score >= 75:
        label = "Strong Match"
    elif score >= 60:
        label = "Good Match"
    else:
        label = "Needs Preparation"

    extracted_projects = []
    probing = []
    for line in resume_text.split('\n'):
        cleaned = line.strip("#*-• ")
        if any(kw in cleaned.lower() for kw in ["built", "developed", "created", "implemented", "designed", "engineered", "led", "managed", "project"]):
            if len(cleaned) > 15:
                extracted_projects.append(cleaned[:100])
        if any(metric in cleaned for metric in ["%", "x", "ms", "sec", "users", "k", "million", "improved", "increased", "reduced"]):
            if len(cleaned) > 20:
                probing.append(f"Claimed impact: '{cleaned[:90]}'")

    if not extracted_projects:
        extracted_projects = ["Technical project work described in candidate resume"]
    if not probing:
        probing = ["Quantifiable impact and metrics achieved in past roles/projects", "Individual technical ownership versus team contributions"]

    return {
        "job_fit_score": score,
        "fit_label": label,
        "candidate_key_skills": matched if matched else ["Core Domain Foundations"],
        "relevant_experience": ["Hands-on experience in relevant projects and technical domain"],
        "relevant_projects": extracted_projects[:3],
        "relevant_achievements": ["Demonstrated project execution and problem solving"],
        "strengths_against_jd": [f"Direct match in {s}" for s in matched[:3]] if matched else ["Eagerness to learn and core technical background"],
        "missing_skills": missing if missing else ["Advanced System Architecture", "Large scale production monitoring"],
        "weak_or_insufficient_areas": [f"Limited resume evidence for {s}" for s in missing[:2]] if missing else ["Quantifiable baseline metrics on project performance"],
        "probing_points": probing[:3],
        "preparation_gaps": [f"Deep dive into {s} application" for s in missing[:2]] if missing else ["Structuring technical trade-offs using STAR method"],
        "strong_matches": matched[:4] if matched else ["Core Engineering Fundamentals"],
        "partial_matches": ["System Design Patterns", "Testing & Verification"],
        "missing_weak": missing[:3] if missing else ["Production scale optimization"]
    }

def generate_interview_question(
    jd_text: str,
    resume_text: str,
    role_analysis: dict,
    candidate_analysis: dict,
    level: int,
    history: list,
    api_key: str = None
) -> dict:
    history_context = ""
    if history:
        history_context = "Previous Conversation History:\n"
        for idx, turn in enumerate(history):
            history_context += f"Q{idx+1} ({turn.get('level', 'Level 1')}): {turn.get('question')}\nA{idx+1}: {turn.get('answer')}\nFeedback: {turn.get('eval_feedback', '')}\n---\n"

    level_names = {1: "Level 1 - Screening Interview", 2: "Level 2 - Competency Interview", 3: "Level 3 - Deep-Dive Interview"}
    level_focus = {
        1: "Focus on candidate's background, specific resume projects, motivation, and core skill alignment.",
        2: "Focus on technical depth, specific job competencies, architectural choices, problem solving, and decision making.",
        3: "Probe resume claims deeply, ask 'why' and 'how', test trade-offs, edge cases, and challenge previous answers dynamically."
    }

    prompt = f"""You are an expert technical interviewer conducting a {level_names.get(level, 'Interview')} for the role of {role_analysis.get('role_title', 'Software Engineer')}.
{level_focus.get(level, '')}

CRITICAL REQUIREMENT:
Do NOT ask generic questions like "Tell me about yourself".
Refer directly to specific details from candidate's resume (projects, skills, or claimed achievements).
If Level 3 or follow-up, react directly to candidate's previous answer in history!

Respond ONLY with valid JSON in this exact structure:
{{
  "question": "The exact interview question to ask the candidate.",
  "interviewer_intent": "Brief internal rationale for asking this specific question.",
  "expected_key_points": ["Point 1", "Point 2", "Point 3"]
}}

Candidate Fit Score: {candidate_analysis.get('job_fit_score', 75)}%
Probing Points: {json.dumps(candidate_analysis.get('probing_points', []))}
Projects: {json.dumps(candidate_analysis.get('relevant_projects', []))}
{history_context}

Job Title: {role_analysis.get('role_title')}
Resume Excerpt: {resume_text[:1200]}
"""
    raw_res = call_cohere_api(prompt, api_key, temperature=0.5)
    parsed = clean_json_response(raw_res)
    if parsed and "question" in parsed:
        return parsed

    projects = candidate_analysis.get("relevant_projects", [])
    skills = role_analysis.get("required_skills", ["Software Engineering"])
    first_skill = skills[0] if skills else "software engineering"
    proj_desc = projects[0] if projects else f"a recent {first_skill} project"

    if history and level == 3:
        last_turn = history[-1]
        last_ans = last_turn.get('answer', '')
        if any(kw in last_ans.lower() for kw in ["accuracy", "metric", "improved", "benchmark", "%"]):
            q = "What specific evaluation metrics or tools did you use to benchmark that outcome, and why was that approach chosen over alternative metrics?"
        elif any(kw in last_ans.lower() for kw in ["team", "we", "collaborated"]):
            q = "You mentioned 'we' worked on this solution. What was your precise individual technical contribution vs what other team members built?"
        else:
            q = f"Looking at your explanation, how would your architecture scale if data volume or user traffic increased by 10x? What system bottlenecks would emerge first?"
    elif level == 1:
        q = f"I noticed on your resume that you worked on {proj_desc}. Could you explain the core problem it solved, the tech stack you selected, and your primary role?"
    elif level == 2:
        q = f"In the {role_analysis.get('role_title', 'target role')} role, we rely on {first_skill}. Walk me through a challenging bug or technical trade-off you encountered when working with {first_skill}, and how you resolved it."
    else:
        q = f"Given your experience with {first_skill}, how do you ensure high reliability, test coverage, and performance when deploying code to production?"

    return {
        "question": q,
        "interviewer_intent": f"Evaluate practical depth in {first_skill} and verified candidate project experience.",
        "expected_key_points": ["Clear technical explanation", "Quantified impact", "Trade-off awareness"]
    }

def evaluate_candidate_answer(
    question: str,
    answer: str,
    role_analysis: dict,
    candidate_analysis: dict,
    level: int,
    history: list,
    api_key: str = None
) -> dict:
    prompt = f"""You are an elite AI technical interviewer evaluating a candidate's response.
Question Asked: "{question}"
Candidate Answer: "{answer}"
Role: {role_analysis.get('role_title', 'Target Role')}
Level: {level}

Respond ONLY with valid JSON in this exact structure:
{{
  "score": 78,
  "assessment": "Detailed evaluation of how effectively the candidate answered.",
  "what_was_good": "Specific strength in the response (e.g., explained technical stack clearly).",
  "what_could_be_better": "Specific area needing improvement (e.g., lacked baseline metrics or quantifiable impact).",
  "ideal_direction": "What a top-tier candidate response should have covered.",
  "follow_up_recommended": true,
  "suggested_follow_up": "A direct follow-up question probing deeper into their answer."
}}
"""
    raw_res = call_cohere_api(prompt, api_key, temperature=0.3)
    parsed = clean_json_response(raw_res)
    if parsed and "score" in parsed:
        return parsed

    words = answer.strip().split()
    ans_len = len(words)
    has_metrics = any(re.search(r'\b\d+%\b|\b\d+x\b|\bms\b|\bsec\b|\bbenchmark\b|\bmetric\b', w, re.I) for w in words)
    has_star = any(kw in answer.lower() for kw in ["result", "action", "task", "situation", "solved", "resolved", "improved", "built"])

    if ans_len < 15:
        score = 45
        good = "Provided a direct concise response."
        better = "The answer was very brief and lacked technical detail, architecture decisions, and reasoning."
        ideal = "Use the STAR method: explain the situation, technical challenge, specific actions taken, tools used, and measurable results achieved."
        follow = "Could you elaborate in detail on the specific technical architecture and trade-offs involved?"
    elif ans_len < 40:
        score = 70 + (5 if has_metrics else 0)
        good = "Addressed the core question with relevant technical context."
        better = "Include specific performance metrics, baseline comparisons, or concrete trade-offs made."
        ideal = "Detail the exact methodology, tools used, benchmark metrics evaluated, and edge cases handled."
        follow = "What specific metric or profiling tool did you use to verify that outcome?"
    else:
        score = 82 + (8 if has_metrics and has_star else 3)
        good = "Comprehensive response demonstrating solid practical experience and technical clarity."
        better = "Ensure to explicitly articulate architectural trade-offs considered before choosing the final design."
        ideal = "Quantify business impact, baseline metrics, edge case failure modes, and monitoring strategy."
        follow = "How would you adapt this solution if system load or memory constraints changed significantly?"

    return {
        "score": min(96, score),
        "assessment": f"Candidate provided a {score}/100 quality answer with relevant domain context.",
        "what_was_good": good,
        "what_could_be_better": better,
        "ideal_direction": ideal,
        "follow_up_recommended": True,
        "suggested_follow_up": follow
    }

def generate_performance_report(
    jd_text: str,
    resume_text: str,
    role_analysis: dict,
    candidate_analysis: dict,
    history: list,
    api_key: str = None
) -> dict:
    history_str = json.dumps(history, indent=2)
    prompt = f"""You are an executive interviewer and career coach. Generate a complete Interview Performance Report based on this interview transcript.

Transcript:
{history_str}

Job Title: {role_analysis.get('role_title')}
Job Fit: {candidate_analysis.get('job_fit_score')}%

Respond ONLY with valid JSON in this exact structure:
{{
  "overall_score": 78,
  "readiness_status": "Interview Ready",
  "readiness_code": "yellow",
  "readiness_description": "Candidate can reasonably attempt the interview but needs polish in deep technical metrics.",
  "competency_scores": {{
    "role_fit": 82,
    "technical_knowledge": 75,
    "problem_solving": 80,
    "communication": 78,
    "confidence": 76,
    "depth_of_understanding": 72,
    "behavioural_fit": 84
  }},
  "strengths": [
    "Clear communication of project architecture",
    "Strong technical baseline in key domain skills",
    "Good problem-solving methodology"
  ],
  "weaknesses": [
    "Lacks quantifiable metrics when explaining project outcomes",
    "Needs deeper understanding of system design trade-offs",
    "Could provide more structured STAR answers for behavioural scenarios"
  ],
  "preparation_gaps": [
    {{
      "priority": "Priority 1",
      "topic": "System Design & Architecture",
      "review_points": ["Chunking & Embeddings", "Vector databases", "Latency trade-offs", "Scalability bottlenecks"]
    }},
    {{
      "priority": "Priority 2",
      "topic": "Quantitative Performance Metrics",
      "review_points": ["Baseline vs benchmark comparisons", "Precision, Recall, F1 vs Accuracy", "Profiling tools"]
    }},
    {{
      "priority": "Priority 3",
      "topic": "STAR Framework Behavioural Mastery",
      "review_points": ["Structuring Situation & Task", "Highlighting individual Action", "Quantifying Result"]
    }}
  ],
  "question_evaluations": [
    {{
      "question": "Question text",
      "candidate_answer": "Answer text",
      "assessment": "Assessment text",
      "what_was_good": "Good points",
      "what_could_be_better": "Better points",
      "ideal_direction": "Ideal direction"
    }}
  ]
}}
"""
    raw_res = call_cohere_api(prompt, api_key, temperature=0.3)
    parsed = clean_json_response(raw_res)
    if parsed and "overall_score" in parsed:
        return parsed

    scores = [turn.get("score", 75) for turn in history if isinstance(turn, dict) and "score" in turn]
    avg_score = int(sum(scores) / max(1, len(scores))) if scores else candidate_analysis.get("job_fit_score", 75)

    if avg_score >= 85:
        code = "green"
        status = "Strong Candidate"
        desc = "Candidate demonstrates strong readiness for the role with excellent technical and communication depth."
    elif avg_score >= 70:
        code = "yellow"
        status = "Interview Ready"
        desc = "Candidate can reasonably attempt the interview but would benefit from targeted preparation on system metrics."
    elif avg_score >= 55:
        code = "orange"
        status = "Needs Preparation"
        desc = "Some important preparation gaps remain in technical depth and scenario explanations."
    else:
        code = "red"
        status = "Not Ready"
        desc = "Significant preparation required before attempting real interviews."

    q_evals = []
    for turn in history:
        if isinstance(turn, dict):
            q_evals.append({
                "question": turn.get("question", ""),
                "candidate_answer": turn.get("answer", ""),
                "assessment": turn.get("assessment", "Solid effort addressing the prompt."),
                "what_was_good": turn.get("what_was_good", "Directly addressed the interviewer's question."),
                "what_could_be_better": turn.get("what_could_be_better", "Incorporate quantifiable metrics and structured STAR methodology."),
                "ideal_direction": turn.get("ideal_direction", "Explain situation, precise individual actions, baseline metrics, and business outcome.")
            })

    # Communication signal analysis across all turns
    all_answers = " ".join([turn.get("answer", "") for turn in history if isinstance(turn, dict)])
    words = all_answers.split()
    filler_regex = re.compile(r'\b(um|uh|like|you know|basically|actually|sort of|kind of)\b', re.IGNORECASE)
    filler_matches = filler_regex.findall(all_answers)
    total_fillers = len(filler_matches)

    total_duration = sum([turn.get("durationSeconds", 0) for turn in history if isinstance(turn, dict) and turn.get("durationSeconds")])
    if total_duration > 0 and len(words) > 0:
        avg_wpm = int((len(words) / total_duration) * 60)
    else:
        avg_wpm = 135

    pace_status = "Optimal Pace (120-160 WPM)" if 110 <= avg_wpm <= 165 else ("Pacing Fast (>165 WPM)" if avg_wpm > 165 else "Pacing Slow (<110 WPM)")
    if total_fillers <= 2 and avg_score >= 75:
        confidence_level = "High Confidence"
    elif total_fillers <= 6 and avg_score >= 60:
        confidence_level = "Steady & Composed"
    else:
        confidence_level = "Needs Polish (Frequent Fillers / Hesitations)"

    top_skill = role_analysis.get("required_skills", ["Core Domain"])[0] if role_analysis.get("required_skills") else "Core Technical"

    return {
        "overall_score": avg_score,
        "readiness_status": status,
        "readiness_code": code,
        "readiness_description": desc,
        "competency_scores": {
            "role_fit": min(98, avg_score + 3),
            "technical_knowledge": min(98, max(40, avg_score - 2)),
            "problem_solving": min(98, avg_score + 2),
            "communication": min(98, avg_score + 4),
            "confidence": min(98, avg_score - 1),
            "depth_of_understanding": min(98, max(35, avg_score - 4)),
            "behavioural_fit": min(98, avg_score + 5)
        },
        "strengths": candidate_analysis.get("strengths_against_jd", [
            "Clear technical communication of project experience",
            "Good foundational understanding of role requirements"
        ]),
        "weaknesses": candidate_analysis.get("weak_or_insufficient_areas", [
            "Limited quantification of project impact and baseline metrics",
            "Elaborate deeper on architectural trade-offs under scale"
        ]),
        "preparation_gaps": [
            {
                "priority": "Priority 1",
                "topic": f"{top_skill} Architecture & System Design",
                "review_points": ["Core concepts", "Performance optimizations", "Production edge cases", "Scalability bottlenecks"]
            },
            {
                "priority": "Priority 2",
                "topic": "Metrics & Quantitative Impact",
                "review_points": ["Baseline measurements", "Benchmark results", "Trade-off analysis", "Error profiling"]
            },
            {
                "priority": "Priority 3",
                "topic": "STAR Framework Behavioural Delivery",
                "review_points": ["Situation setting", "Task identification", "Action breakdown", "Result quantification"]
            }
        ],
        "question_evaluations": q_evals,
        "communication_signals": {
            "avg_wpm": avg_wpm,
            "total_filler_words": total_fillers,
            "confidence_level": confidence_level,
            "pace_status": pace_status
        }
    }
