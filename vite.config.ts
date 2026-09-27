import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function receiptScannerPlugin(): Plugin {
  return {
    name: 'receipt-scanner-api',
    configureServer(server) {
      server.middlewares.use('/api/scan-receipt', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { imageBase64, mimeType = 'image/jpeg' } = JSON.parse(body);
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not configured in environment.' }));
              return;
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

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(response.text || '{}');
          } catch (err: any) {
            console.error('Receipt OCR error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Error processing receipt image' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), receiptScannerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
