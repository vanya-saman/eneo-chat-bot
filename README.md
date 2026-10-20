# ENEO Chatbot

A simple chat client for assistants hosted on ENEO.

- **`eneo-chatbot-frontend/`** – React + Vite chat UI
- **`eneo-chatbot-api-backend/`** – Express server that forwards requests to the ENEO API, so the API key stays off the browser

Users can chat with an assistant and attach up to 5 files (images, PDF, TXT, MD, CSV) per message.

The AI also provides a list of sources used in the response.

## Requirements

- Node.js 20.19+ or 22.12+
- An ENEO API key and an assistant ID

## Getting started

### Backend

```bash
cd eneo-chatbot-api-backend
npm install
```

Create a `.env` file:

```env
API_KEY=your-eneo-api-key
ENEO_API_BASE_URL=https://your-eneo-instance/api/v1
PORT=3001
```

Start it:

```bash
npm run dev
```

### Frontend

```bash
cd eneo-chatbot-frontend
npm install
npm run dev
```

Open:

```
http://localhost:5173/eneo-chat-bot/?assistant_id=<ASSISTANT_ID>&server=false
```

- `assistant_id` – which ENEO assistant to use (required)
- `server=false` – use the local backend on port 3001. Leave it out in production.

## Production

```bash
cd eneo-chatbot-frontend
npm run build
```

Serve `dist/` at `/eneo-chat-bot/` and forward `/eneo-chat-bot/api/` to the backend.

## Good to know

- Chat sessions are stored in memory and are lost when the backend restarts.
- File types and size limits are set in both `frontend/src/fileUpload.js` and `backend/src/routes/chat.js` – keep them in sync.