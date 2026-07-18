import os
import sys
import unittest

# Adjust path to import backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.tools.embeddings import EmbeddingClient
from backend.tools.vector_store import LocalVectorStore
from backend.tools.pdf_parser import parse_pdf
from backend.config import settings

class TestResearchMindBackend(unittest.TestCase):
    
    def test_embeddings_generation(self):
        """Test local and OpenAI fallback embeddings generate correct dimension."""
        client = EmbeddingClient()
        vec = client.get_embedding("Testing embeddings generation")
        self.assertEqual(len(vec), 1536)
        
        # Norm should be close to 1.0 (unit vector)
        sq_sum = sum(x * x for x in vec)
        self.assertAlmostEqual(sq_sum, 1.0, places=5)

    def test_local_vector_store_operations(self):
        """Test local vector index storage saving and retrieval query."""
        project_id = 9999
        store = LocalVectorStore(project_id=project_id)
        
        test_chunks = [
            {"text": "The quick brown fox jumps over the lazy dog", "source": "fox.txt", "page": 1},
            {"text": "Agentic healthcare diagnostics are autonomous systems", "source": "health.txt", "page": 2},
            {"text": "Report writing with automated references and citation indices", "source": "report.txt", "page": 1}
        ]
        
        store.add_chunks(test_chunks)
        
        # Test cosine search
        results = store.search("agentic medical algorithms", limit=1)
        self.assertTrue(len(results) > 0)
        top_chunk, score = results[0]
        self.assertEqual(top_chunk["source"], "health.txt")
        self.assertTrue(score > 0.0)

        # Test persistence
        test_dir = settings.DATA_DIR
        store.save(test_dir)
        
        # Re-load in a separate store
        new_store = LocalVectorStore(project_id=project_id)
        new_store.load(test_dir)
        self.assertEqual(len(new_store.chunks), 3)
        self.assertEqual(new_store.chunks[1]["source"], "health.txt")
        
        # Clean up files
        file_path = os.path.join(test_dir, f"vector_store_project_{project_id}.json")
        if os.path.exists(file_path):
            os.remove(file_path)

    def test_pdf_parsing_fallback(self):
        """Test that pdf parsing falls back correctly without raising unhandled errors."""
        # Test nonexistent file error raises correctly
        with self.assertRaises(FileNotFoundError):
            parse_pdf("nonexistent_paper_path.pdf")

if __name__ == "__main__":
    unittest.main()
