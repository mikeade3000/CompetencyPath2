const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate-course-design', async (req, res) => {
  try {
    const { combinedInput } = req.body;

    if (!combinedInput || !combinedInput.trim()) {
      return res.status(400).json({ error: 'Missing combinedInput' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY on server' });
    }

    const systemPrompt = `
You are an expert instructional designer specialising in competency-based learning.
Analyse the provided course write-up and transform it into a structured competency-based course design.
Return ONLY valid JSON with no markdown, no code fences, and no explanation.

Use exactly this structure:
{
  "unitName": "string",
  "step1": {
    "currentState": "string",
    "desiredState": "string",
    "gaps": "string",
    "priority": "Critical|High|Medium|Low"
  },
  "step2": {
    "competencies": ["string"],
    "knowledgeAreas": "string",
    "skills": ["string"],
    "mappingNotes": "string"
  },
  "step3": {
    "specific": "string",
    "measurable": "string",
    "achievable": "string",
    "relevant": "string",
    "timeBound": "string"
  },
  "step4": {
    "contentOverview": "string",
    "topicPlans": [
      {
        "topic": "string",
        "keyContent": "string",
        "notionalHours": "string",
        "engagementActivity": "string"
      }
    ],
    "contentRationale": "string"
  },
  "step5": {
    "formative": "string",
    "summative": "string",
    "rubric": "string",
    "evidenceType": ["string"],
    "passingCriteria": "string"
  },
  "step6": {
    "modality": "Fully Online|Blended / Hybrid|Face-to-Face|Self-paced|Synchronous Virtual",
    "tools": ["string"],
    "contentFormats": ["Video Lectures","Reading Materials","Interactive Simulations","Case Studies","Podcasts","Infographics","Live Webinars","Discussion Forums"],
    "accessibilityNotes": "string"
  },
  "step7": {
    "activities": "string",
    "collaboration": "string",
    "gamification": "string",
    "realWorld": "string"
  },
  "step8": {
    "prerequisites": "string",
    "paths": "string",
    "optionalContent": "string",
    "adaptations": "string"
  },
  "step9": {
    "feedbackMechanisms": ["Automated Quiz Feedback","Instructor Comments","Peer Review","Self-Assessment","Learning Analytics","End-of-Unit Surveys","1-on-1 Check-ins"],
    "feedbackSchedule": "string",
    "improvementLoop": "string",
    "successMetrics": ["string"]
  }
}
`.trim();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://your-app.onrender.com',
        'X-Title': 'CompetencyPath'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 3500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is my course unit write-up:\n\n${combinedInput}` }
        ]
      })
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).send(text);
    }

    const data = JSON.parse(text);
    const raw = data?.choices?.[0]?.message?.content || '';

    if (!raw) {
      return res.status(500).json({ error: 'No content returned from OpenRouter' });
    }

    const cleaned = raw.replace(/```json|```/gi, '').trim();
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');

    if (first === -1 || last === -1) {
      return res.status(500).json({ error: 'Model did not return valid JSON', raw });
    }

    const parsed = JSON.parse(cleaned.slice(first, last + 1));
    res.json(parsed);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});