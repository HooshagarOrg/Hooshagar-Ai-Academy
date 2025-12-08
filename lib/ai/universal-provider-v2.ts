/**
 * سیستم مدیریت AI با 6 لایه (Universal Provider V2)
 * 
 * استراتژی:
 * - Tier A-D: رایگان (99.5% درخواست‌ها)
 * - Tier E-F: پولی (0.5% - فقط با تأیید Admin)
 * 
 * مکانیزم Fallback:
 * A → B → C → D → (هشدار) → E → F
 */

import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';

interface AIRequest {
  feature: string;
  prompt: string;
  image?: string;
  userId?: string;
  schoolId?: string;
}

interface AIResponse {
  content: string;
  tier: string;
  model: string;
  cost: number;
  responseTime: number;
  tokensUsed: number;
}

interface TierConfig {
  name: string;
  model: string;
  enabled: boolean;
  paid: boolean;
  provider: 'openrouter' | 'gemini-proxy';
}

/**
 * تابع اصلی فراخوانی AI با fallback خودکار
 */
export async function callAI(request: AIRequest): Promise<AIResponse> {
  const supabase = await createClient();
  const startTime = Date.now();
  
  // دریافت تنظیمات
  const { data: settings, error: settingsError } = await supabase
    .from('ai_model_settings')
    .select('*')
    .eq('feature_name', request.feature)
    .single();
  
  const { data: general, error: generalError } = await supabase
    .from('ai_general_settings')
    .select('*')
    .single();
  
  if (!settings || !general) {
    throw new Error(`تنظیمات AI یافت نشد: ${settingsError?.message || generalError?.message}`);
  }
  
  // تعریف ترتیب Tiers
  const tiers: TierConfig[] = [
    { 
      name: 'A', 
      model: settings.tier_a_model, 
      enabled: true, 
      paid: false,
      provider: 'openrouter'
    },
    { 
      name: 'B', 
      model: settings.tier_b_model, 
      enabled: !!general.gemini_proxy_url && general.gemini_api_keys?.length > 0, 
      paid: false,
      provider: 'gemini-proxy'
    },
    { 
      name: 'C', 
      model: settings.tier_c_model, 
      enabled: true, 
      paid: false,
      provider: 'openrouter'
    },
    { 
      name: 'D', 
      model: settings.tier_d_model, 
      enabled: true, 
      paid: false,
      provider: 'openrouter'
    },
    { 
      name: 'E', 
      model: settings.tier_e_model, 
      enabled: general.tier_e_enabled, 
      paid: true,
      provider: 'openrouter'
    },
    { 
      name: 'F', 
      model: settings.tier_f_model, 
      enabled: general.tier_f_enabled, 
      paid: true,
      provider: 'openrouter'
    }
  ];
  
  let lastError: Error | null = null;
  let freeTiersExhausted = false;
  
  // امتحان هر Tier به ترتیب
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    
    if (!tier.enabled) {
      continue;
    }
    
    // هشدار: Tier های رایگان تمام شد
    if (i === 4 && !freeTiersExhausted) {
      freeTiersExhausted = true;
      await createAlert(supabase, {
        type: 'free_tiers_exhausted',
        severity: 'warning',
        message: `⚠️ تمام Tier های رایگان (A-D) برای feature "${settings.feature_title}" ناموفق بودند!`,
        details: {
          feature: request.feature,
          lastError: lastError?.message
        }
      });
    }
    
    // چک بودجه برای Tier های پولی
    if (tier.paid) {
      const budgetCheck = await checkBudget(supabase, general);
      if (!budgetCheck.allowed) {
        await logRequest(supabase, {
          feature: request.feature,
          tier: tier.name,
          model: tier.model,
          success: false,
          responseTime: Date.now() - startTime,
          errorMessage: budgetCheck.reason,
          errorCode: 'BUDGET_EXCEEDED',
          userId: request.userId,
          schoolId: request.schoolId,
          promptLength: request.prompt.length,
          hasImage: !!request.image
        });
        continue;
      }
    }
    
    try {
      let content: string;
      let cost = 0;
      let tokensUsed = 0;
      
      // انتخاب Provider
      if (tier.provider === 'gemini-proxy') {
        content = await callGeminiProxy({
          model: tier.model,
          prompt: request.prompt,
          image: request.image,
          proxyUrl: general.gemini_proxy_url!,
          apiKeys: general.gemini_api_keys!,
          temperature: settings.temperature,
          maxTokens: settings.max_tokens
        });
      } else {
        // OpenRouter
        const result = await callOpenRouter({
          model: tier.model,
          prompt: request.prompt,
          image: request.image,
          apiKey: general.openrouter_api_key,
          temperature: settings.temperature,
          maxTokens: settings.max_tokens
        });
        
        content = result.content;
        tokensUsed = result.tokensUsed;
        
        // محاسبه هزینه برای Paid Tiers
        if (tier.paid) {
          cost = estimateCost(tier.model, tokensUsed);
        }
      }
      
      const responseTime = Date.now() - startTime;
      
      // ثبت لاگ موفق
      await logRequest(supabase, {
        feature: request.feature,
        tier: tier.name,
        model: tier.model,
        success: true,
        responseTime,
        cost,
        tokensUsed,
        userId: request.userId,
        schoolId: request.schoolId,
        promptLength: request.prompt.length,
        responseLength: content.length,
        hasImage: !!request.image
      });
      
      // بروزرسانی هزینه
      if (cost > 0) {
        await supabase
          .from('ai_general_settings')
          .update({ 
            current_month_spent: general.current_month_spent + cost,
            current_day_spent: general.current_day_spent + cost
          })
          .eq('id', general.id);
      }
      
      return {
        content,
        tier: tier.name,
        model: tier.model,
        cost,
        responseTime,
        tokensUsed
      };
      
    } catch (error) {
      lastError = error as Error;
      
      // ثبت لاگ ناموفق
      await logRequest(supabase, {
        feature: request.feature,
        tier: tier.name,
        model: tier.model,
        success: false,
        responseTime: Date.now() - startTime,
        errorMessage: lastError.message,
        errorCode: (error as any).code || (error as any).status || 'UNKNOWN',
        userId: request.userId,
        schoolId: request.schoolId,
        promptLength: request.prompt.length,
        hasImage: !!request.image
      });
      
      // ثبت هشدار برای Tier ناموفق (فقط برای Tier های اول)
      if (tier.name === 'A' || tier.name === 'B') {
        await createAlert(supabase, {
          type: 'tier_failure',
          severity: tier.name === 'A' ? 'warning' : 'info',
          message: `Tier ${tier.name} (${tier.model}) ناموفق: ${lastError.message.substring(0, 100)}`,
          details: {
            feature: request.feature,
            tier: tier.name,
            model: tier.model,
            error: lastError.message
          }
        });
      }
      
      // ادامه به Tier بعدی
      continue;
    }
  }
  
  // اگر همه Tier ها ناموفق بودند
  await createAlert(supabase, {
    type: 'all_tiers_failed',
    severity: 'critical',
    message: `🚨 همه 6 Tier برای "${settings.feature_title}" ناموفق بودند!`,
    details: {
      feature: request.feature,
      lastError: lastError?.message
    }
  });
  
  throw new Error(`همه Tier ها ناموفق بودند. آخرین خطا: ${lastError?.message || 'Unknown'}`);
}

