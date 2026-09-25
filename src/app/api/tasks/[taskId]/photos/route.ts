import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
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
    
    // Verify task ownership
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('customer_id')
      .eq('id', taskId)
      .single()
      
    if (taskError || !task || task.customer_id !== user.id) {
      return NextResponse.json({ error: 'Task not found or unauthorized' }, { status: 404 })
    }

    const uploadedUrls: string[] = []
    
    // Upload each photo to Supabase Storage
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i]
      
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        continue
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        continue
      }
      
      // Generate unique filename
      const timestamp = Date.now()
      const filename = `${taskId}/${timestamp}-${i}.jpg`
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-photos')
        .upload(filename, file, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        })
        
      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('task-photos')
        .getPublicUrl(filename)
        
      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl)
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ error: 'No photos could be uploaded' }, { status: 400 })
    }

    // Update task with photo URLs
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        photos: uploadedUrls,
        updated_at: new Date().toISOString()
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
      count: uploadedUrls.length
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
    const supabase = await createClient()
    
    const { taskId } = await params
    
    // Get task photos
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
      count: (task.photos || []).length
    })
    
  } catch (error) {
    console.error('Photo fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}