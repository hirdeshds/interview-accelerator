from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from doc_parser import extract_text_from_bytes
import cohere_service

app = FastAPI(title="Interview Accelerator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeJDRequest(BaseModel):
    jd_text: str
    api_key: Optional[str] = None

class AnalyzeCandidateRequest(BaseModel):
    jd_text: str
    resume_text: str
    role_analysis: Dict[str, Any]
    api_key: Optional[str] = None

class GenerateQuestionRequest(BaseModel):
    jd_text: str
    resume_text: str
    role_analysis: Dict[str, Any]
    candidate_analysis: Dict[str, Any]
    level: int
    history: List[Dict[str, Any]]
    api_key: Optional[str] = None

class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    role_analysis: Dict[str, Any]
    candidate_analysis: Dict[str, Any]
    level: int
    history: List[Dict[str, Any]]
    api_key: Optional[str] = None

class GenerateReportRequest(BaseModel):
    jd_text: str
    resume_text: str
    role_analysis: Dict[str, Any]
    candidate_analysis: Dict[str, Any]
    history: List[Dict[str, Any]]
    api_key: Optional[str] = None

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Interview Accelerator Backend is running"}

@app.post("/api/upload-file")
async def upload_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        extracted_text = extract_text_from_bytes(file.filename, content)
        return {
            "filename": file.filename,
            "text": extracted_text,
            "length": len(extracted_text)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze-jd")
def analyze_jd(req: AnalyzeJDRequest):
    if not req.jd_text.strip():
        raise HTTPException(status_code=400, detail="Job Description cannot be empty")
    return cohere_service.analyze_job_description(req.jd_text, req.api_key)

@app.post("/api/analyze-candidate")
def analyze_candidate(req: AnalyzeCandidateRequest):
    if not req.resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty")
    return cohere_service.analyze_candidate_fit(req.jd_text, req.resume_text, req.role_analysis, req.api_key)

@app.post("/api/generate-question")
def generate_question(req: GenerateQuestionRequest):
    return cohere_service.generate_interview_question(
        req.jd_text,
        req.resume_text,
        req.role_analysis,
        req.candidate_analysis,
        req.level,
        req.history,
        req.api_key
    )

@app.post("/api/evaluate-answer")
def evaluate_answer(req: EvaluateAnswerRequest):
    return cohere_service.evaluate_candidate_answer(
        req.question,
        req.answer,
        req.role_analysis,
        req.candidate_analysis,
        req.level,
        req.history,
        req.api_key
    )

@app.post("/api/generate-report")
def generate_report(req: GenerateReportRequest):
    return cohere_service.generate_performance_report(
        req.jd_text,
        req.resume_text,
        req.role_analysis,
        req.candidate_analysis,
        req.history,
        req.api_key
    )

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8005))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
# trigger uvicorn reload


