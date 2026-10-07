import io
from typing import Optional

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    from docx import Document
except ImportError:
    Document = None

def validate_document_size(content: bytes, max_mb: int = 10) -> None:
    """Validate that the uploaded file size is within acceptable limits."""
    max_bytes = max_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise ValueError(f"File size exceeds maximum allowed size of {max_mb} MB.")

def extract_pdf_text(content: bytes) -> str:
    """Extract textual content from PDF byte stream."""
    if PdfReader is None:
        raise RuntimeError("pypdf is not installed. Please install pypdf to parse PDF files.")
    try:
        reader = PdfReader(io.BytesIO(content))
        pages_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t and t.strip():
                pages_text.append(t.strip())
        return "\n\n".join(pages_text).strip()
    except Exception as e:
        raise RuntimeError(f"Error parsing PDF document: {e}")

def extract_docx_text(content: bytes) -> str:
    """Extract textual content from DOCX/DOC byte stream."""
    if Document is None:
        raise RuntimeError("python-docx is not installed. Please install python-docx to parse DOCX files.")
    try:
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]
        return "\n".join(paragraphs).strip()
    except Exception as e:
        raise RuntimeError(f"Error parsing DOCX document: {e}")

def extract_plain_text(content: bytes) -> str:
    """Extract textual content from plain text or fallback byte stream."""
    try:
        return content.decode('utf-8').strip()
    except UnicodeDecodeError:
        return content.decode('latin-1', errors='ignore').strip()

def extract_text_from_bytes(filename: str, content: bytes) -> str:
    """
    Main dispatcher function to extract clean text from PDF, DOCX, or plain text files.
    """
    validate_document_size(content)
    ext = filename.lower().split('.')[-1]

    if ext == 'pdf':
        text = extract_pdf_text(content)
        if text:
            return text
    elif ext in ['docx', 'doc']:
        text = extract_docx_text(content)
        if text:
            return text

    # Fallback for .txt or unknown raw text files
    return extract_plain_text(content)
