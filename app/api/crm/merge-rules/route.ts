import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('settings.manage');
    const userId = session.user.id;

    const body = await request.json();
    const {
      ruleName,
      description,
      minSimilarityScore,
      requiredMatches,
      autoMergeEnabled,
      masterSelectionRule,
      notificationEnabled,
      isActive,
    } = body;

    // Validate required fields
    if (!ruleName || !minSimilarityScore || !requiredMatches || !masterSelectionRule) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert merge rule
    const { data, error } = await supabaseAdmin
      .from('duplicate_merge_rules')
      .insert({
        rule_name: ruleName,
        description: description || null,
        is_active: isActive || false,
        min_similarity_score: minSimilarityScore,
        required_matches: requiredMatches,
        auto_merge_enabled: autoMergeEnabled || false,
        master_selection_rule: masterSelectionRule,
        notification_enabled: notificationEnabled !== false,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Create merge rule error:', error);
      throw error;
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'merge_rule.create',
      resource_type: 'duplicate_merge_rules',
      resource_id: data.id.toString(),
      metadata: { rule_name: ruleName },
    });

    return NextResponse.json({ success: true, rule: data });
  } catch (error: any) {
    console.error('Create merge rule error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create merge rule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requirePermission('settings.manage');
    const userId = session.user.id;

    const body = await request.json();
    const { id, isActive, autoMergeEnabled, ...otherUpdates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (isActive !== undefined) updates.is_active = isActive;
    if (autoMergeEnabled !== undefined) updates.auto_merge_enabled = autoMergeEnabled;
    Object.assign(updates, otherUpdates);

    const { data, error } = await supabaseAdmin
      .from('duplicate_merge_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update merge rule error:', error);
      throw error;
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'merge_rule.update',
      resource_type: 'duplicate_merge_rules',
      resource_id: id.toString(),
      metadata: updates,
    });

    return NextResponse.json({ success: true, rule: data });
  } catch (error: any) {
    console.error('Update merge rule error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update merge rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requirePermission('settings.manage');
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('duplicate_merge_rules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete merge rule error:', error);
      throw error;
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'merge_rule.delete',
      resource_type: 'duplicate_merge_rules',
      resource_id: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete merge rule error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete merge rule' },
      { status: 500 }
    );
  }
}