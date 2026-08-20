import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Shared Gemini client setup with mandatory User-Agent
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // API Endpoint: Automated Multi-Currency Exchange Rate Lookup (SAR, USD, EUR)
  app.get("/api/exchange-rates", async (req, res) => {
    try {
      // Official SAMA / ECB Benchmark rates baseline fallback
      const exchangeData = {
        base: "USD" as const,
        rates: {
          USD: 1.0,
          SAR: 3.75, // Fixed Saudi Riyal Peg (Saudi Central Bank / SAMA)
          EUR: 0.918,
        },
        lastUpdated: new Date().toISOString(),
        source: "SAMA Peg / ECB Benchmark",
      };

      try {
        const apiRes = await fetch("https://open.er-api.com/v6/latest/USD");
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data && data.rates) {
            exchangeData.rates.SAR = Number((data.rates.SAR || 3.75).toFixed(4));
            exchangeData.rates.EUR = Number((data.rates.EUR || 0.918).toFixed(4));
            exchangeData.source = "Live Automated Financial Exchange API";
          }
        }
      } catch (e) {
        console.log("Using SAMA/ECB benchmark rates fallback for multi-currency lookup.");
      }

      res.json(exchangeData);
    } catch (err: any) {
      console.error("Error in exchange rates endpoint:", err);
      res.status(500).json({ error: err.message || "Failed to fetch exchange rates." });
    }
  });

  // API Endpoint: Standardize and extract structured quotation data
  app.post("/api/standardize-quotations", async (req, res) => {
    try {
      const { quotes } = req.body;
      if (!quotes || typeof quotes !== "object") {
        return res.status(400).json({ error: "Missing or invalid 'quotes' payload." });
      }

      const ai = getGeminiClient();

      const prompt = `You are an expert procurement analyst. Extract structured vendor procurement data from these vendor quotations for a server/hardware RFQ.
Return ONLY a valid JSON object matching the specified schema.

Quotations:
- Meridian: ${quotes.meridian || "N/A"}
- Ironclad: ${quotes.ironclad || "N/A"}
- Vantage: ${quotes.vantage || "N/A"}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              meridian: {
                type: Type.OBJECT,
                properties: {
                  priceUSD: { type: Type.NUMBER, description: "Total price in USD for the pair/units" },
                  leadTimeWeeks: { type: Type.NUMBER, description: "Lead time in weeks" },
                  warrantyYears: { type: Type.NUMBER, description: "Warranty duration in years" },
                  supportSLA: { type: Type.STRING, description: "Summary of support SLA" },
                  redundancyCertified: { type: Type.BOOLEAN, description: "Whether redundancy/failover is factory certified" },
                  certifications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of ISO or technical certifications" },
                  specsSummary: { type: Type.STRING, description: "One sentence summary of specs" },
                },
                required: ["priceUSD", "leadTimeWeeks", "warrantyYears", "supportSLA", "redundancyCertified", "certifications", "specsSummary"],
              },
              ironclad: {
                type: Type.OBJECT,
                properties: {
                  priceUSD: { type: Type.NUMBER, description: "Total price in USD for the pair/units" },
                  leadTimeWeeks: { type: Type.NUMBER, description: "Lead time in weeks" },
                  warrantyYears: { type: Type.NUMBER, description: "Warranty duration in years" },
                  supportSLA: { type: Type.STRING, description: "Summary of support SLA" },
                  redundancyCertified: { type: Type.BOOLEAN, description: "Whether redundancy/failover is factory certified" },
                  certifications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of ISO or technical certifications" },
                  specsSummary: { type: Type.STRING, description: "One sentence summary of specs" },
                },
                required: ["priceUSD", "leadTimeWeeks", "warrantyYears", "supportSLA", "redundancyCertified", "certifications", "specsSummary"],
              },
              vantage: {
                type: Type.OBJECT,
                properties: {
                  priceUSD: { type: Type.NUMBER, description: "Total price in USD for the pair/units" },
                  leadTimeWeeks: { type: Type.NUMBER, description: "Lead time in weeks" },
                  warrantyYears: { type: Type.NUMBER, description: "Warranty duration in years" },
                  supportSLA: { type: Type.STRING, description: "Summary of support SLA" },
                  redundancyCertified: { type: Type.BOOLEAN, description: "Whether redundancy/failover is factory certified" },
                  certifications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of ISO or technical certifications" },
                  specsSummary: { type: Type.STRING, description: "One sentence summary of specs" },
                },
                required: ["priceUSD", "leadTimeWeeks", "warrantyYears", "supportSLA", "redundancyCertified", "certifications", "specsSummary"],
              },
            },
            required: ["meridian", "ironclad", "vantage"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini AI.");
      }

      const parsedData = JSON.parse(text);
      res.json(parsedData);
    } catch (err: any) {
      console.error("Error standardizing quotations:", err);
      res.status(500).json({ error: err.message || "Failed to parse quotations." });
    }
  });

  // API Endpoint: Parse PDF, Email, or Manual Text Proposal
  app.post("/api/parse-document", async (req, res) => {
    try {
      const { documentType, fileData, textContent, targetVendor, fileName } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are an expert procurement AI document parser. Analyze the provided procurement proposal document (Type: ${documentType || 'General'}, File: ${fileName || 'Uploaded File'}).
Extract key vendor metrics into a structured JSON proposal.

Document Content / Text:
${textContent || "See attached document"}

Target vendor preference: "${targetVendor || 'auto'}" (if 'meridian', 'ironclad', or 'vantage', map vendorKey to that key, or infer appropriate key from text).

Return a valid JSON object matching the schema:
- vendorKey: 'meridian' | 'ironclad' | 'vantage' | string
- vendorName: Display name of vendor (e.g. 'Meridian Technologies', 'Ironclad Systems', 'Vantage Tech')
- priceUSD: total numeric price in USD (number)
- leadTimeWeeks: numeric lead time in weeks (number)
- warrantyYears: numeric warranty duration in years (number)
- supportSLA: concise summary string of support SLA (string)
- redundancyCertified: boolean whether failover/redundancy is factory certified
- certifications: list of ISO/technical certifications (array of strings)
- specsSummary: concise hardware/service specs summary (string)
- rawQuoteText: a clean, formatted block of proposal text summarizing all key extracted quote points (string)
- confidence: string ('High' | 'Medium' | 'Low')
- sourceType: string ('PDF Document' | 'Email Message' | 'Manual Input')
`;

      const contents: any[] = [];

      // If PDF base64 is provided
      if (documentType === "pdf" && fileData && typeof fileData === "string" && fileData.length > 50) {
        const base64Clean = fileData.replace(/^data:application\/pdf;base64,/, "");
        contents.push({
          inlineData: {
            mimeType: "application/pdf",
            data: base64Clean,
          },
        });
      }

      contents.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              vendorKey: { type: Type.STRING },
              vendorName: { type: Type.STRING },
              priceUSD: { type: Type.NUMBER },
              leadTimeWeeks: { type: Type.NUMBER },
              warrantyYears: { type: Type.NUMBER },
              supportSLA: { type: Type.STRING },
              redundancyCertified: { type: Type.BOOLEAN },
              certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
              specsSummary: { type: Type.STRING },
              rawQuoteText: { type: Type.STRING },
              confidence: { type: Type.STRING },
              sourceType: { type: Type.STRING },
            },
            required: [
              "vendorKey",
              "vendorName",
              "priceUSD",
              "leadTimeWeeks",
              "warrantyYears",
              "supportSLA",
              "redundancyCertified",
              "certifications",
              "specsSummary",
              "rawQuoteText",
              "confidence",
              "sourceType"
            ],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI parser.");
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (err: any) {
      console.error("Error in document parser API:", err);
      res.status(500).json({ error: err.message || "Failed to parse proposal document." });
    }
  });

  // API Endpoint: Generate Procurement Recommendation Narrative
  app.post("/api/generate-recommendation", async (req, res) => {
    try {
      const { structuredData, scores, weights } = req.body;

      const ai = getGeminiClient();

      const prompt = `You are an expert executive procurement analyst advising a senior procurement lead on a server cluster vendor decision.

Standardized Vendor Data:
${JSON.stringify(structuredData, null, 2)}

Calculated Scores (0-100 weighted):
${JSON.stringify(scores, null, 2)}

Decision Weights Applied:
${JSON.stringify(weights, null, 2)}

Synthesize a professional executive recommendation.
Return ONLY a valid JSON object matching the specified schema.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedVendor: { type: Type.STRING, description: "Vendor key: meridian, ironclad, or vantage" },
              recommendationTitle: { type: Type.STRING, description: "Executive headline summary" },
              drivingCriteria: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2-3 specific criteria driving this selection",
              },
              excludedVendors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    vendorKey: { type: Type.STRING },
                    vendorName: { type: Type.STRING },
                    reason: { type: Type.STRING, description: "Reason why excluded or ranked lower" },
                  },
                  required: ["vendorKey", "vendorName", "reason"],
                },
                description: "Excluded or lower ranked vendors and reasons",
              },
              narrative: { type: Type.STRING, description: "3-4 sentence comprehensive recommendation narrative detailing tradeoffs" },
              keyRisks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 specific risk or verification points for procurement leads" },
              negotiationTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-2 potential negotiation levers (e.g. lead time expediting or SLA upgrades)" },
            },
            required: ["recommendedVendor", "recommendationTitle", "drivingCriteria", "excludedVendors", "narrative", "keyRisks", "negotiationTips"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty recommendation response from Gemini AI.");
      }

      res.json(JSON.parse(text));
    } catch (err: any) {
      console.error("Error generating recommendation:", err);
      res.status(500).json({ error: err.message || "Failed to generate recommendation." });
    }
  });

  // API Endpoint: Procurement Copilot Chat Assistant
  app.post("/api/procurement-chat", async (req, res) => {
    try {
      const { message, history, context } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing 'message' string parameter." });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are an expert, highly interactive Procurement AI Copilot assistant evaluating RFQ-2026-0803 for enterprise hardware procurement.
You have real-time access to the currently loaded procurement context:

Structured Vendor Data:
${JSON.stringify(context?.structuredData || {}, null, 2)}

Vendor Weighted Scores:
${JSON.stringify(context?.scores || {}, null, 2)}

Decision Weights Applied:
${JSON.stringify(context?.weights || {}, null, 2)}

AI Executive Recommendation:
${JSON.stringify(context?.recommendation || {}, null, 2)}

Governance Sign-Off Record:
${JSON.stringify(context?.signoff || "Pending sign-off", null, 2)}

Raw Quotes:
${JSON.stringify(context?.quotes || {}, null, 2)}

Instructions for Responses:
1. BE TARGETED & DETAILED: When asked a specific question (e.g. about price, lead time, SLAs, warranty, or risks), focus deeply and directly on THAT specific topic. Do NOT dump a generic surface-level summary of every vendor unless the user explicitly asks for an overall summary.
2. PROVIDE DEEP ANALYTICAL INSIGHTS: Include precise numbers (USD savings, weeks difference, years of warranty, specific certification standards), trade-offs, and strategic advice.
3. BE INTERACTIVE: Always conclude your response with 2 to 3 short, contextually relevant follow-up questions on a new line starting with "Suggested follow-ups:" separated by pipe symbols (|). Example:
Suggested follow-ups: Compare support SLAs | Analyze Vantage lead time risk | Show sign-off status
4. Use clean Markdown formatting with bold headers, bullet points, and key metrics.`;

      // Build chat contents from history if provided
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history)) {
        for (const h of history) {
          if (h.role && h.text) {
            contents.push({
              role: h.role === "user" ? "user" : "model",
              parts: [{ text: h.text }],
            });
          }
        }
      }

      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const replyText = response.text || "I apologize, but I couldn't process your request at this moment.";
      res.json({ reply: replyText });
    } catch (err: any) {
      console.error("Error in procurement chat endpoint:", err);
      res.status(500).json({ error: err.message || "Chat service error." });
    }
  });

  // Vite middleware for dev mode vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Procurement Assistant Server running on http://localhost:${PORT}`);
  });
}

startServer();
