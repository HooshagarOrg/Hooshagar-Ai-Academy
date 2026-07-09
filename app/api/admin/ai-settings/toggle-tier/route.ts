import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth, ADMIN_ROLES } from '@/lib/security/api-guard';

/**
 * POST /api/admin/ai-settings/toggle-tier
 * فعال/غیرفعال کردن Tier پولی
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (ctx) => {
    try {
      const supabase = await createClient();

      const body = await request.json();
      const { tier, enabled } = body;

      if (!tier || !['E', 'F'].includes(tier)) {
        return NextResponse.json(
          { error: 'Invalid tier. Must be E or F' },
          { status: 400 }
        );
      }

      // بروزرسانی وضعیت
      const field = tier === 'E' ? 'tier_e_enabled' : 'tier_f_enabled';

      const { data, error } = await supabase
        .from('ai_general_settings')
        .update({ [field]: enabled })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // ثبت هشدار
      await supabase.from('ai_alerts').insert({
        alert_type: 'tier_toggle',
        severity: 'info',
        message: `Tier ${tier} توسط Admin ${enabled ? 'فعال' : 'غیرفعال'} شد`,
        details: { tier, enabled, admin_id: ctx.userId }
      });

      return NextResponse.json({ success: true, settings: data });
    } catch (error: any) {
      console.error('Error toggling tier:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }, { roles: ADMIN_ROLES });
}
