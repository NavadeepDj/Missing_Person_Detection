FROM python:3.10-slim-bookworm

WORKDIR /app

# Install system dependencies
# libgl1 replaced libgl1-mesa-glx in newer Debian versions
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy models first (if they exist, this layer caches better)
COPY models/ ./models/

# Copy the rest of the application
COPY . .

EXPOSE 8000

# Using app.py as identified in file structure
CMD ["python", "app.py"]
