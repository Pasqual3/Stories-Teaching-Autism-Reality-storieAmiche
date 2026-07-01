FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=5001
WORKDIR /app
RUN mkdir -p /app/audio_output
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt
COPY app.py ./
COPY keys.jso[n] ./
EXPOSE 5001
CMD ["python", "app.py"]
