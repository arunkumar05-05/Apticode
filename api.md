# AptiCode – REST API Specifications

This document defines the interface contracts, endpoints, request/response models, input validations, and error handling codes for AptiCode.

---

## 1. Global Standard Schemas

### 1.1 Success Response Wrapper
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-07-09T12:00:00Z"
}
```

### 1.2 Error Response Wrapper
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable explanation.",
    "details": []
  },
  "timestamp": "2026-07-09T12:00:00Z"
}
```

### 1.3 Global Error Codes

| Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `BAD_REQUEST` | 400 | The request parameters or body are malformed. |
| `UNAUTHORIZED` | 401 | Invalid, expired, or missing JWT token. |
| `FORBIDDEN` | 403 | User does not have permission to access the resource. |
| `NOT_FOUND` | 404 | The requested entity could not be found. |
| `UNPROCESSABLE_ENTITY` | 422 | Input validation failed. |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests sent from client. |
| `INTERNAL_SERVER_ERROR` | 500 | An unexpected backend server crash or db failure. |

---

## 2. API Endpoints Reference

### 2.1 Authentication Module

#### `POST /api/auth/register`
Creates a student or admin profile.
* **Request Body**:
  ```json
  {
    "email": "student@college.edu",
    "password": "Password123!",
    "fullName": "Rahul Sharma",
    "college": "IIT Delhi",
    "branch": "Computer Science",
    "graduationYear": 2027
  }
  ```
* **Validations**:
  * `email`: Must be a valid email format, unique.
  * `password`: Minimum 8 characters, at least 1 uppercase letter, 1 lowercase, 1 number, 1 special character.
  * `graduationYear`: Must be >= current year - 5.
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Registration successful. Please verify your email.",
      "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    }
  }
  ```

#### `POST /api/auth/login`
Authenticates a user and sets cookies.
* **Request Body**:
  ```json
  {
    "email": "student@college.edu",
    "password": "Password123!"
  }
  ```
* **Success Response (200 OK)**:
  * *Note: Refresh token is set inside HTTP-only, secure cookie `refresh_token`.*
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "email": "student@college.edu",
        "role": "STUDENT",
        "level": 1,
        "xp": 0
      }
    }
  }
  ```

#### `POST /api/auth/refresh`
Uses the refresh cookie to sign a new Access Token.
* **Request Cookies**: `refresh_token=<token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

### 2.2 Aptitude Module

#### `GET /api/aptitude/topics`
Fetches list of topics filtered by category.
* **Query Parameters**:
  * `category`: String (optional). Options: `QUANTITATIVE`, `LOGICAL`, `VERBAL`.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "e4a2d81c-d922-491c-8e4d-7bcfa3d66141",
        "name": "Time and Work",
        "category": "QUANTITATIVE",
        "completed": true
      }
    ]
  }
  ```

#### `GET /api/aptitude/topics/:id`
Fetch complete topic resources.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "e4a2d81c-d922-491c-8e4d-7bcfa3d66141",
      "name": "Time and Work",
      "notes": "### Formulas...",
      "videos": [
        {
          "title": "Time and Work Shortcut Tricks",
          "url": "https://youtube.com/watch?v=xyz",
          "youtubeVideoId": "xyz"
        }
      ],
      "questionsCount": 20
    }
  }
  ```

#### `POST /api/aptitude/explain`
Generates step-by-step AI explanation for a question.
* **Request Body**:
  ```json
  {
    "questionId": "f7d7f722-1d54-47b1-bc29-4fb0288dc3b9"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "explanationMarkdown": "1. Understand the parameters...\n2. Calculate work rates: A = 1/10, B = 1/15...\n3. Combined rate = 1/10 + 1/15 = 1/6..."
    }
  }
  ```

---

### 2.3 Coding Module

#### `GET /api/coding/problems`
Fetches problem definitions.
* **Query Parameters**:
  * `difficulty`: Easy, Medium, Hard (optional)
  * `tag`: String (optional)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "d04a60cf-1d88-468e-9ea1-f8e1fae91122",
        "title": "Two Sum",
        "difficulty": "EASY",
        "solvedStatus": "UNSOLVED"
      }
    ]
  }
  ```

#### `POST /api/coding/submit`
Submits code for evaluation.
* **Request Body**:
  ```json
  {
    "problemId": "d04a60cf-1d88-468e-9ea1-f8e1fae91122",
    "language": "python",
    "code": "def twoSum(nums, target):..."
  }
  ```
