// Supabase-backed task store. Replaces the old localStorage prototype.
// All functions are async and talk to Postgres via Supabase, so tasks are
// now shared across devices/browsers for real, scoped by row-level
// security to each authenticated user.

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { TaskCategory, TaskStatus, DisputeReason, PaymentMethod } from "@/lib/tasks";
import { sendSystemMessage } from "@/lib/message-store";

export type TaskRating = {
  stars: number;
  review: string;
  submittedAt: string;
};

export type Task = {
  id: string;
  customerId: string;
  title: string;
  description: string;
  category: TaskCategory | "";
  area: string;
  locationNote: string;
  locationCoordinates?: {
    latitude: number;
    longitude: number;
  };
  date: string;
  time: string;
  durationId: string;
  customHours: number;
  budget: number;
  languages: string[];
  interests: string[];
  platformFee: number;
  total: number;
  paymentMethod: PaymentMethod | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  status: TaskStatus;
  interestedCount: number;
  acceptedWysaId: string | null;
  confirmedWysaId: string | null;
  dispute: { reason: DisputeReason; submittedAt: string } | null;
  userRating: TaskRating | null;
  wysaRating: TaskRating | null;
  photos?: string[];
  createdAt: string;
};

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    customerId: row.customer_id,
    title: row.title,
    description: row.description,
    category: (row.category ?? "") as TaskCategory | "",
    area: row.area,
    locationNote: row.location_note,
    date: row.task_date ?? "",
    time: row.task_time ?? "",
    durationId: row.duration_id,
    customHours: Number(row.custom_hours),
    budget: row.budget,
    languages: row.languages,
    interests: row.interests,
    platformFee: row.platform_fee,
    total: row.total,
    paymentMethod: row.payment_method as PaymentMethod | null,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    status: row.status as TaskStatus,
    interestedCount: row.interested_count,
    acceptedWysaId: row.accepted_wysa_id,
    confirmedWysaId: row.confirmed_wysa_id,
    dispute:
      row.dispute_reason && row.dispute_submitted_at
        ? {
            reason: row.dispute_reason as DisputeReason,
            submittedAt: row.dispute_submitted_at,
          }
        : null,
    // Ratings live in a separate table; attached by loadTask()/listing
    // functions via a follow-up query rather than a join here.
    userRating: null,
    wysaRating: null,
    photos: row.photos || [],
    locationCoordinates: row.location_coordinates ? {
      latitude: row.location_coordinates.lat || row.location_coordinates.latitude,
      longitude: row.location_coordinates.lng || row.location_coordinates.longitude
    } : undefined,
    createdAt: row.created_at,
  };
}

export function generateTaskId(): string {
  const digits = Math.floor(10000 + Math.random() * 89999);
  return `TSK-${digits}`;
}

/** Attaches userRating/wysaRating onto a Task by querying the ratings table. */
async function attachRatings(task: Task): Promise<Task> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ratings")
    .select("rater_id, stars, review, created_at")
    .eq("task_id", task.id);

  if (error || !data) return task;

  const byCustomer = data.find((r) => r.rater_id === task.customerId);
  const byWysa = task.acceptedWysaId
    ? data.find((r) => r.rater_id === task.acceptedWysaId)
    : undefined;

  return {
    ...task,
    userRating: byCustomer
      ? { stars: byCustomer.stars, review: byCustomer.review, submittedAt: byCustomer.created_at }
      : null,
    wysaRating: byWysa
      ? { stars: byWysa.stars, review: byWysa.review, submittedAt: byWysa.created_at }
      : null,
  };
}

