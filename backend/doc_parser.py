import io

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    from docx import Document
except ImportError:
    Document = None

def extract_text_from_bytes(filename: str, content: bytes) -> str:
    ext = filename.lower().split('.')[-1]
    if ext == 'pdf' and PdfReader is not None:
        try:
            reader = PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
            if text.strip():
                return text.strip()
        except Exception:
            pass
    elif ext in ['docx', 'doc'] and Document is not None:
        try:
            doc = Document(io.BytesIO(content))
            text = "\n".join([p.text for p in doc.paragraphs if p.text])
            if text.strip():
                return text.strip()
        except Exception:
            pass

    return content.decode('utf-8', errors='ignore').strip()
