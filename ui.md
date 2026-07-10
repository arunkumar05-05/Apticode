# AptiCode – UI/UX Design System & Layout Specifications

This document defines the user interface guidelines, design tokens, premium design themes, responsive layouts, motion profiles, and detailed screen layouts for AptiCode.

---

## 1. Core Visual Principles
AptiCode uses a **Modern Premium Tech / EdTech** visual design:
* **Glassmorphism**: Soft background blurs (`backdrop-blur-md`), semi-transparent surfaces, and thin, high-contrast borders that mimic frosted glass layers resting on rich gradient meshes.
* **Elevated Depth**: Multiple overlaid panels using shadows (`shadow-2xl`) and gradient borders.
* **Micro-interactions**: Subtle state indicators, hover shifts, and fluid spring animations via Framer Motion.
* **Rounded Contours**: Generous border radiuses (`rounded-xl` / `rounded-2xl` / `rounded-3xl`) giving a modern, friendly yet professional feel.

---

## 2. Design Tokens & Themes

### 2.1 Dark Mode Palette (Primary Experience)
Designed for extended coding and practice sessions without eye strain.
* **Primary Background**: HSL `224° 25% 6%` (Deep Obsidian Blue-Black)
* **Secondary Canvas**: HSL `222° 20% 10%` (Rich Navy Charcoal)
* **Glass Panels**: HSL `222° 20% 12%` with `0.65` opacity
* **Primary Accent**: HSL `263° 90% 64%` (Neon Violet)
* **Secondary Accent**: HSL `188° 86% 53%` (Cyan Aura)
* **Success/Accepted**: HSL `142° 70% 45%` (Emerald)
* **Warning/Attention**: HSL `38° 92% 50%` (Amber Glow)
* **Danger/Error**: HSL `346° 84% 50%` (Crimson Rose)
* **Text (Primary)**: HSL `210° 40% 98%` (Ice White)
* **Text (Secondary)**: HSL `215° 20% 65%` (Cool Slate)

### 2.2 Light Mode Palette (Executive/Admin View)
A crisp, bright theme that retains a professional look.
* **Primary Background**: HSL `210° 20% 98%` (Soft Ice Gray)
* **Secondary Canvas**: HSL `0° 0% 100%` (Pure White)
* **Glass Panels**: HSL `0° 0% 100%` with `0.7` opacity
* **Primary Accent**: HSL `262° 80% 50%` (Royal Purple)
* **Secondary Accent**: HSL `195° 85% 41%` (Deep Cyan)
* **Text (Primary)**: HSL `222° 47% 11%` (Deep Slate Blue)
* **Text (Secondary)**: HSL `215° 16% 47%` (Charcoal Slate)

### 2.3 Typography & Spacing
* **Headings**: `Outfit` or `Inter`, sans-serif. Heavy weights (700, 800) with letter-spacing improvements.
* **Body Text**: `Inter`, sans-serif. Weights: 400 (Regular), 500 (Medium), 600 (Semi-Bold).
* **Code Editor**: `JetBrains Mono` or `Fira Code`. Fixed-width, ligature-supported.
* **Spacing Scale**: Base-8 grid system (`4px`, `8px`, `16px`, `24px`, `32px`, `48px`, `64px`).

---

## 3. Glassmorphic Surface Guidelines
To maintain consistency, any glass card or panel must adhere to the following Tailwind configuration rules:
```html
<!-- Example of a standard premium Glass Panel in Tailwind -->
<div class="bg-opacity-65 bg-slate-900 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-6 transition-all duration-300 hover:shadow-cyan-500/10 hover:border-slate-600/70">
  <!-- Content -->
</div>
```

---

## 4. Key Motion Profiles (Framer Motion)

### 4.1 Page Layout Transition
Every page entry should animate smoothly using a staggered fade-in and slide-up:
```typescript
export const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.3 } }
};
```

### 4.2 Interactive Button Hover
Interactive action cards and buttons should lift slightly and expand shadow glows:
```typescript
export const hoverInteraction = {
  whileHover: { y: -3, scale: 1.02, filter: "brightness(1.05)" },
  whileTap: { scale: 0.98 }
};
```

---

## 5. Screen-by-Screen Layout Specifications

