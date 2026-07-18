import os
import math
from typing import List
import requests
from backend.config import settings

class EmbeddingClient:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.demo_mode = settings.DEMO_MODE or not self.api_key
        self.vector_dim = 1536  # Default dimension matching OpenAI text-embedding-3-small

    def get_embedding(self, text: str) -> List[float]:
        """
        Gets a vector representation for the given text.
        If API key is present and DEMO_MODE is False, queries OpenAI.
        Otherwise, builds a mock/deterministic hash vector of dimension 1536.
        """
        if not self.demo_mode and self.api_key:
            try:
                url = "https://api.openai.com/v1/embeddings"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                payload = {
                    "input": text,
                    "model": "text-embedding-3-small"
                }
                response = requests.post(url, json=payload, headers=headers, timeout=10)
                if response.status_code == 200:
                    return response.json()["data"][0]["embedding"]
            except Exception as e:
                print(f"OpenAI embedding retrieval failed: {e}. Falling back to hash embedding.")

        # Deterministic, normalized local vectorizer (pseudo-TF-IDF / hash mapping)
        # Allows full cosine-similarity retrieval without requiring any dependencies or internet.
        return self._generate_local_embedding(text)

    def _generate_local_embedding(self, text: str) -> List[float]:
        """
        Generates a deterministic 1536-dimension float vector from text.
        Splits by word, hashes words to vector dimensions, accumulates weights, and normalizes.
        """
        vector = [0.0] * self.vector_dim
        words = text.lower().split()
        if not words:
            # Return unit vector
            vector[0] = 1.0
            return vector

        # Accumulate hash positions
        for i, word in enumerate(words):
            # Deterministic hash function (fnv-1a style or simple custom python hash)
            h = 2166136261
            for char in word:
                h = (h ^ ord(char)) * 16777619
                h &= 0xFFFFFFFF
            
            # Map hash to index
            index = h % self.vector_dim
            # Apply term weight (frequency + position-based importance)
            vector[index] += 1.0 / (math.log(i + 2))

        # Normalize the vector (L2 norm)
        squared_sum = sum(x * x for x in vector)
        norm = math.sqrt(squared_sum)
        if norm > 0:
            vector = [x / norm for x in vector]
        else:
            vector[0] = 1.0
            
        return vector

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        return [self.get_embedding(t) for t in texts]