/**
 * فراخوانی OpenRouter
 */
async function callOpenRouter(params: {
  model: string;
  prompt: string;
  image?: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}): Promise<{ content: string; tokensUsed: number }> {
  const messages: any[] = [];
  
  if (params.image) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: params.prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${params.image}` } }
      ]
    });
  } else {
    messages.push({
      role: 'user',
      content: params.prompt
    });
  }
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://hooshagar.com',
      'X-Title': 'Hooshagar AI Platform'
    },
    body: JSON.stringify({
      model: params.model,
      messages: messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens
    })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter ${response.status}: ${error.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens || Math.ceil((params.prompt.length + data.choices[0].message.content.length) / 4)
  };
}

/**
 * فراخوانی Gemini Proxy با Load Balancing
 */
let currentGeminiKeyIndex = 0;

async function callGeminiProxy(params: {
  model: string;
  prompt: string;
  image?: string;
  proxyUrl: string;
  apiKeys: string[];
  temperature: number;
  maxTokens: number;
}): Promise<string> {
  if (params.apiKeys.length === 0) {
    throw new Error('No Gemini API keys available');
  }
  
  // Round-robin load balancing
  const apiKey = params.apiKeys[currentGeminiKeyIndex];
  currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % params.apiKeys.length;
  
  const messages: any[] = [];
  
  if (params.image) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: params.prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${params.image}` } }
      ]
    });
  } else {
    messages.push({
      role: 'user',
      content: params.prompt
    });
  }
  
  const response = await fetch(params.proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: params.model,
      apiKey: apiKey,
      messages: messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens
    })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Gemini Proxy ${response.status}: ${error.error || 'Unknown error'}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * تخمین هزینه مدل
 */
