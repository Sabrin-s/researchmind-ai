import os
from typing import List, Dict, Any

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

def parse_pdf(file_path: str, chunk_size: int = 800, chunk_overlap: int = 150) -> List[Dict[str, Any]]:
    """
    Parses a PDF file from the local path.
    Extracts text page by page, splits it into overlapping chunks, and returns a list of dictionaries.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found at {file_path}")

    chunks = []
    filename = os.path.basename(file_path)

    # Fallback if PyMuPDF (fitz) is not installed
    if fitz is None:
        print("Warning: PyMuPDF is not installed. Using mock text extraction.")
        # Simple simulated extraction for demonstration
        dummy_text = (
            f"This is extracted text from the PDF file: {filename}. "
            "Autonomous agents represent a paradigm shift in Artificial Intelligence. "
            "Rather than replying statically to prompt templates, these systems plan tasks, "
            "evaluate their actions, and iterate. In critical sectors like medicine, agentic safety "
            "requires human-in-the-loop oversight to verify clinical drug dosages and treatment instructions."
        )
        return [{"text": dummy_text, "page": 1, "source": filename, "chunk_index": 0}]

    try:
        doc = fitz.open(file_path)
        full_text_list = []
        
        # Extract text from all pages
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            if text.strip():
                full_text_list.append((page_num + 1, text))
        
        # Combine pages and chunk them
        for page_num, text in full_text_list:
            cleaned_text = " ".join(text.split())
            words = cleaned_text.split()
            
            # Simple word-based chunker
            i = 0
            chunk_idx = 0
            while i < len(words):
                chunk_words = words[i:i + chunk_size]
                chunk_text = " ".join(chunk_words)
                
                chunks.append({
                    "text": chunk_text,
                    "page": page_num,
                    "source": filename,
                    "chunk_index": chunk_idx
                })
                
                chunk_idx += 1
                i += (chunk_size - chunk_overlap)
                
        doc.close()
    except Exception as e:
        print(f"Error parsing PDF file {file_path}: {e}")
        # Return at least a dummy chunk to prevent complete crash
        chunks.append({
            "text": f"Failed to extract text from {filename} due to error: {str(e)}",
            "page": 1,
            "source": filename,
            "chunk_index": 0
        })

    return chunks
