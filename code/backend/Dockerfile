FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# INSTALL_DEV=true ajoute les outils de dev (ngrok...) via requirements-dev.txt.
# Jamais activé par défaut : Render (production actuelle) n'utilise même pas ce
# Dockerfile (runtime: python + build.sh, voir render.yaml), mais si ce
# Dockerfile sert un jour de base de déploiement, il reste prod-safe sans
# argument explicite. docker-compose.yml (dev local) passe INSTALL_DEV=true.
ARG INSTALL_DEV=false

COPY requirements.txt requirements-dev.txt ./
RUN if [ "$INSTALL_DEV" = "true" ]; then \
        pip install --no-cache-dir -r requirements-dev.txt; \
    else \
        pip install --no-cache-dir -r requirements.txt; \
    fi

COPY . .
RUN chmod +x entrypoint.sh

EXPOSE 8000

# En local, docker-compose.yml surcharge cette commande par
# "python manage.py runserver" (voir CLAUDE.md). En production (Render),
# cet entrypoint applique les migrations, collecte les statiques puis
# lance gunicorn.
CMD ["./entrypoint.sh"]
