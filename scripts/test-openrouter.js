require('dotenv').config({ path: '.env.local' });

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY not found in .env.local!");
    process.exit(1);
  }

  console.log("🔍 Testing OpenRouter API with multiple models...\n");

  const models = [
    'google/gemini-2.0-flash-exp:free',      // رایگان!
    'google/gemma-3-27b-it:free',            // رایگان + قوی
    'google/gemini-2.5-flash',               // خیلی ارزان
    'google/gemini-2.5-pro'                  // برای تحلیل عمیق
  ];

  let successfulModel = null;

  for (const model of models) {
    try {
      console.log(`📤 Testing model: ${model}...`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Hooshagar'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: 'سلام، یک جمله فارسی بگو' }
          ]
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.choices && data.choices[0]) {
        console.log(`✅ SUCCESS with ${model}!\n`);
        console.log(`📝 Response: ${data.choices[0].message.content}\n`);
        
        if (data.usage) {
          console.log(`💰 Usage:`);
          console.log(`   - Prompt tokens: ${data.usage.prompt_tokens || 0}`);
          console.log(`   - Completion tokens: ${data.usage.completion_tokens || 0}`);
          console.log(`   - Total tokens: ${data.usage.total_tokens || 0}`);
        }
        
        if (model.includes(':free')) {
          console.log(`\n🎉 This model is FREE!`);
        }
        
        successfulModel = model;
        break; // توقف بعد از اولین موفقیت
        
      } else {
        console.log(`❌ Failed: ${data.error?.message || JSON.stringify(data)}\n`);
      }
      
    } catch (error) {
      console.log(`❌ Error with ${model}: ${error.message}\n`);
    }
  }

  if (successfulModel) {
    console.log(`\n🎯 Recommended model for Hooshagar: ${successfulModel}`);
  } else {
    console.log(`\n❌ All models failed. Please check your API key and try again.`);
    process.exit(1);
  }
}

testOpenRouter();
