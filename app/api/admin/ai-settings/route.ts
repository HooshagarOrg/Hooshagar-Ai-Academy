import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/ai-settings
 * دریافت تنظیمات کلی AI
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // احراز هویت Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // دریافت تنظیمات
    const { data: settings, error } = await supabase
      .from('ai_general_settings')
      .select('*')
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, settings });
    
  } catch (error: any) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}







