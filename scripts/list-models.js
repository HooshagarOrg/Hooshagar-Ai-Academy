require('dotenv').config({ path: '.env.local' });

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY not found!");
    process.exit(1);
  }

  try {
    console.log("🔍 Listing available models...\n");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different API versions
    const testModels = [
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ];
    
    for (const modelName of testModels) {
      try {
        console.log(`Testing: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hi");
        console.log(`✅ ${modelName} - WORKS!\n`);
        break; // اولین مدلی که کار کرد را استفاده کن
      } catch (error) {
        console.log(`❌ ${modelName} - Failed: ${error.message}\n`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

listModels();


































