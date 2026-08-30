# Refresh Supabase Schema Cache

## The tables exist but Supabase API hasn't reloaded them yet!

## Option 1: Restart PostgREST (Recommended - Instant)

### Go to Supabase Dashboard:
https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa/settings/api

### Look for "PostgREST Configuration" section

### Click the "Restart PostgREST" button or "Reload Schema Cache" button

This forces Supabase to recognize the new tables immediately.

---

## Option 2: Wait 2-3 Minutes

Supabase automatically reloads the schema cache every few minutes. Just wait and try again.

---

## Option 3: Make a Small Schema Change

Go to SQL Editor and run:
```sql
NOTIFY pgrst, 'reload schema';
```

---

## After Refreshing:

1. **Hard refresh your browser**: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
2. **Clear browser cache** if needed
3. **Try creating a task again**

---

## Still Not Working?

Visit: http://localhost:3000/test-auth

This will show you if the tables are now visible to the API.
