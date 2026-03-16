import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/rbac/guards';

export async function POST(request: NextRequest) {
  try {
    await requirePermission('settings.manage');

    const body = await request.json();
    const {
      fieldName,
      fieldLabel,
      fieldType,
      fieldGroup,
      helpText,
      defaultValue,
      isRequired,
      isActive,
      displayOrder,
      fieldOptions,
    } = body;

    // Validate required fields
    if (!fieldName || !fieldLabel || !fieldType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert custom field
    const { data, error } = await supabaseAdmin
      .from('contact_custom_fields')
      .insert({
        field_name: fieldName,
        field_label: fieldLabel,
        field_type: fieldType,
        field_group: fieldGroup || null,
        help_text: helpText || null,
        default_value: defaultValue || null,
        is_required: isRequired || false,
        is_active: isActive !== false,
        display_order: displayOrder || 0,
        field_options: fieldOptions || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Field name already exists' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, field: data });
  } catch (error: any) {
    console.error('Create custom field error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create custom field' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission('settings.manage');

    const body = await request.json();
    const {
      id,
      fieldLabel,
      fieldGroup,
      helpText,
      defaultValue,
      isRequired,
      isActive,
      displayOrder,
      fieldOptions,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Field ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('contact_custom_fields')
      .update({
        field_label: fieldLabel,
        field_group: fieldGroup || null,
        help_text: helpText || null,
        default_value: defaultValue || null,
        is_required: isRequired || false,
        is_active: isActive !== false,
        display_order: displayOrder || 0,
        field_options: fieldOptions || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, field: data });
  } catch (error: any) {
    console.error('Update custom field error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update custom field' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission('settings.manage');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Field ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('contact_custom_fields')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete custom field error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete custom field' },
      { status: 500 }
    );
  }
}