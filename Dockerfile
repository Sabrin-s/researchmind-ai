FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY data/ ./data/
COPY reports/ ./reports/

RUN mkdir -p data/uploads reports

ENV DEMO_MODE=true
ENV PORT=7860

EXPOSE 7860

CMD ["python", "-m", "uvicorn", "backend.api:app", "--host", "0.0.0.0", "--port", "7860"]
