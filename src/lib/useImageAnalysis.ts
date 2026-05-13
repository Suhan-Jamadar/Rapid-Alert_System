import { useState, useCallback } from 'react';

export type AnalysisStatus = 'idle' | 'analysing' | 'done' | 'failed';

export interface ImageAnalysisResult {
  incidentType: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  confidence: number;
  risks: string[];
  recommendations: string[];
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function normalizeMime(file: File): string {
  const t = file.type.toLowerCase();
  if (t.includes('png'))  return 'image/png';
  if (t.includes('webp')) return 'image/webp';
  if (t.includes('gif'))  return 'image/gif';
  if (t.includes('heic')) return 'image/heic';
  if (t.includes('heif')) return 'image/heif';
  return 'image/jpeg';
}

const PROMPT = `You are an AI disaster response analyst. Analyse this image carefully.
Respond ONLY with a single valid JSON object — no markdown fences, no explanation, no extra text.

Required fields:
{
  "incidentType": one of [fire, flood, earthquake, landslide, storm, medical, rescue, infrastructure, other],
  "priority": one of [CRITICAL, HIGH, MEDIUM, LOW],
  "confidence": integer 0-100,
  "description": "2-3 factual sentences for a first-responder briefing describing exactly what you see",
  "risks": ["up to 4 short risk labels"],
  "recommendations": ["up to 4 short action labels"]
}

Priority guide:
- CRITICAL: mass casualties visible, structural collapse, large active fire, flash flood with people at risk
- HIGH: active fire/flood, significant structural damage, no confirmed mass casualties
- MEDIUM: contained incident, property damage, no visible casualties
- LOW: minor incident or precautionary observation`;

export function useImageAnalysis() {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);

  const analyse = useCallback(async (file: File): Promise<ImageAnalysisResult | null> => {
    if (!GEMINI_API_KEY) {
      console.warn('VITE_GEMINI_API_KEY not set — image analysis disabled');
      setStatus('failed');
      return null;
    }

    setStatus('analysing');
    setResult(null);

    try {
      const base64 = await fileToBase64(file);
      const mimeType = normalizeMime(file);

      const body = {
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      };

      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn('Gemini API error:', res.status, errText);
        setStatus('failed');
        return null;
      }

      const data = await res.json();
      const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed: ImageAnalysisResult = JSON.parse(cleaned);

      if (!parsed.incidentType || !parsed.priority || !parsed.description) {
        throw new Error('Incomplete response from Gemini');
      }

      setResult(parsed);
      setStatus('done');
      return parsed;
    } catch (err) {
      console.warn('Image analysis failed:', err);
      setStatus('failed');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
  }, []);

  return { status, result, analyse, reset };
}
