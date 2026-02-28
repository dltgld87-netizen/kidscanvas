// KidsCanvas - Vercel Serverless Function
// 이 파일이 API 키를 안전하게 숨겨주는 "백엔드 서버" 역할을 합니다.
// 사용자 브라우저에는 절대 노출되지 않아요.

export default async function handler(req, res) {
  // CORS 설정 (브라우저에서 이 서버로 요청 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 브라우저가 먼저 보내는 "허락 요청"에 응답
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
  }

  // Vercel 환경변수에서 API 키를 가져옴 (절대 코드에 직접 쓰지 마세요!)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API 키가 서버에 설정되지 않았습니다.' });
  }

  const { systemPrompt, userPrompt } = req.body;

  if (!userPrompt) {
    return res.status(400).json({ error: '요청 내용이 없습니다.' });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorData = await geminiRes.json();
      return res.status(geminiRes.status).json({ error: 'Gemini API 오류', detail: errorData });
    }

    const data = await geminiRes.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return res.status(200).json({ result });

  } catch (error) {
    return res.status(500).json({ error: '서버 오류가 발생했습니다.', detail: error.message });
  }
}
