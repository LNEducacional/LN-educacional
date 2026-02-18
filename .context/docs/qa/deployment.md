---
slug: deployment
category: operations
generatedAt: 2026-02-02T19:46:30.384Z
relevantFiles:
  - Dockerfile.client
  - Dockerfile.server
  - docker-compose.yaml
  - server/node_modules/@fastify/helmet/.github/workflows/ci.yml
---

# How do I deploy this project?

## Deployment

### Docker

This project includes Docker configuration.

```bash
docker build -t app .
docker run -p 3000:3000 app
```