function estimateCost(model: string, tokens: number): number {
  // جدول هزینه مدل‌ها (میانگین input/output per 1K tokens)
  const costs: Record<string, number> = {
    // Tier E - Cheap
    'openai/gpt-4o-mini': 0.00015,
    'google/gemini-flash-1.5': 0.000075,
    'anthropic/claude-3-5-haiku': 0.0008,
    'meta-llama/llama-3.3-70b-instruct': 0.00035,
    'qwen/qwen-2.5-72b-instruct': 0.00035,
    'mistralai/mistral-small': 0.0001,
    
    // Tier F - Premium
    'anthropic/claude-3-5-sonnet': 0.003,
    'openai/gpt-4o': 0.0025,
    'google/gemini-1.5-pro': 0.00125,
    'anthropic/claude-3-opus': 0.015,
    'openai/o1-preview': 0.015,
    'x-ai/grok-2': 0.002
  };
  
  const costPerToken = costs[model] || 0.0003; // default
  return (tokens / 1000) * costPerToken;
}

/**
 * چک کردن بودجه
 */
async function checkBudget(
  supabase: any,
  settings: any
): Promise<{ allowed: boolean; reason?: string }> {
  // چک بودجه ماهانه
  if (settings.current_month_spent >= settings.monthly_budget_usd) {
    return {
      allowed: false,
      reason: `بودجه ماهانه تمام شد ($${settings.current_month_spent}/$${settings.monthly_budget_usd})`
    };
  }
  
  // چک بودجه روزانه
  if (settings.current_day_spent >= settings.daily_budget_usd) {
    return {
      allowed: false,
      reason: `بودجه روزانه تمام شد ($${settings.current_day_spent}/$${settings.daily_budget_usd})`
    };
  }
  
  return { allowed: true };
}

/**
 * ثبت لاگ درخواست
 */
async function logRequest(supabase: any, data: {
  feature: string;
  tier: string;
  model: string;
  success: boolean;
  responseTime: number;
  errorMessage?: string;
  errorCode?: string;
  cost?: number;
  tokensUsed?: number;
  userId?: string;
  schoolId?: string;
  promptLength: number;
  responseLength?: number;
  hasImage: boolean;
}) {
  await supabase.from('ai_request_logs').insert({
    feature_name: data.feature,
    tier_used: data.tier,
    model_used: data.model,
    success: data.success,
    response_time_ms: data.responseTime,
    error_message: data.errorMessage,
    error_code: data.errorCode,
    cost_usd: data.cost || 0,
    tokens_used: data.tokensUsed || 0,
    user_id: data.userId,
    school_id: data.schoolId,
    prompt_length: data.promptLength,
    response_length: data.responseLength,
    has_image: data.hasImage
  });
}

/**
 * ایجاد هشدار
 */
async function createAlert(
  supabase: any,
  alert: {
    type: string;
    severity: string;
    message: string;
    details?: any;
  }
) {
  await supabase.from('ai_alerts').insert({
    alert_type: alert.type,
    severity: alert.severity,
    message: alert.message,
    details: alert.details
  });
}

