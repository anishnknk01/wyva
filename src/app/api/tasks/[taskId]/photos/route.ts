import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAnonClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS so uploads always work without needing
// a storage INSERT policy on storage.objects.  Auth ownership is verified
// using the cookie-based anon client before any storage write happens.
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createAnonClient()

    // Verify auth with the cookie-based client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('photos') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No photos provided' }, { status: 400 })
    }

    const { taskId } = await params

    // Verify task ownership before writing anything to storage
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('customer_id')
      .eq('id', taskId)
      .single()

    if (taskError || !task || task.customer_id !== user.id) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 })
    }

    const uploadedUrls: string[] = []
    const uploadErrors: string[] = []

    // Use service-role client for storage so uploads succeed regardless of
    // whether storage.objects INSERT policies exist.
    const serviceClient = createServiceClient()

    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i]

      if (!file.type.startsWith('image/')) {
        uploadErrors.push(`Photo ${i + 1}: not an image file`)
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        uploadErrors.push(`Photo ${i + 1}: over 5MB`)
        continue
      }

      const timestamp = Date.now()
      const filename = `${taskId}/${timestamp}-${i}.jpg`

      const { error: uploadError } = await serviceClient.storage
        .from('task-photos')
        .upload(filename, file, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        uploadErrors.push(`Photo ${i + 1}: ${uploadError.message}`)
        continue
      }

      const { data: urlData } = serviceClient.storage
        .from('task-photos')
        .getPublicUrl(filename)

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl)
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({
        error: uploadErrors[0] ?? 'No photos could be uploaded',
        details: uploadErrors,
      }, { status: 400 })
    }

    // Update task with photo URLs (anon client is fine here — tasks RLS
    // allows the task's own customer to update).
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        photos: uploadedUrls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('customer_id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to save photo references' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      photos: uploadedUrls,
      count: uploadedUrls.length,
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createAnonClient()
    const { taskId } = await params

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('photos')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({
      photos: task.photos || [],
      count: (task.photos || []).length,
    })

  } catch (error) {
    console.error('Photo fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
