FROM python:3.14.6-slim

WORKDIR /app

# Keep pip aligned with your local environment
RUN python -m pip install --no-cache-dir --upgrade pip==26.2.1

# Install application dependencies
COPY requirements.txt .

RUN python -m pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Convert Windows CRLF -> Linux LF
# and make startup script executable
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

# Python runtime settings
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["./start.sh"]