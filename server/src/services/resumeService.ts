import { db } from '../prisma/db';

const RESUME_AUDIT_SYSTEM_INSTRUCTION = `You are the AptiCode ATS Resume Auditor.
Your job is to analyze the candidate's resume content, technical experience, and skills matrix.
Calculate a precise ATS score matching tier-1 requirements, and provide audit feedback warnings.
You MUST respond with a JSON object containing precisely the following keys:
{
  "atsScore": number (0 to 100),
  "auditFeedback": ["array of feedback comments recommending active voice, target stack keywords, and metrics additions"]
}
Do NOT wrap the JSON response in any markdown formatting or extra text. Return ONLY the raw JSON string.`;

export async function getUserResume(userId: string) {
  const versions = await db.resume.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  if (versions.length === 0) {
    return {
      activeVersion: {
        personal: {
          name: '',
          email: '',
          phone: '',
          github: '',
          linkedin: ''
        },
        skills: '',
        projectText: '',
        atsScore: 60,
        auditFeedback: [
          'Please enter your resume details to begin ATS parsing.'
        ]
      },
      versions: []
    };
  }

  const active = versions[0];
  let content = {
    personal: { name: '', email: '', phone: '', github: '', linkedin: '' },
    skills: '',
    projectText: '',
    atsScore: active.atsScore,
    auditFeedback: []
  };
  try {
    content = JSON.parse(active.contentJson);
  } catch (e) {
    // parse fallback
  }

  return {
    activeVersion: {
      id: active.id,
      versionName: active.versionName,
      ...content,
      atsScore: active.atsScore
    },
    versions: versions.map((v: any) => ({
      id: v.id,
      versionName: v.versionName,
      atsScore: v.atsScore,
      createdAt: v.createdAt
    }))
  };
}

export async function saveUserResume(userId: string, data: any) {
  const { versionName, personal, skills, projectText, atsScore, auditFeedback } = data;

  const contentJson = JSON.stringify({
    personal,
    skills,
    projectText,
    auditFeedback: auditFeedback || []
  });

  const active = await db.resume.findFirst({
    where: { userId, versionName: versionName || 'Default Version' }
  });

  let resume;
  if (active) {
    resume = await db.resume.update({
      where: { id: active.id },
      data: {
        contentJson,
        atsScore: Number(atsScore || 60)
      }
    });
  } else {
    resume = await db.resume.create({
      data: {
        userId,
        versionName: versionName || 'Default Version',
        contentJson,
        atsScore: Number(atsScore || 60)
      }
    });
  }

  return resume;
}

export async function auditResume(userId: string, data: any) {
  const { personal, skills, projectText } = data;

  let atsScore = 65;
  let auditFeedback = [
    "ATS Score is low (65/100). Minimum tier-1 target is 75.",
    "Project description uses passive phrasing. Change 'Built an AI engine' to 'Architected a real-time AI placement pipeline.'",
    "Missing target backend stack skills: 'Redis', 'Docker', 'Prisma ORM'."
  ];

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your_key') {
    try {
      const userPrompt = `Name: ${personal.name}\nSkills: ${skills}\nProjects: ${projectText}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${RESUME_AUDIT_SYSTEM_INSTRUCTION}\n\nCandidate resume:\n${userPrompt}` }] }],
          generationConfig: { temperature: 0.2 }
        })
      });
      if (response.ok) {
        const resJson: any = await response.json();
        const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
        let cleaned = rawText.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
        if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);

        const evaluation = JSON.parse(cleaned.trim());
        atsScore = evaluation.atsScore || 65;
        if (Array.isArray(evaluation.auditFeedback)) {
          auditFeedback = evaluation.auditFeedback;
        }
      }
    } catch (err: any) {
      console.error('[Gemini Resume Audit] error:', err.message);
    }
  }

  const latest = await db.resume.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  if (latest) {
    let content = {};
    try {
      content = JSON.parse(latest.contentJson);
    } catch (e) {}

    await db.resume.update({
      where: { id: latest.id },
      data: {
        atsScore,
        contentJson: JSON.stringify({
          ...content,
          auditFeedback
        })
      }
    });
  }

  return {
    atsScore,
    auditFeedback
  };
}
