import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, objective, budget, notes, user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    if (!name || !objective) {
      return NextResponse.json({ error: 'Missing required fields: name, objective' }, { status: 400 });
    }

    // Insert campaign into database (theo schema của Database)
    const { data, error } = await supabase
      .from('campaigns')
      .insert([
        {
          user_id,
          name,
          budget: budget ? parseFloat(budget) : null,
          target_audience: objective || null, // Map objective to target_audience
          goals: notes || null, // Map notes to goals
          content_pillars: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      campaign: data,
      message: 'Campaign created successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Get user campaigns
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      campaigns: data || []
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
