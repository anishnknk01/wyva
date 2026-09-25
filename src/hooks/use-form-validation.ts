'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'

export interface ValidationRule {
  required?: boolean | string
  minLength?: { value: number; message: string }
  maxLength?: { value: number; message: string }
  pattern?: { value: RegExp; message: string }
  min?: { value: number; message: string }
  max?: { value: number; message: string }
  custom?: { 
    validate: (value: any) => boolean | string
    message?: string 
  }
  email?: boolean | string
  phone?: boolean | string
  url?: boolean | string
}

export interface FieldConfig {
  name: string
  rules?: ValidationRule
  defaultValue?: any
  transform?: (value: any) => any
}

export interface FormState<T = any> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
}

export interface UseFormValidationOptions<T = any> {
  fields: FieldConfig[]
  onSubmit?: (values: T) => Promise<void> | void
  validateOnChange?: boolean
  validateOnBlur?: boolean
  showToasts?: boolean
  resetOnSubmit?: boolean
}

export function useFormValidation<T = any>({
  fields,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
  showToasts = false,
  resetOnSubmit = true
}: UseFormValidationOptions<T>) {
  // Initialize form state
  const initialValues = fields.reduce((acc, field) => ({
    ...acc,
    [field.name]: field.defaultValue ?? ''
  }), {}) as T

  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isValid: true,
    isSubmitting: false,
    isDirty: false
  })

  const formRef = useRef<HTMLFormElement>(null)
  const fieldsRef = useRef<Record<string, HTMLElement>>({})

  // Validation functions
  const validateField = useCallback((name: string, value: any): string => {
    const field = fields.find(f => f.name === name)
    if (!field?.rules) return ''

    const { rules } = field

    // Required validation
    if (rules.required) {
      const isEmpty = value === undefined || value === null || 
                     (typeof value === 'string' && value.trim() === '') ||
                     (Array.isArray(value) && value.length === 0)
      
      if (isEmpty) {
        return typeof rules.required === 'string' 
          ? rules.required 
          : `${name} is required`
      }
    }

    // Skip other validations if empty and not required
    if (!value && !rules.required) return ''

    // String-based validations
    if (typeof value === 'string') {
      // Email validation
      if (rules.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return typeof rules.email === 'string' 
            ? rules.email 
            : 'Please enter a valid email address'
        }
      }

      // Phone validation
      if (rules.phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return typeof rules.phone === 'string' 
            ? rules.phone 
            : 'Please enter a valid phone number'
        }
      }

      // URL validation
      if (rules.url) {
        try {
          new URL(value)
        } catch {
          return typeof rules.url === 'string' 
            ? rules.url 
            : 'Please enter a valid URL'
        }
      }

      // Length validations
      if (rules.minLength && value.length < rules.minLength.value) {
        return rules.minLength.message
      }

      if (rules.maxLength && value.length > rules.maxLength.value) {
        return rules.maxLength.message
      }
    }

    // Number-based validations
    if (typeof value === 'number' || !isNaN(Number(value))) {
      const numValue = Number(value)
      
      if (rules.min && numValue < rules.min.value) {
        return rules.min.message
      }

      if (rules.max && numValue > rules.max.value) {
        return rules.max.message
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.value.test(String(value))) {
      return rules.pattern.message
    }

    // Custom validation
    if (rules.custom) {
      const result = rules.custom.validate(value)
      if (result !== true) {
        return typeof result === 'string' 
          ? result 
          : rules.custom.message || 'Invalid value'
      }
    }

    return ''
  }, [fields])

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}
    let isValid = true

    fields.forEach(field => {
      const error = validateField(field.name, formState.values[field.name as keyof T])
      if (error) {
        errors[field.name] = error
        isValid = false
      }
    })

    setFormState(prev => ({
      ...prev,
      errors,
      isValid
    }))

    return isValid
  }, [fields, formState.values, validateField])

  // Field manipulation functions
  const setValue = useCallback((name: string, value: any) => {
    const field = fields.find(f => f.name === name)
    const transformedValue = field?.transform ? field.transform(value) : value

    setFormState(prev => {
      const newValues = {
        ...prev.values,
        [name]: transformedValue
      }

      const fieldError = validateOnChange ? validateField(name, transformedValue) : ''
      
      return {
        ...prev,
        values: newValues,
        errors: {
          ...prev.errors,
          [name]: fieldError
        },
        isDirty: true,
        isValid: validateOnChange ? Object.keys({
          ...prev.errors,
          [name]: fieldError
        }).every(key => !prev.errors[key]) : prev.isValid
      }
    })
  }, [fields, validateField, validateOnChange])

  const setError = useCallback((name: string, error: string) => {
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [name]: error
      },
      isValid: false
    }))
  }, [])

  const clearError = useCallback((name: string) => {
    setFormState(prev => {
      const newErrors = { ...prev.errors }
      delete newErrors[name]
      
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0
      }
    })
  }, [])

  const setTouched = useCallback((name: string, touched: boolean = true) => {
    setFormState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [name]: touched
      }
    }))

    if (touched && validateOnBlur) {
      const error = validateField(name, formState.values[name as keyof T])
      if (error !== formState.errors[name]) {
        setError(name, error)
      }
    }
  }, [formState.values, formState.errors, validateField, validateOnBlur, setError])

  const reset = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isValid: true,
      isSubmitting: false,
      isDirty: false
    })
  }, [initialValues])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!onSubmit) return

    // Mark all fields as touched
    const allTouched = fields.reduce((acc, field) => ({
      ...acc,
      [field.name]: true
    }), {})

    setFormState(prev => ({
      ...prev,
      touched: allTouched,
      isSubmitting: true
    }))

    // Validate entire form
    const isValid = validateForm()

    if (!isValid) {
      setFormState(prev => ({ ...prev, isSubmitting: false }))
      
      if (showToasts) {
        toast.error('Please fix the errors before submitting')
      }

      // Focus first error field
      const firstErrorField = fields.find(field => 
        formState.errors[field.name]
      )
      if (firstErrorField) {
        const element = fieldsRef.current[firstErrorField.name]
        element?.focus()
      }
      
      return
    }

    try {
      await onSubmit(formState.values)
      
      if (resetOnSubmit) {
        reset()
      }

      if (showToasts) {
        toast.success('Form submitted successfully')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submission failed'
      
      if (showToasts) {
        toast.error(message)
      }
      
      console.error('Form submission error:', error)
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }))
    }
  }, [onSubmit, fields, formState.values, formState.errors, validateForm, showToasts, resetOnSubmit, reset])

  // Register field ref for focus management
  const registerField = useCallback((name: string, element: HTMLElement | null) => {
    if (element) {
      fieldsRef.current[name] = element
    } else {
      delete fieldsRef.current[name]
    }
  }, [])

  // Helper functions
  const getFieldProps = useCallback((name: string) => ({
    name,
    value: formState.values[name as keyof T] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValue(name, e.target.value)
    },
    onBlur: () => setTouched(name, true),
    onFocus: () => clearError(name),
    ref: (el: HTMLElement | null) => registerField(name, el),
    'aria-invalid': !!formState.errors[name],
    'aria-describedby': formState.errors[name] ? `${name}-error` : undefined
  }), [formState.values, formState.errors, setValue, setTouched, clearError, registerField])

  const getFieldError = useCallback((name: string) => {
    return formState.touched[name] ? formState.errors[name] : ''
  }, [formState.touched, formState.errors])

  const hasFieldError = useCallback((name: string) => {
    return !!getFieldError(name)
  }, [getFieldError])

  return {
    // State
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    isDirty: formState.isDirty,

    // Actions
    setValue,
    setError,
    clearError,
    setTouched,
    reset,
    validateForm,
    handleSubmit,

    // Helpers
    getFieldProps,
    getFieldError,
    hasFieldError,
    registerField,

    // Refs
    formRef
  }
}