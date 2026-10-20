## Eneo Chatbot

This program allows you to chat with an ENEO assistant without an account.

It consists of a frontend which is a ReactJS project, and a backend which is a Node server.
To function, the server needs a .env that supplies the following:

```
ENEO_API_BASE_URL:  URL to the ENEO API
API_KEY:            Your API key
PORT:               The port to run the backend.
```
## Features

You can, send text, images, text and PDF documents to the chatbot.

You can pick an assistant of your choice (assuming the API key supports it) through the URL

example:

**CHATBOT_URL**/?assistant_id=**ASSISTANT_ID**

