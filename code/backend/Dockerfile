FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x entrypoint.sh

EXPOSE 8000

# En local, docker-compose.yml surcharge cette commande par
# "python manage.py runserver" (voir CLAUDE.md). En production (Render),
# cet entrypoint applique les migrations, collecte les statiques puis
# lance gunicorn.
CMD ["./entrypoint.sh"]