export async function saveTask(task: Omit<Task, "createdAt">): Promise<Task | null> {
  const supabase = createClient();
  
  // Check if user is authenticated first
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("saveTask failed - not authenticated", { authError, hasUser: !!user });
    return null;
  }

  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  
  if (profileError) {
    console.error("saveTask failed - profile check error", profileError);
    return null;
  }
  
  if (!profile) {
    console.error("saveTask failed - no profile found for user", user.id);
    // Try to create profile
    const { error: createError } = await supabase
      .from("profiles")
      .insert({ id: user.id, full_name: user.user_metadata?.full_name || "" });
    
    if (createError) {
      console.error("saveTask failed - could not create profile", createError);
      return null;
    }
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      id: task.id,
      customer_id: task.customerId,
      title: task.title,
      description: task.description,
      category: task.category,
      area: task.area,
      location_note: task.locationNote,
      ...(task.locationCoordinates ? {
        location_coordinates: {
          lat: task.locationCoordinates.latitude,
          lng: task.locationCoordinates.longitude,
        }
      } : {}),
      task_date: task.date || null,
      task_time: task.time || null,
      duration_id: task.durationId,
      custom_hours: task.customHours,
      budget: task.budget,
      languages: task.languages,
      interests: task.interests,
      platform_fee: task.platformFee,
      total: task.total,
      payment_method: task.paymentMethod,
      status: task.status,
      interested_count: task.interestedCount,
      accepted_wysa_id: task.acceptedWysaId,
      confirmed_wysa_id: task.confirmedWysaId,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("saveTask failed - insert error", { 
      error, 
      hasData: !!data,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
    });
    return null;
  }
  return rowToTask(data as TaskRow);
}

export async function loadTask(taskId: string): Promise<Task | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

  if (error || !data) return null;
  return attachRatings(rowToTask(data as TaskRow));
}

export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<Task | null> {
  const supabase = createClient();
  const patch: Database["public"]["Tables"]["tasks"]["Update"] = {};

  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.area !== undefined) patch.area = updates.area;
  if (updates.locationNote !== undefined) patch.location_note = updates.locationNote;
  if (updates.locationCoordinates) {
    // Only set if the column exists in the DB — omit entirely if not provided
    patch.location_coordinates = {
      lat: updates.locationCoordinates.latitude,
      lng: updates.locationCoordinates.longitude,
    };
  }
  if (updates.date !== undefined) patch.task_date = updates.date || null;
  if (updates.time !== undefined) patch.task_time = updates.time || null;
  if (updates.durationId !== undefined) patch.duration_id = updates.durationId;
  if (updates.customHours !== undefined) patch.custom_hours = updates.customHours;
  if (updates.budget !== undefined) patch.budget = updates.budget;
  if (updates.languages !== undefined) patch.languages = updates.languages;
  if (updates.interests !== undefined) patch.interests = updates.interests;
  if (updates.paymentMethod !== undefined) patch.payment_method = updates.paymentMethod;
  if (updates.razorpayOrderId !== undefined) patch.razorpay_order_id = updates.razorpayOrderId;
  if (updates.razorpayPaymentId !== undefined)
    patch.razorpay_payment_id = updates.razorpayPaymentId;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.interestedCount !== undefined)
    patch.interested_count = updates.interestedCount;
  if (updates.acceptedWysaId !== undefined) patch.accepted_wysa_id = updates.acceptedWysaId;
  if (updates.confirmedWysaId !== undefined)
    patch.confirmed_wysa_id = updates.confirmedWysaId;
  if (updates.dispute !== undefined) {
    patch.dispute_reason = updates.dispute?.reason ?? null;
    patch.dispute_submitted_at = updates.dispute?.submittedAt ?? null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("updateTask failed", error);
    return null;
  }
  return attachRatings(rowToTask(data as TaskRow));
}

/** Submits a rating for a task from the current user to the other party. */
export async function submitRating(
  taskId: string,
  raterId: string,
  rateeId: string,
  stars: number,
  review: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        taskId,
        ratedId: rateeId,
        rating: stars,
        review: review || null,
        ratingType: 'task_completion'
      })
    });

    if (!response.ok) {
      console.error('Rating submission failed:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("submitRating failed", error);
    return false;
  }
}

export async function listAllTasksForCustomer(customerId: string): Promise<Task[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToTask(row as TaskRow));
}

/** Tasks visible to Wysas browsing for work: posted and not yet confirmed/cancelled. */
export async function listAvailableTasks(): Promise<Task[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "waiting_for_wysa")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToTask(row as TaskRow));
}

/** Tasks a given Wysa has accepted and are not yet paid out (still active). */
export async function listWysaAcceptedTasks(wysaId: string): Promise<Task[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("accepted_wysa_id", wysaId)
    .not("status", "in", '("payment_released","cancelled")')
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToTask(row as TaskRow));
}

