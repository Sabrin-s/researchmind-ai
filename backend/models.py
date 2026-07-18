from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(512), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="pending")  # pending, researching, writing, completed, failed
    citation_style = Column(String(20), default="IEEE")  # IEEE, APA, MLA
    demo_mode = Column(Boolean, default=True)

    sources = relationship("Source", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
    logs = relationship("TaskLog", back_populates="project", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="project", cascade="all, delete-orphan")


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    title = Column(String(512), nullable=True)
    url = Column(String(2048), nullable=True)
    content = Column(Text, nullable=True)
    source_type = Column(String(50))  # web, pdf
    confidence = Column(String(20), default="Medium")  # High, Medium, Low
    added_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="sources")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    title = Column(String(512), nullable=False)
    abstract = Column(Text, nullable=True)
    content = Column(Text, nullable=False)  # Markdown text
    pdf_path = Column(String(1024), nullable=True)
    docx_path = Column(String(1024), nullable=True)
    timeline_data = Column(Text, nullable=True)  # JSON string of timeline
    gaps_data = Column(Text, nullable=True)      # JSON string of research gaps
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="reports")


class TaskLog(Base):
    __tablename__ = "task_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    agent_name = Column(String(100), nullable=False)  # Planner, Web Research, PDF Reader, etc.
    step_name = Column(String(256), nullable=False)
    log_message = Column(Text, nullable=True)
    status = Column(String(50), default="info")  # info, running, completed, error
    timestamp = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="logs")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    sender = Column(String(50))  # user, assistant
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="messages")