### 5.1 Landing Page (Public)
* **Hero Section**: Huge bold typography ("AptiCode"), a background canvas running a subtle 3D node network or abstract floating code blocks. Neon gradients driving conversion buttons ("Start Preparing" and "Request a Demo").
* **Feature Grid**: Alternating interactive cards showcasing Aptitude (interactive speed gauges), Coding (Monaco editor snippet), and AI Interview (interactive voice waveform).
* **Trust & Credentials**: High-resolution logo banner of top recruiters (FAANG, Big Four, Tier-1 service providers) and university partners.

### 5.2 Student Dashboard (App Workspace)
* **Left Sidebar**: Collapsible navigation with icons (Dashboard, Aptitude, Coding, Communication, Interviews, Resume, Leaderboard, Settings).
* **Main Area**:
  * **Header**: User welcome, current Level badge ("Intermediate"), current XP value, and active daily streak indicator.
  * **Daily Challenge Card**: Split widget—left side shows an aptitude puzzle (e.g., "Ratio & Proportions"), right side displays a coding challenge (e.g., "Two Sum").
  * **Study Path Progress**: Interactive timeline tracker showing completed/in-progress milestone nodes.
  * **Performance Radar Chart**: Visual representation of the student's current skill profile.

### 5.3 Aptitude Workspace
* **Directory Grid**: Visual card selectors for categories (Quantitative, Logical, Verbal). Each card shows progress (e.g., "Time & Work: 8/12 complete").
* **Topic Detail Screen**:
  * **Tabbed Area**: Video Lecture (YouTube Player) | Detailed Notes (Markdown format) | Practice Quizzes.
  * **Practice Quiz Arena**: Large question display, multiple-choice radio selection, countdown timer bar, and a dominant "Explain with AI" button that triggers a sidebar overlay displaying step-by-step Gemini API-generated solutions.

### 5.4 Coding Playground
* **Split Pane Screen Layout (Three-Column IDE)**:
  * **Left Column**: Problem details, description, examples, constraints, company tags, and editorial.
  * **Middle Column**: Monaco Editor wrapper. Dropdowns for language selection (Java, Python, C++, JS), theme toggles, and code boilerplates.
  * **Right Column (Collapsible Console)**:
    * Tabs for "Custom Input" and "Test Results".
    * Large execution console displaying results, compiler logs, runtime metrics (Memory/Time limit outputs from Judge0).
    * "AI Debug" and "AI Explain Code" slide-out sidebars.

### 5.5 Communication Workspace
* **Dash Indicators**: Fluency speedometers, filler word counters, and pronunciation confidence meters.
* **Practice Hub**:
  * **Reading Mode**: Paragraph text displayed on card. Microphone button starts recording. Mapped words change color (Green = Correct, Yellow = Soft errors/Hesitations, Red = Mispronounced).
  * **Speech Waveform Panel**: Rich SVG canvas generating canvas visualizer during audio capture.
  * **AI Analysis Card**: Structured recommendations showing grammar reports and suggestions for vocabulary upgrades.

### 5.6 AI Mock Interview Suite
* **Active Interview View**:
  * **Minimalist Canvas**: Large AI character portrait (or professional human vector avatar) that acts as the interviewer.
  * **Camera & Sound Control indicators**.
  * **Question Dialog**: Text prompt spoken aloud using local Web Speech API synthesis.
  * **Response Status**: Live listening indicator ("Speak now...") showing a pulse ring that scales dynamically with audio input levels.
  * **Evaluation Report**: Dashboard displayed after completion featuring target scores, dynamic transcript reviews, and recommendation links.

### 5.7 ATS Resume Builder
* **Split Layout View**:
  * **Input Editor (Left Pane)**: Multi-step forms grouped by section (Profile, Education, Projects, Work, Skills). Add/Delete items instantly.
  * **Interactive Canvas (Right Pane)**: Fixed aspect-ratio live preview of the formatted PDF. Updates live as user inputs data.
  * **Review Panel (Right-Sidebar)**: List of AI-audited errors (e.g., "Action verbs missing", "Suggest adding: TypeScript").

### 5.8 Admin Control Panel
* **Student Grid**: Responsive table with sorting, filters by cohort, search filters by name/email, and bulk action checkboxes.
* **Problem Editor**: Ingestion panel with side-by-side editing: markdown definition on the left, live HTML rendering on the right. Form controls for inputting test case JSON files.
* **Analytics Center**: Global charts displaying platform retention, average time spent, cohort distributions, and export actions ("Export CSV", "Export PDF").
