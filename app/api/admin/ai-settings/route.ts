import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard';

/**
 * GET /api/admin/ai-settings
 * دریافت تنظیمات کلی AI
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const supabase = await createClient();

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
  }, { roles: ADMIN_ROLES });
}
