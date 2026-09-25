'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useFormValidation, FieldConfig } from '@/hooks/use-form-validation'
import { taskCategories, taskAreas } from '@/lib/tasks'
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Calendar,
  Camera,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedFormProps {
  onSubmit: (data: any) => Promise<void>
  initialData?: any
  className?: string
}

export function EnhancedForm({ onSubmit, initialData, className }: EnhancedFormProps) {
  const fields: FieldConfig[] = [
    {
      name: 'title',
      rules: {
        required: 'Task title is required',
        minLength: { value: 5, message: 'Title must be at least 5 characters' },
        maxLength: { value: 100, message: 'Title cannot exceed 100 characters' }
      },
      defaultValue: initialData?.title || ''
    },
    {
      name: 'description',
      rules: {
        required: 'Description is required',
        minLength: { value: 20, message: 'Description must be at least 20 characters' },
        maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' }
      },
      defaultValue: initialData?.description || ''
    },
    {
      name: 'category',
      rules: {
        required: 'Please select a category'
      },
      defaultValue: initialData?.category || ''
    },
    {
      name: 'area',
      rules: {
        required: 'Please select an area'
      },
      defaultValue: initialData?.area || ''
    },
    {
      name: 'budget',
      rules: {
        required: 'Budget is required',
        min: { value: 50, message: 'Budget must be at least ₹50' },
        max: { value: 50000, message: 'Budget cannot exceed ₹50,000' },
        custom: {
          validate: (value) => {
            const num = Number(value)
            return !isNaN(num) && num > 0 && num % 1 === 0
          },
          message: 'Budget must be a positive whole number'
        }
      },
      defaultValue: initialData?.budget || '',
      transform: (value) => value ? Number(value) : ''
    },
    {
      name: 'date',
      rules: {
        required: 'Task date is required',
        custom: {
          validate: (value) => {
            if (!value) return false
            const selectedDate = new Date(value)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return selectedDate >= today
          },
          message: 'Task date cannot be in the past'
        }
      },
      defaultValue: initialData?.date || ''
    },
    {
      name: 'time',
      rules: {
        required: 'Task time is required'
      },
      defaultValue: initialData?.time || ''
    },
    {
      name: 'phone',
      rules: {
        phone: 'Please enter a valid phone number',
        pattern: {
          value: /^[\+]?[1-9][\d]{0,15}$/,
          message: 'Phone number format is invalid'
        }
      },
      defaultValue: initialData?.phone || ''
    },
    {
      name: 'email',
      rules: {
        email: 'Please enter a valid email address'
      },
      defaultValue: initialData?.email || ''
    }
  ]

  const {
    values,
    errors,
    isValid,
    isSubmitting,
    isDirty,
    getFieldProps,
    getFieldError,
    hasFieldError,
    handleSubmit,
    setValue,
    formRef
  } = useFormValidation({
    fields,
    onSubmit,
    validateOnChange: true,
    validateOnBlur: true,
    showToasts: true
  })

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
    >
      {/* Task Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Task Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Task Title *
            </Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              error={getFieldError('title')}
              success={values.title && !hasFieldError('title')}
              helperText="Provide a clear, descriptive title"
              {...getFieldProps('title')}
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the task..."
              error={getFieldError('description')}
              success={values.description && !hasFieldError('description')}
              helperText="Include any specific requirements or preferences"
              showCount
              maxLength={1000}
              rows={4}
              {...getFieldProps('description')}
            />
          </div>

          {/* Category and Area */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category *
              </Label>
              <Select
                value={values.category}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger 
                  className={cn(
                    hasFieldError('category') && "border-red-500",
                    values.category && !hasFieldError('category') && "border-green-500"
                  )}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {taskCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError('category') && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('category')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="area" className="text-sm font-medium">
                Area *
              </Label>
              <Select
                value={values.area}
                onValueChange={(value) => setValue('area', value)}
              >
                <SelectTrigger 
                  className={cn(
                    hasFieldError('area') && "border-red-500",
                    values.area && !hasFieldError('area') && "border-green-500"
                  )}
                >
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {taskAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError('area') && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('area')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule & Budget Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Schedule & Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Budget Field */}
          <div className="space-y-2">
            <Label htmlFor="budget" className="text-sm font-medium">
              Budget (₹) *
            </Label>
            <Input
              id="budget"
              type="number"
              placeholder="Enter amount"
              startIcon={<DollarSign className="h-4 w-4" />}
              error={getFieldError('budget')}
              success={values.budget && !hasFieldError('budget')}
              helperText="Minimum ₹50, Maximum ₹50,000"
              {...getFieldProps('budget')}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                startIcon={<Calendar className="h-4 w-4" />}
                error={getFieldError('date')}
                success={values.date && !hasFieldError('date')}
                min={new Date().toISOString().split('T')[0]}
                {...getFieldProps('date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium">
                Time *
              </Label>
              <Input
                id="time"
                type="time"
                startIcon={<Clock className="h-4 w-4" />}
                error={getFieldError('time')}
                success={values.time && !hasFieldError('time')}
                {...getFieldProps('time')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              error={getFieldError('phone')}
              success={values.phone && !hasFieldError('phone')}
              helperText="Optional: For urgent communication"
              {...getFieldProps('phone')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              error={getFieldError('email')}
              success={values.email && !hasFieldError('email')}
              helperText="Optional: For notifications and updates"
              {...getFieldProps('email')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Status & Submit */}
      <div className="space-y-4">
        {/* Form Status Indicator */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {isValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-600" />
            )}
            <span className="text-sm font-medium">
              {isValid ? 'Form is valid' : 'Please fix the errors above'}
            </span>
          </div>
          
          {isDirty && (
            <div className="text-xs text-gray-500">
              Unsaved changes
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full h-12 bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Creating Task...</span>
            </div>
          ) : (
            'Create Task'
          )}
        </Button>
      </div>
    </form>
  )
}