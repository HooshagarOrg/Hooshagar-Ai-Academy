import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/ai-settings/budget
 * بروزرسانی بودجه
 */
export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    const { daily_budget_usd, monthly_budget_usd } = body;
    
    if (typeof daily_budget_usd !== 'number' || typeof monthly_budget_usd !== 'number') {
      return NextResponse.json(
        { error: 'Invalid budget values' },
        { status: 400 }
      );
    }
    
    if (daily_budget_usd < 0 || monthly_budget_usd < 0) {
      return NextResponse.json(
        { error: 'Budget values must be positive' },
        { status: 400 }
      );
    }
    
    // بروزرسانی بودجه
    const { data, error } = await supabase
      .from('ai_general_settings')
      .update({ 
        daily_budget_usd,
        monthly_budget_usd
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, settings: data });
    
  } catch (error: any) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}



