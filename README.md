# HireGenius — AI-Powered HR Platform

HireGenius is an intelligent HR candidate management platform that automates CV ingestion from Google Drive, evaluates candidates against open vacancies using Claude AI, and streamlines the entire hiring pipeline from first contact to offer.

---

## Key Features

- **Automated CV Ingestion** — Monitors configured Google Drive folders and syncs new CVs on a schedule.
- **AI-Powered Evaluation** — Uses Anthropic Claude to parse CVs and score candidates against vacancy requirements, values alignment, experience relevance, and stability.
- **Candidate Pipeline** — Tracks every candidate through statuses: `en_proceso`, `contratado`, `no_apto`, `en_espera`, `descartado`.
- **Contact Management** — Logs outreach via email, WhatsApp, or phone with configurable message templates.
- **Interview Feedback** — Structured post-interview ratings with hire/reject recommendations.
- **Google Calendar Integration** — Proposes and schedules interview meetings directly from the platform.
- **AWS S3 Storage** — Stores parsed CV files securely with presigned download URLs.
- **REST API** — ASP.NET Core backend with full Swagger/OpenAPI documentation.
- **Angular Frontend** — Modern Angular 17 dashboard with reactive UI.

---

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Backend     | .NET 8, C#, ASP.NET Core Web API        |
| Database    | MySQL 8.0                               |
| AI          | Anthropic Claude (claude-opus-4-6)      |
| Storage     | AWS S3                                  |
| Auth / Drive| Google OAuth2, Google Drive API         |
| Calendar    | Google Calendar API                     |
| Frontend    | Angular 17, TypeScript                  |
| Container   | Docker, Docker Compose                  |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+
- A **Google Cloud** project with the following APIs enabled:
  - Google Drive API
  - Google Calendar API
  - OAuth2 credentials (Web application type)
- An **Anthropic** API key — [console.anthropic.com](https://console.anthropic.com)
- An **AWS** account with an S3 bucket and an IAM user that has `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` permissions on that bucket

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-org/hire-genius.git
cd hire-genius
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in all required values. At minimum you need:
- `ANTHROPIC_API_KEY`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `S3_BUCKET_NAME`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### 3. Set up Google Cloud project

Follow the [Google Drive Setup](#google-drive-setup) section below to obtain OAuth2 credentials and enable the required APIs.

### 4. Build and start all services

```bash
docker-compose up --build
```

This starts: MySQL, the ASP.NET Core backend, and the Angular frontend (served via Nginx).

### 5. Access the platform

| Service      | URL                                   |
|--------------|---------------------------------------|
| Frontend App | http://localhost:4200                 |
| API Docs     | http://localhost:5000/swagger         |
| Backend API  | http://localhost:5000/api             |

---

## Google Drive Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Navigate to **APIs & Services > Library** and enable:
   - **Google Drive API**
   - **Google Calendar API**
3. Go to **APIs & Services > Credentials** and create an **OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:5000/api/gdrive/auth-callback`
4. Download the client credentials and copy the **Client ID** and **Client Secret** into your `.env` file.
5. In the HireGenius frontend, navigate to **Settings > Google Drive** and click **Connect Google Account** to authorize access.
6. Add one or more Google Drive folders to monitor. The background service will sync them periodically.

---

## API Documentation

The ASP.NET Core backend auto-generates interactive API documentation via Swagger UI:

- **Swagger UI** — http://localhost:5000/swagger

### Main API Groups

| Prefix             | Description                              |
|--------------------|------------------------------------------|
| `/api/candidates`  | Candidate CRUD and search                |
| `/api/vacancies`   | Vacancy management                       |
| `/api/evaluations` | AI evaluation trigger and results        |
| `/api/contacts`    | Contact log entries                      |
| `/api/feedback`    | Interview feedback                       |
| `/api/status`      | Candidate pipeline status updates        |
| `/api/gdrive`      | Google Drive OAuth and folder management |
| `/api/dashboard`   | Aggregated metrics and stats             |

---

## Architecture

```
+------------------------------------------------------------------+
|                        Docker Compose                            |
|                                                                  |
|  +----------------+        +--------------------------------+    |
|  |   Frontend     |        |          Backend               |    |
|  |  Angular 17    +<-------> ASP.NET Core Web API (.NET 8)  |    |
|  |  Nginx :4200   |  HTTP  |          :5000                 |    |
|  +----------------+        +----------+---------------------+    |
|                                       |                          |
|                            +----------+                          |
|                            v                                     |
|                     +-----------+                                |
|                     |  MySQL    |                                |
|                     |  8.0      |                                |
|                     |  :3306    |                                |
|                     +-----------+                                |
|                                                                  |
+-----------------------------+------------------------------------+
                              | External Services
             +----------------+--------------+
             v                v              v
      +------------+   +---------+   +---------+
      |  Google    |   |   AWS   |   |Anthropic|
      |  Drive /   |   |   S3    |   | Claude  |
      |  Calendar  |   |         |   |   AI    |
      +------------+   +---------+   +---------+
```

---

## Development Tips

- **View logs for a specific service:**
  ```bash
  docker-compose logs -f backend
  docker-compose logs -f frontend
  ```

- **Restart only the backend:**
  ```bash
  docker-compose restart backend
  ```

- **Reset the database (destructive):**
  ```bash
  docker-compose down -v
  docker-compose up --build
  ```

- **Access the MySQL shell:**
  ```bash
  docker exec -it hire_genius_mysql mysql -u hgenius -phgenius_pass hire_genius
  ```

- **Open a shell in the backend container:**
  ```bash
  docker exec -it hire_genius_backend bash
  ```

---

## License

MIT
