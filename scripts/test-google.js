require('dotenv').config({ path: '.env.local' });

// تست Google Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai')

async function testGoogleAI() {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY environment variable is missing')
    process.exit(1)
  }

  console.log('🔍 Testing Google Gemini API...\n')

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = 'سلام! به فارسی یک جمله کوتاه درباره هوش مصنوعی بنویس.'

    console.log('📤 Sending test prompt...')
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log('✅ Google Gemini API is working!\n')
    console.log('📥 Response:', text)
    console.log('\n💰 Cost: رایگان (تا 1,500 درخواست/روز)')
  } catch (error) {
    console.error('❌ Error testing Google Gemini:', error.message)
    process.exit(1)
  }
}

testGoogleAI()

