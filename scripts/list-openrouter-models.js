require('dotenv').config({ path: '.env.local' });

async function listModels() {
  try {
    console.log("🔍 Fetching available models from OpenRouter...\n");
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    });
    
    const data = await response.json();
    
    // فیلتر مدل‌های گوگل
    const googleModels = data.data.filter(m => m.id.includes('google'));
    
    console.log("📋 Google models available:\n");
    googleModels.forEach(model => {
      console.log(`✓ ${model.id}`);
      console.log(`  Price: $${model.pricing.prompt} per 1K tokens`);
      console.log(`  Context: ${model.context_length} tokens\n`);
    });
    
    // پیشنهاد ارزان‌ترین
    const cheapest = googleModels.sort((a, b) => 
      parseFloat(a.pricing.prompt) - parseFloat(b.pricing.prompt)
    )[0];
    
    console.log(`💡 Cheapest: ${cheapest.id}`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

listModels();






























