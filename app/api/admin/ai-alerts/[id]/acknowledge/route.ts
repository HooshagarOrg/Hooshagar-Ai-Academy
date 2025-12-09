import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/ai-alerts/[id]/acknowledge
 * تأیید یک هشدار
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // تأیید هشدار
    const { data, error } = await supabase
      .from('ai_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: user.id,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, alert: data });
    
  } catch (error: any) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}



