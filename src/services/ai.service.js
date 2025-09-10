const httpStatus = require("http-status");
const { OpenAI } = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { buildPrompt } = require("./prompt");

const provider = process.env.AI_PROVIDER?.toLowerCase();
const openaiApiKey = process.env.OPENAI_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

async function createSummary(jobDescription, resumes) {
  const prompt = await buildPrompt(jobDescription, resumes);
  let resultText = "";

  if (provider === "gemini") {
    if (!genAI) throw new Error("Gemini API key not configured");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("Generating...");

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    resultText = result.response.text();
    
    console.log("resultText", resultText);
  } else if (provider === "openai") {
    if (!openai) throw new Error("OpenAI API key not configured");

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini", // change model if needed
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    resultText = result.choices[0].message.content;
  } else {
    throw new Error("Invalid AI_PROVIDER. Use 'gemini' or 'openai'.");
  }

  // Try parsing JSON safely
  try {
    return JSON.parse(resultText);
  } catch (err) {
    console.error("AI returned invalid JSON:", resultText);
    throw new Error("Invalid JSON response from AI");
  }
}

module.exports = {
  createSummary,
};
