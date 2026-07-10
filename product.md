# AptiCode – Product Specification

AptiCode is a premium, AI-powered placement preparation platform designed for engineering students, placement officers, college administrators, and trainers. This document defines the comprehensive product requirements, module details, user workflows, gamification mechanisms, and administrative interfaces.

---

## 1. Brand Identity & Vision
AptiCode aims to bridge the gap between academic education and corporate readiness. Unlike traditional platforms that focus solely on coding, AptiCode offers a unified preparation ecosystem combining:
- **Technical Excellence** (Coding & Aptitude)
- **Soft Skills Mastery** (Speech, Reading, GD, HR interviews)
- **Professional Presentation** (AI Resume Optimization)
- **Deep Performance Analytics** & gamified learning paths.

### Unique Branding
- **Name**: AptiCode
- **Slogan**: "Accelerate Your Placement Readiness"
- **Identity**: Modern, technical, and high-performance. It borrows the rigorous problem-solving aesthetics of LeetCode, combined with the premium, guided learning structures of Udemy and LinkedIn Learning.

---

## 2. User Personas & Permissions

| Persona | Primary Goals | Key Platform Interaction |
| :--- | :--- | :--- |
| **Engineering Student** | Ace placement interviews, build resume, practice aptitude/coding, practice speaking skills, check progress. | Solves challenges, participates in mock interviews, builds resumes, tracks XP, views leaderboard. |
| **Placement Officer** | Monitor college-wide readiness, identify top talent, schedule tests, download performance reports. | Accesses cohort analytics, views individual mock reports, manages invite codes. |
| **College Admin** | Manage students, configure department access, generate performance reports for accreditation. | Manages student accounts, registers trainers, controls institutional configuration. |
| **Trainer / Tutor** | Author custom questions, assign test modules, review students' mock interview transcripts & feedback. | Uploads videos, creates custom coding/aptitude tests, views class metrics. |

---

## 3. Product Modules Breakdown

### 3.1 Authentication & Profile Management
A secure, scalable onboarding experience to ensure verified access.
* **Onboarding Flows**:
  * **Student Sign Up**: Captures Name, Email, Password, College name, Branch (e.g., CSE, ECE), Graduation Year, and Student ID.
  * **Email Verification**: Sends secure link via Nodemailer. Must be verified before profile activation.
  * **OTP verification**: Used for multi-factor logins (optional) and forgot password routines.
* **JWT & Refresh Tokens**: Tokens issued upon login. Access tokens (JWT) expire in 15 minutes. Refresh tokens are stored securely in HTTP-only, secure cookies with a 7-day expiration.
* **Profile Management**:
  * **Portfolio Showcase**: Upload avatar (hosted on Cloudinary), link GitHub, LinkedIn, and personal website.
  * **Placement Readiness Index (PRI)**: A dynamically computed score (0-1000) based on coding accuracy, aptitude speed, communication score, and interview ratings.

---

