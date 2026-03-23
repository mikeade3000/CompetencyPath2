// ─────────────────────────────────────────────────────────────────────────────
// CompetencyPath – Server
// ─────────────────────────────────────────────────────────────────────────────
require('dotenv').config();

const express  = require('express');
const path     = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Anthropic client ──────────────────────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Serve frontend ────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    model: 'claude-sonnet-4-20250514',
  });
});

// ── Main AI generation endpoint ───────────────────────────────────────────────
app.post('/api/generate-course-design', async (req, res) => {
  const { combinedInput } = req.body;

  if (!combinedInput || !combinedInput.trim()) {
    return res.status(400).json({ error: 'No course write-up input provided.' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not configured. Add it to your .env file.',
    });
  }

  try {
    const systemPrompt = `You are an expert instructional designer specialising in competency-based education (CBE).
Your task is to analyse a course write-up and produce a rigorous, evidence-informed 9-step competency-based course design.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown fences, no preamble, no trailing text.
2. Every field must contain substantive, specific content — never generic placeholders.
3. SMART objectives must be written as observable, measurable action statements, not as activity descriptions.
4. Measurable criteria must reference performance indicators (scores, demonstrations, rubric levels), NOT homework or attendance.
5. Achievable criteria must reference learner capability (prior knowledge, support, cognitive load), NOT resources.
6. Assessment-to-competency alignment must be explicit and traceable.
7. Mastery threshold justification must cite educational standards, institutional policy, or domain risk level.
8. Flexible paths must describe WITHIN-COURSE branching, not post-course options.
9. RPL provision must describe a concrete challenge exam or prior-learning recognition process.
10. Success metrics must include a baseline value AND a target value.`;

    const userPrompt = `Analyse the following course write-up and return a JSON object with this exact structure:

---COURSE WRITE-UP---
${combinedInput}
---END WRITE-UP---

Return this exact JSON structure (all fields required):
{
  "unitName": "Full course/unit title",
  "unitDescription": "2–3 sentence description: what the course covers, who it is for, and why it matters.",

  "step1": {
    "currentState": "Detailed description of learners' current knowledge, skills and competency level on entry.",
    "desiredState": "Specific competency state learners should reach by course completion.",
    "gaps": "Clearly identified gaps between current and desired states, with specific knowledge or skill deficits named.",
    "priority": "Critical"
  },

  "step2": {
    "competencies": ["Competency 1 – specific action-oriented statement", "Competency 2", "Competency 3"],
    "knowledgeAreas": "Declarative knowledge (concepts, theories, facts) AND procedural knowledge (how-to, processes, methods) required.",
    "skills": ["Skill 1 – observable behaviour", "Skill 2", "Skill 3"],
    "mappingNotes": "Explicit notes on how each knowledge area maps to a competency and how skills operationalise that competency."
  },

  "step3": {
    "specific": "Precise statement of what learners will be able to DO upon completion — observable, action-based, bounded.",
    "measurable": "Performance indicators only (NOT activities). E.g. 'Score ≥75% on the module assessment', 'Correctly classify 8 of 10 case studies', 'Demonstrate X skill in a live practical with no prompting'.",
    "achievable": "Why these objectives are within learners' capability: reference prior knowledge, available scaffolding, cognitive load, and course duration — NOT resources or tools.",
    "relevant": "Why these objectives matter to learners' professional roles, career progression, or real-world practice.",
    "timeBound": "Specific deadline, e.g. 'By the end of Week 4' or 'Within the 6-week course'.",
    "completeObjectives": "3–5 complete SMART objectives as action statements (one per line). Format: 'By [deadline], learners will be able to [action verb] [specific outcome] as demonstrated by [evidence/measure].'"
  },

  "step4": {
    "contentOverview": "Logical sequence and rationale for all topics — explain the pedagogical flow.",
    "topicPlans": [
      {"topic": "Topic 1 name", "keyContent": "Key concepts, theories, procedures covered", "notionalHours": "2", "engagementActivity": "Specific activity type and brief description"},
      {"topic": "Topic 2 name", "keyContent": "Key concepts", "notionalHours": "3", "engagementActivity": "Activity description"}
    ],
    "contentRationale": "Evidence-based justification for sequencing and notional hour allocation — reference Bloom's taxonomy levels, cognitive load theory, or prerequisite logic."
  },

  "step5": {
    "formative": "Specific formative assessments with frequency and purpose (linked to competencies).",
    "summative": "Specific summative assessments with weightings and competencies assessed.",
    "rubric": "Detailed rubric with 4 performance levels (Excellent / Proficient / Developing / Beginning) for each criterion. Include criterion name, and descriptor for each level.",
    "evidenceType": ["Portfolio", "Written Exam", "Practical Demonstration"],
    "passingCriteria": "e.g. 75% overall, with no criterion below Developing level",
    "competencyAlignment": "Explicit competency-to-assessment alignment matrix. Format each line as: [Assessment name] → [Competency number and name it measures].",
    "masteryJustification": "Evidence-based justification for the chosen mastery threshold. Reference: institutional policy, industry minimum standards, domain risk level (e.g. health/safety context), or published educational research."
  },

  "step6": {
    "modality": "Blended / Hybrid",
    "tools": ["Tool 1", "Tool 2", "Tool 3"],
    "contentFormats": ["Video Lectures", "Reading Materials", "Case Studies"],
    "accessibilityNotes": "Specific accessibility provisions: captioning, screen-reader compatibility, alternative formats, bandwidth considerations."
  },

  "step7": {
    "activities": "Specific, named learning activities with clear learning purpose and link to competencies.",
    "collaboration": "Specific collaborative tasks, group sizes, roles, and how collaboration builds competency.",
    "gamification": "Specific gamification mechanics (badges for competency milestones, leaderboards, progress unlocks) with educational rationale.",
    "realWorld": "Specific real-world scenarios, industry case studies, or simulated professional contexts learners will engage with."
  },

  "step8": {
    "prerequisites": "Specific prerequisite knowledge, skills, or qualifications with suggested diagnostic tool or self-assessment.",
    "paths": "Within-course flexible progression: describe branching routes based on diagnostic results or readiness checks — NOT post-course options. E.g. fast-track pathway for advanced learners, foundational pathway for those needing scaffolding.",
    "optionalContent": "Specific optional and enrichment resources for advanced learners, with competency extensions.",
    "adaptations": "Specific differentiation strategies: extended time, reduced workload options, alternative assessment formats, language support.",
    "selfPacedProgression": "How learners can control their pace: module unlocking criteria, minimum engagement windows, catch-up provisions, maximum completion timeline.",
    "competencyUnlocking": "How demonstrating competency in one module gates access to the next. Include: gate quiz criteria, minimum score to unlock, what happens if gate is not passed (re-attempt policy, remedial content).",
    "rplProvision": "Recognition of Prior Learning (RPL) process: challenge exam scope and format, evidence portfolio requirements, assessor review process, maximum credit available, and how RPL outcomes integrate into the course record."
  },

  "step9": {
    "feedbackMechanisms": ["Automated Quiz Feedback", "Instructor Comments", "Learning Analytics"],
    "feedbackSchedule": "Specific feedback timeline: when formative feedback is given, turnaround time for written feedback, schedule for instructor check-ins.",
    "improvementLoop": "Concrete process for using feedback data to revise course content, pacing, or support — include review trigger, who acts, and timeline.",
    "successMetrics": ["Completion rate: baseline 0%, target ≥80%", "Average assessment score: baseline unknown, target ≥75%", "Learner satisfaction: baseline unknown, target ≥4.0/5.0"]
  }
}`;

    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });

    const rawText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Strip any accidental markdown fences
    const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('JSON parse error. Raw response:', cleanText.slice(0, 500));
      return res.status(500).json({
        error: 'AI returned malformed JSON. Try again or simplify the input.',
        details: parseErr.message,
      });
    }

    return res.json(parsed);

  } catch (err) {
    console.error('Anthropic API error:', err);

    if (err.status === 401) {
      return res.status(401).json({ error: 'Invalid API key. Check your ANTHROPIC_API_KEY in .env' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again.' });
    }

    return res.status(500).json({ error: err.message || 'An unexpected server error occurred.' });
  }
});

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ✦  CompetencyPath is running');
  console.log(`     → Local:  http://localhost:${PORT}`);
  console.log('');
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('  ⚠  ANTHROPIC_API_KEY not set. AI import will not work.');
    console.warn('     Create a .env file with: ANTHROPIC_API_KEY=sk-ant-...');
  }
  console.log('');
});