* **Success Response (202 Accepted)**:
  ```json
  {
    "success": true,
    "data": {
      "submissionId": "f1f2e3d4-b5b6-4c7c-8c9d-0e1f2a3b4c5d",
      "status": "PENDING"
    }
  }
  ```

#### `GET /api/coding/submissions/:id`
Retrieves submission output details.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "f1f2e3d4-b5b6-4c7c-8c9d-0e1f2a3b4c5d",
      "status": "ACCEPTED",
      "executionTimeMs": 42,
      "executionMemoryKb": 1240,
      "compilerMessage": "All test cases passed."
    }
  }
  ```

---

### 2.4 Communication Module

#### `POST /api/communication/evaluate`
Evaluates audio/text transcript submissions.
* **Request Body**:
  ```json
  {
    "type": "SPEAKING",
    "promptText": "Describe a time you overcame a technical challenge.",
    "transcriptText": "Basically, I was building this web application and, like, I ran into a bug...",
    "durationSeconds": 45
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "wordsPerMinute": 115,
      "grammarScore": 88.5,
      "fluencyScore": 75.0,
      "confidenceScore": 82.0,
      "fillerWordsCount": 4,
      "feedback": "Try to minimize filler words like 'basically' and 'like'."
    }
  }
  ```

---

### 2.5 AI Mock Interview Module

#### `POST /api/interviews/start`
Starts a session.
* **Request Body**:
  ```json
  {
    "type": "TECHNICAL",
    "targetCompany": "Google"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "interviewId": "c4d3e2b1-5a4a-4d2a-8c1c-99bbccddeeff",
      "firstQuestion": "Can you explain how a hash map handles collisions?"
    }
  }
  ```

#### `POST /api/interviews/:id/respond`
Submits student's response, receives next question or triggers completion.
* **Request Body**:
  ```json
  {
    "answerText": "A hash map handles collisions using separate chaining with linked lists or open addressing..."
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "isCompleted": false,
      "nextQuestion": "Great. What is the time complexity of lookup in both worst and average cases?"
    }
  }
  ```

#### `GET /api/interviews/:id/report`
Retrieves report card.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "overallScore": 82.0,
      "feedback": "Strong conceptual understanding, but work on speaking pace.",
      "details": [
        {
          "question": "Can you explain how a hash map handles collisions?",
          "answer": "...",
          "feedback": "Correct explanation of chaining. Missing mention of tree rebalancing in Java 8."
        }
      ]
    }
  }
  ```

---

### 2.6 Resume Builder Module

#### `POST /api/resumes/review`
Submits resume schema for AI-powered optimization checks.
* **Request Body**:
  ```json
  {
    "contentJson": {
      "personal": { "name": "Rahul Sharma" },
      "experience": [],
      "skills": ["JavaScript", "React"]
    }
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "atsScore": 68,
      "grammarSuggestions": [],
      "skillsSuggestions": ["TypeScript", "Redis", "Docker"],
      "feedbackReport": "Your resume needs more quantifiable achievements."
    }
  }
  ```

---

### 2.7 Leaderboard API

#### `GET /api/leaderboard`
Fetches rank standings.
* **Query Parameters**:
  * `scope`: `GLOBAL` or `COLLEGE`
  * `limit`: Number (default 50)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "rank": 1,
        "fullName": "Rahul Sharma",
        "weeklyScore": 480,
        "totalScore": 25000,
        "level": 6
      }
    ]
  }
  ```

---

### 2.8 Admin API (Content Ingestion)

#### `POST /api/admin/coding-problems`
Creates a coding challenge.
* **Authorization**: JWT (Must have Role = `ADMIN` or `TRAINER`)
* **Request Body**:
  ```json
  {
    "title": "Reverse Linked List",
    "description": "Reverse a singly linked list...",
    "timeLimitMs": 1000,
    "memoryLimitKb": 262144,
    "difficulty": "EASY",
    "testCases": [
      { "input": "[1,2,3]", "output": "[3,2,1]", "isHidden": false },
      { "input": "[]", "output": "[]", "isHidden": true }
    ]
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "problemId": "5a4d3c2b-1a2b-3c4d-5e6f-7a8b9c0d1e2f"
    }
  }
  ```
