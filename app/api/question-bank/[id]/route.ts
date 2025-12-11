import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// دریافت یک سوال
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('question_bank')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'سوال یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}

// بروزرسانی سوال
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from('question_bank')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('خطا در بروزرسانی سوال:', error);
      return NextResponse.json(
        { error: 'خطا در بروزرسانی سوال' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}

// حذف سوال
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
    }

    const { error } = await supabase
      .from('question_bank')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('خطا در حذف سوال:', error);
      return NextResponse.json(
        { error: 'خطا در حذف سوال' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('خطای سرور:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}























