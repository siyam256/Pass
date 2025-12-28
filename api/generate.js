// Vercel Serverless Function
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY; 
  
  // Your secure prompt
  const PROMPT = "Passport-size photo of a man wearing a black blazer, white shirt, and a solid black tie, strictly following the reference image for facial features and pose. The background must be plain white, clean, and professional. The final output must be in standard passport photo dimensions (2x2 inches or 51x51 mm) with realistic lighting and sharp details, perfect for official use";

  if (!API_KEY) {
    return res.status(500).json({ error: "Server Configuration Error: API Key missing" });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: "image/png", data: image } }
          ]
        }],
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
      })
    });

    const data = await response.json();
    
    // Check for Gemini API errors
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Gemini API Error" });
    }

    const base64 = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

    if (!base64) {
      return res.status(500).json({ error: "AI failed to return an image" });
    }
    
    // Return only the image to the frontend
    return res.status(200).json({ image: base64 });

  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
}
