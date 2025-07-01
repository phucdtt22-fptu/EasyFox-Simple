import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting user account:', user_id);

    // Check required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Supabase URL not configured' },
        { status: 500 }
      );
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }

    // Create service role client for admin operations
    const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey);

    // First, delete user data from custom tables using service role
    console.log('Deleting chat history...');
    const { error: chatError } = await serviceRoleClient
      .from('chat_history')
      .delete()
      .eq('user_id', user_id);

    if (chatError) {
      console.error('Error deleting chat history:', chatError);
    }

    console.log('Deleting user profile...');
    const { error: userError } = await serviceRoleClient
      .from('users')
      .delete()
      .eq('id', user_id);

    if (userError) {
      console.error('Error deleting user profile:', userError);
    }

    // Delete the auth user
    console.log('Attempting to delete auth user...');
    const { error: authError } = await serviceRoleClient.auth.admin.deleteUser(user_id);
    
    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { 
          error: 'Failed to delete user from authentication',
          details: authError 
        },
        { status: 500 }
      );
    }

    console.log('Auth user deleted successfully');

    return NextResponse.json(
      { 
        message: 'User account deleted successfully',
        details: {
          chat_history_deleted: !chatError,
          user_profile_deleted: !userError,
          auth_user_deleted: !authError
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in delete user API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
