# AI StudyMate

AI StudyMate is an AI-powered study assistant built with React, Vite, Express, and a Gemini-based backend. Users can enter any topic, choose a difficulty level, and receive a structured learning package with:

- a quick explanation summary
- key concepts
- interactive flashcards
- a quiz with feedback
- AI learning modes such as ELI5, step-by-step, real-world examples, and a 4-week roadmap
- follow-up questions for deeper clarification

The app is designed around the requirement that the AI returns structured data, which the frontend parses and renders as interactive, stateful UI instead of showing raw chatbot text.

## Features

- Free-form topic input
- Difficulty selector: Beginner, Intermediate, Advanced
- Structured AI-generated study content
- Interactive flashcards
- Quiz engine with scoring and feedback
- AI learning modes
- Concept-detail exploration
- Follow-up questions with AI answers
- Loading, error, and empty-state handling

## Tech Stack

- Frontend: React, Vite, CSS
- Backend: Node.js, Express
- AI: Gemini API
- Other: Axios, React Markdown, KaTeX

## Project Structure

- client/: React frontend
- server/: Express backend and AI service

## Setup Instructions

### 1. Clone the project

```bash
git clone https://github.com/donepudiharshita/ai-studymate.git
cd ai-studymate
```

### 2. Install dependencies

#### Frontend

```bash
cd client
npm install
```

#### Backend

```bash
cd ../server
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `server` folder with your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
PORT=5000
```

### 4. Run the app

#### Backend

```bash
cd server
npm run dev
```

#### Frontend

```bash
cd client
npm run dev
```

The frontend will run on the Vite dev server, and the backend will run on port `5000`.

## AI Usage Note

This project uses a real LLM API (Gemini) to generate structured study content. The model response is parsed by the backend and frontend so that the app renders interactive components rather than a raw chat conversation.

## Known Limitations

- The app depends on a valid Gemini API key.
- AI responses can sometimes be inconsistent, so the app includes basic error handling and fallback messaging.
- The current implementation focuses on a strong core experience rather than advanced streaming or persistence features.

## Estimated Time Spent

Approximately 12–15 hours of development and refinement.

## Notes

This project was built as a frontend internship-style assignment focused on:

- React functional components and hooks
- structured AI output handling
- interactive UI rendering
- robust loading/error states
