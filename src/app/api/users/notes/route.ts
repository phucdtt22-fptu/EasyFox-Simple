import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    const { user_id, notes } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // Update user notes (onboarding info)
    const { error } = await supabase
      .from('users')
      .update({ 
        notes: notes?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (error) {
      console.error('Error updating user notes:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update notes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User notes updated successfully'
    });

  } catch (error) {
    console.error('Error in update notes API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