### 3.2 Dashboard & Progress Tracking
The personalized landing experience for students to maintain streaks and direct their learning.
* **Learning Path Advisor**: Suggests next steps based on weaker topics (e.g., if Time & Work speed is low, suggest that topic's videos/notes).
* **Metrics Widgets**:
  * **Daily Streak counter**: Number of consecutive days performing at least one XP-gaining activity.
  * **XP Bar & Levels**: Current level (Beginner to Placement Ready) and XP needed for next level.
  * **Daily Challenge Card**: Prominently displays the daily aptitude question and coding challenge.
* **Aggregated Stats**: Charts indicating Aptitude vs. Coding vs. Communication score distributions.

---

### 3.3 Aptitude Module
Structured learning path for quantitative aptitude, logical reasoning, and verbal ability.
* **Supported Topics**:
  * **Quantitative**: Number System, Percentage, Profit and Loss, Ratio, Time and Work, Time Speed Distance, Probability, Permutation & Combination, Data Interpretation.
  * **Logical Reasoning**: Syllogisms, Seating Arrangements, Blood Relations, Coding-Decoding.
  * **Verbal**: Sentence Correction, Synonyms & Antonyms, Reading Comprehension.
* **Feature Set**:
  * **YouTube Video Integration**: Dynamic lookup using YouTube Data API. Curated playlists mapping to specific aptitude topics.
  * **Notes**: Interactive, markdown-supported notes for shortcuts and formulas.
  * **Timed Tests**: Simulated tests containing a countdown timer. Questions categorized into Easy, Medium, and Hard.
  * **AI Explanation**: Clicking "Explain with AI" invokes Gemini/OpenAI to generate a step-by-step breakdown of how the correct answer is reached.
  * **Bookmarks**: Flag questions for future practice.

---

### 3.4 Coding Module
A complete compiler and coding ecosystem modeled on LeetCode/HackerRank.
* **Programming Languages**: Python (3.x), Java (JDK 17), C++ (GCC 17), JavaScript (Node.js 18).
* **Compiler Flow**:
  1. Student writes code in the Monaco Editor wrapper.
  2. Submits code → sent to Backend → queued and dispatched to Judge0 API.
  3. Returns status: `Accepted`, `Wrong Answer`, `Time Limit Exceeded`, `Runtime Error`, `Compile Error`.
* **Test Case System**:
  * **Custom Test Cases**: User provides custom input to test their code before submitting.
  * **Hidden Test Cases**: Locked test cases executed on submission to check edge conditions (e.g., null values, memory constraints).
* **Editorial & Discussions**: Tutors can write explanations. Students can view code structures and time complexity.
* **AI Code Explainer & Debugger**:
  * **Explain Code**: Generates code breakdown in Markdown.
  * **Debug Code**: Analyzes runtime errors or incorrect logic, suggesting fixes without giving away the exact solution directly (encourages learning).

---

### 3.5 Communication Module
Enhancing soft skills using speech synthesis, speech-to-text, and natural language analysis.
* **Mode of Operation**:
  * **Speaking Practice**: Student reads a prompt or answers an HR question. Web Speech API captures audio, converts it to text, and streams it to the backend.
  * **Reading Practice**: Pronunciation checking against a reference paragraph.
* **Analysis Metrics**:
  * **Words Per Minute (WPM)**: Total words spoken divided by time elapsed. Target: 110 - 150 WPM.
  * **Grammar Analysis**: Evaluates structural correctness, sentence fragments, and syntax errors.
  * **Fluency Score**: Determined by analyzing pause frequencies (hesitation tokens like "um", "ah", "like").
  * **Confidence Score**: Combination of continuous speaking volume variance and speaking pace consistency.
  * **AI Feedback**: Highlights filler words and suggests structural improvements.

---

### 3.6 AI Assistant (Virtual Coach)
A pervasive chat interface for students to receive personalized guidance.
* **Key Use Cases**:
  * **Weak Area Analysis**: Examines performance history, flags weak areas (e.g., "Probability is at 34% accuracy"), and designs a custom study plan.
  * **Study Plan Generator**: Takes student's preparation deadline (e.g., "Infosys interview in 2 weeks") and drafts a day-by-day practice routine.
  * **Interview Preparation**: Provides historical questions asked by specific companies (e.g., TCS, Amazon, Wipro).

---

### 3.7 AI Mock Interview
An immersive video/audio simulation of a real hiring interview.
* **Types of Interviews**: HR (Behavioral), Technical (CS Core Concepts), Coding, or Comprehensive (Mixed).
* **Workflow**:
  1. Student starts mock interview in the client dashboard.
  2. Frontend requests first question from Backend.
  3. Backend queries Gemini/OpenAI API with candidate profile & target job parameters.
  4. Prompt is synthesized locally to voice using Web Speech API synthesis.
  5. Student speaks their answer; Web Speech API processes text transcripts in real-time.
  6. Response is submitted to Backend, evaluated against standard scoring rubrics, and the next question is queued.
  7. When complete, a final assessment report is compiled.
* **Final Evaluation Report**:
  * **Score Cards**: Overall rating (out of 100), Technical depth, Soft skills, Coding correctness.
  * **Question-by-Question Feedback**: What they answered, what was missing, and a model answer.

---

### 3.8 Resume Builder
A secure, ATS-friendly resume generation tool.
* **Resume Engine**:
  * Rich multi-step forms capturing Education, Work Experience, Projects, Skills, and Certifications.
  * Selection of ATS-friendly templates (clean layout, single-column, standard fonts).
  * Render PDF client-side using `react-pdf` or backend-side using headless Chrome (Puppeteer).
* **AI Resume Auditor**:
  * Compares resume text against standard ATS parsers.
  * Offers specific skill suggestions based on target roles (e.g., if applying for Full Stack, suggest adding "Redis" or "Docker").
  * Corrects grammatical errors and rewrites passive sentences into active, impact-oriented statements.

---

## 4. Gamification & Engagement

To drive retention, AptiCode implements a comprehensive gamification loop.

### 4.1 XP Reward Matrix

| Activity | XP Awarded | Limit / Frequency |
| :--- | :--- | :--- |
| **Watch Topic Video** | +10 XP | Max 50 XP per day per topic |
| **Complete Topic Notes** | +5 XP | One-time per topic |
| **Solve Aptitude Practice Quiz** | +20 XP | Per quiz passed (Score > 70%) |
| **Coding Problem Accepted** | +30 XP | Per unique problem |
| **Complete Mock Interview** | +50 XP | Per full session evaluated |
| **Daily Challenge Completed** | +45 XP | Once daily |
| **Weekly Streak Kept (7 days)** | +100 XP | Weekly |

### 4.2 Achievement Levels

```
Level 1: Beginner            (0 - 999 XP)
Level 2: Intermediate        (1,000 - 2,499 XP)
Level 3: Advanced            (2,500 - 4,999 XP)
Level 4: Expert              (5,000 - 9,999 XP)
Level 5: Master              (10,000 - 19,999 XP)
Level 6: Placement Ready     (20,000+ XP)
```

### 4.3 Leaderboards
* **Scope**: Global, Department-wise, or College-wise.
* **Intervals**: Weekly (resets Sunday midnight) and All-Time.
* **Visual Rewards**: Top 3 display special digital profile badges (Gold, Silver, Bronze) on their public portfolios.

---

## 5. Analytics Engine
* **Student Analytics**:
  * **Activity Heatmap**: Standard contribution graph (similar to GitHub commits) mapping daily XP gains.
  * **Radar Chart**: Displays balance between Quantitative Aptitude, Coding Speed, Coding Quality, Communication Confidence, and Resume Rating.
  * **Error Logs**: Categories where students frequently fail test cases.
* **Placement & Admin Analytics**:
  * **Cohort Readiness**: Percentage of students in "Expert" or "Placement Ready" levels.
  * **Department Rankings**: Aggregated score comparison between departments (e.g., CSE vs IT).
  * **Placement Probability**: AI-driven forecast calculated using mock interview results and code submission success rates.

---

## 6. Admin & Placement Officer Dashboard
An enterprise dashboard giving administrators control over data ingestion and reporting.
* **Cohort Management**:
  * Bulk upload student databases via CSV/Excel.
  * Verify/Ban students, reset user passwords, customize user levels.
* **Content Management System (CMS)**:
  * **Aptitude editor**: Rich text markdown editor for adding questions, option inputs, step-by-step solutions, and AI hints.
  * **Coding editor**: Upload problem descriptions, define constraints (Time, Memory), add base boilerplates, test inputs, and compile validation solutions.
* **Report Generators**:
  * Export student metrics as Excel sheets.
  * Export certified Placement Readiness PDF profiles in bulk.