/** Tasks a given Wysa has completed and been paid out for. */
export async function listWysaCompletedTasks(wysaId: string): Promise<Task[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("accepted_wysa_id", wysaId)
    .eq("status", "payment_released")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToTask(row as TaskRow));
}

/** Sum of budgets across a Wysa's paid-out (payment_released) tasks. */
export async function calculateWysaEarnings(wysaId: string): Promise<number> {
  const tasks = await listWysaCompletedTasks(wysaId);
  return tasks.reduce((sum, t) => sum + t.budget, 0);
}

// Update task status and send system message
export async function updateTaskStatusWithMessage(
  taskId: string,
  newStatus: TaskStatus,
  wysaId?: string
): Promise<Task | null> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("updateTaskStatusWithMessage failed - not authenticated", authError);
    return null;
  }

  // Get current task
  const currentTask = await loadTask(taskId);
  if (!currentTask) {
    console.error("updateTaskStatusWithMessage failed - task not found");
    return null;
  }

  // Update task status
  const updateData: any = { 
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  if (wysaId && newStatus === 'wysa_accepted') {
    updateData.accepted_wysa_id = wysaId;
  }

  if (wysaId && newStatus === 'confirmed') {
    updateData.confirmed_wysa_id = wysaId;
  }

  const { data: updatedTask, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .select()
    .single();

  if (error || !updatedTask) {
    console.error("updateTaskStatusWithMessage failed - update error", error);
    return null;
  }

  // Send system message based on status change
  let messageText = '';
  let receiverId = '';

  switch (newStatus) {
    case 'wysa_accepted':
      messageText = 'Wysa has accepted your task request!';
      receiverId = currentTask.customerId;
      break;
    case 'confirmed':
      messageText = 'Task has been confirmed. Looking forward to helping you!';
      receiverId = currentTask.customerId;
      break;
    case 'in_progress':
      messageText = 'Task is now in progress.';
      receiverId = wysaId === user.id ? currentTask.customerId : (updatedTask.accepted_wysa_id || updatedTask.confirmed_wysa_id || '');
      break;
    case 'completed':
      messageText = 'Task has been marked as completed.';
      receiverId = wysaId === user.id ? currentTask.customerId : (updatedTask.accepted_wysa_id || updatedTask.confirmed_wysa_id || '');
      break;
    case 'payment_released':
      messageText = 'Payment has been released. Thank you!';
      receiverId = updatedTask.accepted_wysa_id || updatedTask.confirmed_wysa_id || '';
      break;
  }

  // Send system message if we have a message and receiver
  if (messageText && receiverId && receiverId !== user.id) {
    await sendSystemMessage(taskId, receiverId, messageText);
    
    // Send push notification for task status update
    try {
      let notificationTitle = '';
      let notificationBody = messageText;
      
      switch (newStatus) {
        case 'wysa_accepted':
          notificationTitle = 'Task Accepted!';
          break;
        case 'confirmed':
          notificationTitle = 'Task Confirmed';
          break;
        case 'in_progress':
          notificationTitle = 'Task Started';
          break;
        case 'completed':
          notificationTitle = 'Task Completed';
          break;
        case 'payment_released':
          notificationTitle = 'Payment Released';
          break;
      }

      if (notificationTitle) {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: receiverId,
            title: notificationTitle,
            body: notificationBody,
            tag: `task-${taskId}-${newStatus}`,
            data: {
              taskId,
              type: 'task_update',
              status: newStatus,
              url: `/mobile/my-tasks/${taskId}`,
            },
          }),
        });
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
      // Don't fail the task update if push notification fails
    }
  }

  return updatedTask as Task;
}

// Accept a task as a Wysa
export async function acceptTask(taskId: string): Promise<Task | null> {
  return await updateTaskStatusWithMessage(taskId, 'wysa_accepted');
}

// Confirm a task (customer confirms Wysa)
export async function confirmTask(taskId: string): Promise<Task | null> {
  return await updateTaskStatusWithMessage(taskId, 'confirmed');
}

// Mark task as completed
export async function completeTask(taskId: string): Promise<Task | null> {
  return await updateTaskStatusWithMessage(taskId, 'completed');
}

// Release payment
export async function releasePayment(taskId: string): Promise<Task | null> {
  return await updateTaskStatusWithMessage(taskId, 'payment_released');
}