FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=src/backend/app.py
ENV FLASK_ENV=production

# Run the application
CMD ["python", "src/backend/app.py"]
