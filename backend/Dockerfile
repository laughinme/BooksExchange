FROM python:3.13.5-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


COPY src ./src 
COPY entry.sh .

ENV PYTHONPATH=/app/src

RUN chmod +x entry.sh

EXPOSE 8080

ENTRYPOINT ["./entry.sh"]
