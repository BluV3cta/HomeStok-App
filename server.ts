import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an expert grocery receipt scanner for Ghana supermarkets (such as Melcom, Dominion Supermarket, Paga Focus, and Local Markets).
Analyze the provided receipt image and extract:
1. Store name: Check if it's Melcom, Dominion Supermarket, Paga Focus, Local Market, or identify the store on the receipt header.
2. Date: In YYYY-MM-DD format if available, or best estimate.
3. Total amount paid: In Ghanaian Cedis (GHS / GH₵).
4. Payment method: One of "momo" (MTN MoMo, Telecel Cash, AirtelTigo Money), "cash", "card", or "other".
5. Line items: For every purchased item detected, extract:
   - name: Clear product name in Ghana (e.g., "Frytol Vegetable Oil 1L", "Royal Aroma Rice 5kg", "Ideal Milk", "Sugar 1kg", "Geisha Soap 3-pack")
   - quantity: number
   - unitPrice: number (in GHS)
   - totalPrice: number (in GHS)
   - category: One of ["pantry", "produce", "dairy_eggs", "meat_fish", "household", "snacks_drinks", "spices", "other"]

Respond ONLY with valid JSON with this exact schema:
{
  "store": "Melcom",
  "date": "2026-09-27",
  "totalAmount": 145.50,
  "paymentMethod": "momo",
  "items": [
    {
      "name": "Frytol Pure Vegetable Oil 1L",
      "quantity": 1,
      "unitPrice": 38.00,
      "totalPrice": 38.00,
      "category": "pantry"
    }
  ],
  "confidenceNotes": "Extracted successfully from receipt"
}`;

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    return res.status(200).send(response.text || '{}');
  } catch (err: any) {
    console.error('Receipt OCR error:', err);
    return res.status(500).json({ error: err.message || 'Error processing receipt image' });
  }
});

// Serve frontend assets
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
