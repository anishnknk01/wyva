"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign,
  Check,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { taskCategories, taskAreas, taskDurations, taskBudgetPresets, taskPlatformFee, type TaskCategory } from '@/lib/tasks';
import { generateTaskId, saveTask } from '@/lib/task-store';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useFormValidation, FieldConfig } from '@/hooks/use-form-validation';
import { CameraCaptureComponent } from '@/components/mobile/camera-capture';
import { LocationPicker } from '@/components/mobile/location-picker';
import type { LocationCoordinates, LocationAddress } from '@/hooks/use-location';

const steps = [
  { id: 1, title: 'What do you need?', description: 'Tell us about your task' },
  { id: 2, title: 'When & Where?', description: 'Set time and location' },
  { id: 3, title: 'Budget', description: 'Set your budget' },
  { id: 4, title: 'Review', description: 'Confirm your task' },
];

export function MobileCreateTask() {
  const router = useRouter();
  const { handleAsyncError } = useErrorHandler();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Location and photo state
  const [locationData, setLocationData] = useState<{coordinates: LocationCoordinates; address?: LocationAddress} | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // Form validation setup
  const fields: FieldConfig[] = [
    {
      name: 'title',
      rules: {
        required: 'Task title is required',
        minLength: { value: 5, message: 'Title must be at least 5 characters' },
        maxLength: { value: 100, message: 'Title cannot exceed 100 characters' }
      },
      defaultValue: ''
    },
    {
      name: 'description',
      rules: {
        required: 'Description is required',
        minLength: { value: 20, message: 'Description must be at least 20 characters' },
        maxLength: { value: 500, message: 'Description cannot exceed 500 characters' }
      },
      defaultValue: ''
    },
    {
      name: 'category',
      rules: {
        required: 'Please select a category'
      },
      defaultValue: ''
    },
    {
      name: 'area',
      rules: {
        required: 'Please select an area'
      },
      defaultValue: ''
    },
    {
      name: 'locationNote',
      defaultValue: ''
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
      defaultValue: ''
    },
    {
      name: 'time',
      rules: {
        required: 'Task time is required'
      },
      defaultValue: ''
    },
    {
      name: 'durationId',
      rules: {
        required: 'Please select duration'
      },
      defaultValue: ''
    },
    {
      name: 'budget',
      rules: {
        required: 'Budget is required',
        min: { value: 50, message: 'Budget must be at least ₹50' },
        max: { value: 10000, message: 'Budget cannot exceed ₹10,000' },
        custom: {
          validate: (value) => {
            const num = Number(value)
            return !isNaN(num) && num > 0 && num % 1 === 0
          },
          message: 'Budget must be a positive whole number'
        }
      },
      defaultValue: '',
      transform: (value) => value ? Number(value) : ''
    }
  ];

  const {
    values,
    errors,
    isValid,
    isSubmitting,
    getFieldProps,
    getFieldError,
    hasFieldError,
    setValue,
    validateForm
  } = useFormValidation({
    fields,
    validateOnChange: true,
    validateOnBlur: true,
    showToasts: false
  });
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [durationId, setDurationId] = useState('2');
  const [customHours, setCustomHours] = useState(2);
  const [budget, setBudget] = useState(500);
  const [photos, setPhotos] = useState<File[]>([]);

  const total = budget + taskPlatformFee;

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 1:
        return values.title?.trim() && 
               values.description?.trim() && 
               values.category && 
               values.area &&
               !getFieldError('title') &&
               !getFieldError('description') &&
               !getFieldError('category') &&
               !getFieldError('area');
      case 2:
        return values.date && 
               values.time &&
               !getFieldError('date') &&
               !getFieldError('time');
      case 3:
        return values.budget > 0 && !getFieldError('budget');
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceedFromStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    await handleAsyncError(async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Please log in to create a task');
      }

      const taskId = generateTaskId();
      
      // First, save the task without photos
      const saved = await saveTask({
        id: taskId,
        customerId: user.id,
        title: values.title?.trim() || '',
        description: values.description?.trim() || '',
        category: values.category || '',
        area: values.area || '',
        locationNote: values.locationNote?.trim() || '',
        locationCoordinates: locationData?.coordinates,
        date: values.date || '',
        time,
        durationId,
        customHours,
        budget,
        languages: [],
        interests: [],
        platformFee: taskPlatformFee,
        total,
        paymentMethod: null,
        razorpayOrderId: null,
        razorpayPaymentId: null,
        status: 'payment_pending',
        interestedCount: 0,
        acceptedWysaId: null,
        confirmedWysaId: null,
        dispute: null,
        userRating: null,
        wysaRating: null,
        photos: [],
      });

      if (!saved) {
        throw new Error('Failed to save task. Please try again.');
      }

      // Upload photos if any
      if (photos.length > 0) {
        try {
          const formData = new FormData();
          photos.forEach((photo) => {
            formData.append('photos', photo);
          });

          const response = await fetch(`/api/tasks/${taskId}/photos`, {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            console.warn('Photo upload failed, but task was created');
          }
        } catch (error) {
          console.warn('Photo upload failed:', error);
        }
      }

      toast.success('Task created successfully!');
      router.push(`/mobile/pay-task/${taskId}`);
    }, {
      title: 'Failed to create task',
      description: 'Please check your details and try again'
    });
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Compact Progress Bar */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <div className="mb-2.5 flex items-center justify-center gap-1.5">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  currentStep >= step.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? <Check className="h-3.5 w-3.5" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-1 h-0.5 w-8 transition-colors ${
                    currentStep > step.id ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-gray-900">{steps[currentStep - 1].title}</h3>
          <p className="text-xs text-gray-500">{steps[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {currentStep === 1 && <Step1 
          values={values}
          getFieldProps={getFieldProps}
          getFieldError={getFieldError}
          hasFieldError={hasFieldError}
          setValue={setValue}
          setPhotos={setPhotos}
        />}
        
        {currentStep === 2 && <Step2
          date={date} setDate={setDate}
          time={time} setTime={setTime}
          locationNote={locationNote} setLocationNote={setLocationNote}
          locationData={locationData} setLocationData={setLocationData}
          durationId={durationId} setDurationId={setDurationId}
          customHours={customHours} setCustomHours={setCustomHours}
        />}
        
        {currentStep === 3 && <Step3
          budget={budget} setBudget={setBudget}
        />}
        
        {currentStep === 4 && <Step4
          title={values.title || ''}
          description={values.description || ''}
          category={values.category || ''}
          area={values.area || ''}
          locationNote={locationNote}
          date={date}
          time={time}
          budget={budget}
          total={total}
        />}
      </div>

      {/* Bottom Actions - Compact */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
            className="h-11 flex-1 font-medium"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceedFromStep(currentStep) || loading}
            className="h-11 flex-1 bg-teal-600 font-medium hover:bg-teal-700"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                {currentStep === 4 ? 'Post Task' : 'Next'}
                {!loading && currentStep < 4 && <ChevronRight className="ml-1 h-4 w-4" />}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Step Components with Enhanced Validation
function Step1({ 
  values, 
  getFieldProps, 
  getFieldError, 
  hasFieldError, 
  setValue, 
  setPhotos 
}: any) {
  return (
    <div className="space-y-6 pb-4">
      {/* Clear section heading */}
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">What do you need help with?</h2>
        <p className="text-sm text-gray-500">Tell us the basics so Wysas can find your task</p>
      </div>

      <div>
        <Label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
          Task title *
        </Label>
        <Input
          id="title"
          placeholder="e.g., Need company for a movie, Help with shopping..."
          className="h-11"
          error={getFieldError('title')}
          success={values.title && !hasFieldError('title')}
          {...getFieldProps('title')}
        />
        {getFieldError('title') && (
          <p className="mt-1.5 text-xs text-red-600">{getFieldError('title')}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
          Description *
        </Label>
        <Textarea
          id="description"
          placeholder="Provide details about what you need... (e.g., timing preferences, specific requirements)"
          rows={4}
          error={getFieldError('description')}
          success={values.description && !hasFieldError('description')}
          showCount
          maxLength={500}
          {...getFieldProps('description')}
        />
        {getFieldError('description') && (
          <p className="mt-1.5 text-xs text-red-600">{getFieldError('description')}</p>
        )}
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium text-gray-700">
          Category *
        </Label>
        {getFieldError('category') && (
          <p className="mb-2 text-xs text-red-600">⚠️ {getFieldError('category')}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {taskCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setValue('category', cat)}
              className={`group relative overflow-hidden rounded-lg border-2 p-3 text-left transition-all ${
                values.category === cat
                  ? 'border-teal-600 bg-teal-50'
                  : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50'
              }`}
            >
              <span className={`block text-sm font-medium ${
                values.category === cat ? 'text-teal-900' : 'text-gray-900'
              }`}>
                {cat}
              </span>
              {values.category === cat && (
                <div className="absolute right-2 top-2">
                  <Check className="h-4 w-4 text-teal-600" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium text-gray-700">
          Area *
        </Label>
        {getFieldError('area') && (
          <p className="mb-2 text-xs text-red-600">⚠️ {getFieldError('area')}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {taskAreas.map((areaOption) => (
            <button
              key={areaOption}
              type="button"
              onClick={() => setValue('area', areaOption)}
              className={`group relative overflow-hidden rounded-lg border-2 p-3 text-left transition-all ${
                values.area === areaOption
                  ? 'border-teal-600 bg-teal-50'
                  : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50'
              }`}
            >
              <span className={`block text-sm font-medium ${
                values.area === areaOption ? 'text-teal-900' : 'text-gray-900'
              }`}>
                {areaOption}
              </span>
              {values.area === areaOption && (
                <div className="absolute right-2 top-2">
                  <Check className="h-4 w-4 text-teal-600" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium text-gray-700">
          Add photos (optional)
        </Label>
        <CameraCaptureComponent 
          onCapture={setPhotos}
          maxPhotos={3}
          showPreview={true}
        />
      </div>
    </div>
  );
}

function Step2({ date, setDate, time, setTime, locationNote, setLocationNote, locationData, setLocationData, durationId, setDurationId, customHours, setCustomHours }: any) {
  return (
    <div className="space-y-6 pb-4">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">When & Where?</h2>
        <p className="text-sm text-gray-500">Set the date, time, and location for your task</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date" className="mb-2 block text-sm font-medium text-gray-700">
            Date *
          </Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="time" className="mb-2 block text-sm font-medium text-gray-700">
            Time *
          </Label>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium text-gray-700">Duration *</Label>
        <div className="grid grid-cols-3 gap-2">
          {taskDurations.map((duration) => (
            <button
              key={duration.id}
              type="button"
              onClick={() => setDurationId(duration.id)}
              className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                durationId === duration.id
                  ? 'border-teal-600 bg-teal-50 text-teal-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-gray-50'
              }`}
            >
              {duration.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium text-gray-700">
          Location
        </Label>
        <LocationPicker
          onLocationSelect={setLocationData}
          onAddressChange={setLocationNote}
          initialAddress={locationNote}
          placeholder="Enter task location or landmark"
          showCurrentLocation={true}
        />
      </div>
    </div>
  );
}

function Step3({ budget, setBudget }: any) {
  return (
    <div className="space-y-6 pb-4">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Set your budget</h2>
        <p className="text-sm text-gray-500">Choose a budget that matches your task</p>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium text-gray-700">
          Quick presets
        </Label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {taskBudgetPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setBudget(preset)}
              className={`rounded-lg border-2 px-3 py-3 text-center font-semibold transition-all ${
                budget === preset
                  ? 'border-teal-600 bg-teal-50 text-teal-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-gray-50'
              }`}
            >
              ₹{preset}
            </button>
          ))}
        </div>
        
        <Label htmlFor="custom-budget" className="mb-2 block text-sm font-medium text-gray-700">
          Or enter custom amount
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
            ₹
          </span>
          <Input
            id="custom-budget"
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value) || 0)}
            placeholder="Enter amount (min ₹50)"
            className="h-11 pl-8"
            min={50}
            max={10000}
          />
        </div>
      </div>

      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Your budget</span>
              <span className="font-medium">₹{budget}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform fee</span>
              <span className="font-medium">₹{taskPlatformFee}</span>
            </div>
            <div className="border-t border-gray-300 pt-2.5 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="text-teal-700">₹{budget + taskPlatformFee}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-50 p-3.5">
        <p className="text-xs text-blue-800 leading-relaxed">
          <span className="font-medium">💡 Tip:</span> Your budget is what the Wysa receives. The platform fee covers payment processing, safety features, and support.
        </p>
      </div>
    </div>
  );
}

function Step4({ title, description, category, area, locationNote, date, time, budget, total }: any) {
  return (
    <div className="space-y-5 pb-4">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Review your task</h2>
        <p className="text-sm text-gray-500">Check everything looks good before posting</p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-4">
          <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
          <p className="mb-4 text-sm leading-relaxed text-gray-600">{description}</p>
          
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                {category}
              </Badge>
              <Badge variant="outline" className="text-gray-700">
                {area}
              </Badge>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {time}
            </div>
            
            {locationNote && (
              <div className="flex items-start text-gray-600">
                <MapPin className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span className="line-clamp-2">{locationNote}</span>
              </div>
            )}
            
            <div className="flex items-center font-medium text-gray-900">
              <DollarSign className="mr-2 h-4 w-4 text-gray-400" />
              ₹{budget} <span className="ml-1.5 text-xs font-normal text-gray-500">(Total: ₹{total})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-green-50 p-3.5">
        <p className="text-xs leading-relaxed text-green-800">
          <span className="font-medium">✅ Ready to post!</span> Your task will go live once payment is confirmed. You'll be able to review interested Wysas and confirm one for your task.
        </p>
      </div>
    </div>
  );
}