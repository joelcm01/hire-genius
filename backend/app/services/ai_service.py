import json
import logging
from typing import List, Optional

import anthropic

logger = logging.getLogger(__name__)

MODEL = "claude-opus-4-6"


class AIService:
    """Wraps Anthropic Claude API for CV analysis and candidate evaluation."""

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)

    def extract_candidate_data(self, cv_text: str) -> dict:
        """
        Use Claude to extract structured data from raw CV text.

        Returns a dict with: name, email, phone, location,
        skills (list of {name, type, level}),
        experience (list of {company, position, duration_months,
                              start_date, end_date, description}),
        education, certifications, average_tenure_months
        """
        prompt = f"""Analyze this CV and extract structured information. Return a JSON object with these exact fields:
{{
  "name": "Full name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "location": "City, Country",
  "skills": [
    {{"name": "Python", "type": "technical", "level": "expert"}},
    {{"name": "Leadership", "type": "soft", "level": "intermediate"}}
  ],
  "experience": [
    {{
      "company": "Company Name",
      "position": "Job Title",
      "duration_months": 24,
      "start_date": "2022-01",
      "end_date": "2024-01",
      "description": "Brief description of responsibilities and achievements"
    }}
  ],
  "education": [{{"institution": "...", "degree": "...", "year": "..."}}],
  "certifications": ["cert1", "cert2"],
  "average_tenure_months": 18
}}

CV Text:
{cv_text}

Rules:
- Use null for missing fields, never omit them.
- duration_months should be calculated from start/end dates when possible.
- average_tenure_months is the mean of all experience durations.
- skill type must be "technical" or "soft".
- skill level should be one of: "beginner", "intermediate", "advanced", "expert".
- Return ONLY valid JSON, no markdown, no explanations."""

        message = self.client.messages.create(
            model=MODEL,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```", 2)[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.rsplit("```", 1)[0].strip()
        return json.loads(raw)

    def evaluate_candidate(self, candidate_data: dict, vacancy: dict) -> dict:
        """
        Evaluate a candidate's compatibility with a vacancy.

        Returns a dict with compatibility scores, reasoning, strengths,
        gaps, and a recommendation.
        """
        prompt = f"""Evaluate this candidate for the job vacancy and return a JSON assessment.

VACANCY:
Title: {vacancy.get('title', 'N/A')}
Department: {vacancy.get('department', 'N/A')}
Required Experience: {vacancy.get('required_experience_years', 'N/A')} years
Requirements: {json.dumps(vacancy.get('requirements', []))}
Company Values: {json.dumps(vacancy.get('values', []))}
Description: {vacancy.get('description', 'N/A')}

CANDIDATE:
{json.dumps(candidate_data, indent=2)}

Return a JSON object with exactly these fields:
{{
  "compatibility_score": 85,
  "values_alignment_score": 90,
  "requirements_score": 80,
  "experience_relevance_score": 85,
  "stability_score": 75,
  "reasoning": "Detailed explanation of the overall assessment covering strengths and concerns (2-3 paragraphs)",
  "strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2"],
  "recommendation": "hire"
}}

Scoring guidelines (0-100):
- compatibility_score: overall fit for the role
- values_alignment_score: alignment with company values
- requirements_score: percentage of requirements met
- experience_relevance_score: how relevant their experience is
- stability_score: based on average tenure (>24 months = high stability)

recommendation must be one of: "hire", "second_interview", "reject", "pending"

Be objective and thorough. Return ONLY valid JSON."""

        message = self.client.messages.create(
            model=MODEL,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```", 2)[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.rsplit("```", 1)[0].strip()
        return json.loads(raw)

    def analyze_multi_vacancy(self, candidate_data: dict, vacancies: List[dict]) -> List[dict]:
        """
        Quickly evaluate a candidate's fit across multiple vacancies.

        Returns a list of {vacancy_id, title, score, brief_reason}.
        """
        vacancy_list_text = "\n".join(
            f"- ID {v['vacancy_id']}: {v['title']} "
            f"(Dept: {v.get('department', 'N/A')}, "
            f"Req: {v.get('required_experience_years', '?')} yrs)"
            for v in vacancies
        )

        prompt = f"""Analyze this candidate and score their fit for each vacancy listed below.

CANDIDATE SUMMARY:
Name: {candidate_data.get('name', 'Unknown')}
Location: {candidate_data.get('location', 'N/A')}
Skills: {json.dumps([s.get('name') for s in candidate_data.get('skills', [])])}
Experience entries: {len(candidate_data.get('experience', []))}
Average tenure: {candidate_data.get('average_tenure_months', 'N/A')} months

VACANCIES:
{vacancy_list_text}

Return a JSON array (one entry per vacancy):
[
  {{
    "vacancy_id": 1,
    "title": "Software Engineer",
    "score": 82,
    "brief_reason": "Strong Python skills and relevant backend experience"
  }},
  ...
]

score is 0-100 overall fit. brief_reason is one sentence maximum.
Return ONLY valid JSON array."""

        message = self.client.messages.create(
            model=MODEL,
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```", 2)[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.rsplit("```", 1)[0].strip()
        return json.loads(raw)
