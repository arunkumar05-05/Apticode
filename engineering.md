# AptiCode – Engineering & System Architecture Specifications

This document defines the codebase structures, engineering patterns, client-side state management, and third-party integration pipelines for AptiCode.

---

## 1. Directory Structure

AptiCode utilizes a monorepo setup or a clean split-workspace architecture. Below is the production-ready directory layout for both the Frontend (Next.js) and Backend (Express.js with Prisma).

```
apticode/
├── frontend/                     # Next.js App
│   ├── public/                   # Static assets (logos, illustrations)
│   ├── src/
│   │   ├── components/           # Reusable UI Elements (Atoms, Molecules, Organisms)
│   │   │   ├── ui/               # Base design components (Button, Input, Card, Modal)
│   │   │   ├── editor/           # Monaco Editor Wrapper Components
│   │   │   ├── speech/           # Audio/Waveform Visualization Components
│   │   │   └── dashboard/        # Charts & Statistics Panels
│   │   ├── context/              # React Context Providers
│   │   ├── hooks/                # Custom React Hooks (useSpeech, useAudio, useEditor)
│   │   ├── lib/                  # Library Initializers (axios, chartjs, socket-io)
│   │   ├── pages/                # Next.js routing (pages router or app router)
│   │   ├── services/             # API Client Integrations (backend endpoints mapping)
│   │   ├── store/                # Zustand State Stores (authStore, progressStore)
│   │   ├── styles/               # CSS Files (index.css with design tokens)
│   │   └── types/                # TypeScript Interfaces & Types
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                      # Node.js + Express Server
│   ├── prisma/
│   │   └── schema.prisma         # Prisma Schema Definition
│   ├── src/
│   │   ├── config/               # Database, Redis, Mailer, and API Keys config
│   │   ├── controllers/          # HTTP request handlers (parsing & routing data)
│   │   ├── middleware/           # Security, Auth, Rate-limiting, Validator middlewares
│   │   ├── routes/               # Express Routes mapping endpoints
│   │   ├── services/             # Core business logic (AI, Judge0, Speech analytics)
│   │   ├── utils/                # Helper libraries (tokens, crypt, logger)
│   │   └── app.ts                # Server initialization
│   ├── tsconfig.json
│   └── package.json
```

---

## 2. Design Patterns & Clean Architecture
AptiCode enforces separation of concerns:
* **Separation of Business Logic (Service Layer)**: Controller classes must never execute database queries directly. They delegate to Service classes, which process the business rules and interact with Prisma ORM.
* **Middleware-Driven Safety**: Authentication, permissions checking, input sanitization, and rate-limiting are decoupled into pipeline filters.
* **Component-Driven UI**: Frontend UI components are atomic. Style customizations are injected via `tailwind-merge` and `clsx` utilities, avoiding redundant styling code.

---

## 3. Client State Management

### 3.1 Global State (Zustand)
Zustand is used for ephemeral UI states, authentication status, and active practice sessions.
```typescript
// Example: Auth Store (src/store/authStore.ts)
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN' | 'OFFICER' | 'TRAINER';
  level: string;
  xp: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, token) => set({ user, accessToken: token }),
  clearAuth: () => set({ user: null, accessToken: null }),
}));
```

### 3.2 Server State (TanStack Query)
TanStack Query is used to fetch, cache, and synchronize all server-side records (questions, tests, submissions, profiles).
* **Caching**: Cached data expires in 5 minutes unless invalidated explicitly (e.g., invalidating `['leaderboard']` after submitting quiz results).
* **Mutations**: Auto-refresh listings immediately on successful form posts using query invalidations.

---

## 4. Compiler Integration (Judge0)

### Code Execution Workflow
1. Client submits code via `/api/coding/submissions`.
2. Backend receives request, saves record with `PENDING` state, and dispatches compiler job to Judge0 API.
3. Because compiler tasks can take several seconds, the backend uses **Webhook notifications** from Judge0 or falls back to an **active polling queue** on the server.
4. Once completed, Judge0 hits the backend webhook `/api/coding/callback`.
5. Backend updates DB status and sends a real-time message via WebSockets (Socket.io) to the client, or responds to the client's HTTP polling request.

```typescript
// Sample Backend Dispatcher to Judge0
export async function submitToJudge0(code: string, languageId: number, stdin: string, expectedOutput: string) {
  const payload = {
    source_code: Buffer.from(code).toString('base64'),
    language_id: languageId,
    stdin: Buffer.from(stdin).toString('base64'),
    expected_output: Buffer.from(expectedOutput).toString('base64'),
    callback_url: process.env.JUDGE0_CALLBACK_URL
  };
  
  const response = await fetch(`${process.env.JUDGE0_API_URL}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': process.env.JUDGE0_API_TOKEN || ''
    },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  return data.token; // Submission token from Judge0
}
```

---

## 5. Speech Recognition Integration (Web Speech API)

To enable communication practice and mock interviews, the frontend wraps the browser's native `webkitSpeechRecognition` API.

### Custom hook: `useSpeechRecognition`
```typescript
import { useEffect, useState, useRef } from 'react';

export function useSpeechRecognition(onResultCallback: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }
    
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResultCallback(finalTranscript);
      }
    };

    rec.onerror = (e: any) => console.error("Speech Recognition Error:", e);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
  }, [onResultCallback]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, startListening, stopListening };
}
```

---

## 6. AI Gateway Integration (Gemini / OpenAI)

* **Proxy Layer**: Frontend never contacts OpenAI or Gemini directly. All requests pass through Express.js backend services to protect api keys.
* **Rate Limiting**: AI endpoints are limited to 5 requests/minute per student using Redis to prevent cost overrun.
* **Fallbacks**: If Gemini API returns status `503 Service Unavailable`, the gateway automatically redirects the request to OpenAI's completion endpoint as a failover.
