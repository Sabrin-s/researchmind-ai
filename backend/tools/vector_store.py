import os
import json
from typing import List, Dict, Any, Tuple
from backend.tools.embeddings import EmbeddingClient

class LocalVectorStore:
    def __init__(self, project_id: int):
        self.project_id = project_id
        self.client = EmbeddingClient()
        self.chunks: List[Dict[str, Any]] = []
        self.embeddings: List[List[float]] = []

    def add_chunks(self, new_chunks: List[Dict[str, Any]]):
        """
        Calculates embeddings for new text chunks and adds them to the store.
        """
        for chunk in new_chunks:
            embedding = self.client.get_embedding(chunk["text"])
            self.chunks.append(chunk)
            self.embeddings.append(embedding)

    def search(self, query: str, limit: int = 5) -> List[Tuple[Dict[str, Any], float]]:
        """
        Computes cosine similarity between query embedding and all stored chunks.
        Returns top matching chunks with scores.
        """
        if not self.chunks:
            return []

        query_vec = self.client.get_embedding(query)
        scored_chunks = []

        for i, chunk in enumerate(self.chunks):
            chunk_vec = self.embeddings[i]
            # Compute cosine similarity (vectors are already normalized in embedding client)
            similarity = sum(q * c for q, c in zip(query_vec, chunk_vec))
            scored_chunks.append((chunk, similarity))

        # Sort by similarity score descending
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return scored_chunks[:limit]

    def save(self, data_dir: str):
        """
        Persists the vector index to a local JSON file.
        """
        file_path = os.path.join(data_dir, f"vector_store_project_{self.project_id}.json")
        data = {
            "chunks": self.chunks,
            "embeddings": self.embeddings
        }
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def load(self, data_dir: str):
        """
        Loads the vector index from a local JSON file if it exists.
        """
        file_path = os.path.join(data_dir, f"vector_store_project_{self.project_id}.json")
        if not os.path.exists(file_path):
            return
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.chunks = data.get("chunks", [])
                self.embeddings = data.get("embeddings", [])
        except Exception as e:
            print(f"Error loading vector store for project {self.project_id}: {e}")
