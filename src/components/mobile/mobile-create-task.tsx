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
      {/* Progress Bar */}
      <div className="px-4 py-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h3 className="font-medium text-gray-900">{steps[currentStep - 1].title}</h3>
          <p className="text-sm text-gray-600">{steps[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4">
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

      {/* Bottom Actions */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceedFromStep(currentStep) || loading}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating task...
              </>
            ) : (
              currentStep === 4 ? 'Post Task' : 'Next'
            )}
            {!loading && currentStep < 4 && <ChevronRight className="w-4 h-4 ml-2" />}
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
    <div className="space-y-6">
      <div>
        <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">
          What help do you need? *
        </Label>
        <Input
          id="title"
          placeholder="e.g. Help me move furniture"
          className="h-12"
          error={getFieldError('title')}
          success={values.title && !hasFieldError('title')}
          helperText="Be specific about what you need help with"
          {...getFieldProps('title')}
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
          Describe the task *
        </Label>
        <Textarea
          id="description"
          placeholder="Provide more details about what you need help with..."
          rows={4}
          error={getFieldError('description')}
          success={values.description && !hasFieldError('description')}
          helperText="Include any specific requirements or preferences"
          showCount
          maxLength={500}
          {...getFieldProps('description')}
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Add photos (optional)
        </Label>
        <CameraCaptureComponent 
          onCapture={setPhotos}
          maxPhotos={3}
          showPreview={true}
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Category *
        </Label>
        {getFieldError('category') && (
          <p className="text-sm text-red-600 mb-2 flex items-center gap-1">
            <span>⚠️</span>
            {getFieldError('category')}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {taskCategories.slice(0, 8).map((cat) => (
            <Button
              key={cat}
              type="button"
              variant={values.category === cat ? "default" : "outline"}
              className={`h-auto p-3 text-left ${
                values.category === cat ? 'bg-teal-600 hover:bg-teal-700' : ''
              }`}
              onClick={() => setValue('category', cat)}
            >
              <span className="text-sm">{cat}</span>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Area *
        </Label>
        {getFieldError('area') && (
          <p className="text-sm text-red-600 mb-2 flex items-center gap-1">
            <span>⚠️</span>
            {getFieldError('area')}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {taskAreas.slice(0, 6).map((areaOption) => (
            <Button
              key={areaOption}
              type="button"
              variant={values.area === areaOption ? "default" : "outline"}
              className={`h-auto p-3 text-left ${
                values.area === areaOption ? 'bg-teal-600 hover:bg-teal-700' : ''
              }`}
              onClick={() => setValue('area', areaOption)}
            >
              <span className="text-sm">{areaOption}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ date, setDate, time, setTime, locationNote, setLocationNote, locationData, setLocationData, durationId, setDurationId, customHours, setCustomHours }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-2 block">
            Date
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="time" className="text-sm font-medium text-gray-700 mb-2 block">
            Time
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-12 pl-10"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">Duration</Label>
        <div className="grid grid-cols-2 gap-2">
          {taskDurations.map((duration) => (
            <Button
              key={duration.id}
              variant={durationId === duration.id ? "default" : "outline"}
              className={`h-auto p-3 ${
                durationId === duration.id ? 'bg-teal-600 hover:bg-teal-700' : ''
              }`}
              onClick={() => setDurationId(duration.id)}
            >
              {duration.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Location
        </Label>
        <LocationPicker
          onLocationSelect={setLocationData}
          onAddressChange={setLocationNote}
          initialAddress={locationNote}
          placeholder="Enter task location"
          showCurrentLocation={true}
        />
      </div>
    </div>
  );
}

function Step3({ budget, setBudget }: any) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Set your budget
        </Label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {taskBudgetPresets.map((preset) => (
            <Button
              key={preset}
              variant={budget === preset ? "default" : "outline"}
              className={`h-auto p-4 ${
                budget === preset ? 'bg-teal-600 hover:bg-teal-700' : ''
              }`}
              onClick={() => setBudget(preset)}
            >
              ₹{preset}
            </Button>
          ))}
        </div>
        
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value) || 0)}
            placeholder="Enter custom amount"
            className="h-12 pl-10"
          />
        </div>
      </div>

      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Your budget</span>
              <span>₹{budget}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform fee</span>
              <span>₹{taskPlatformFee}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
              <span>Total</span>
              <span>₹{budget + taskPlatformFee}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 Your budget is what the helper will receive. The platform fee covers payment processing and safety features.
        </p>
      </div>
    </div>
  );
}

function Step4({ title, description, category, area, locationNote, date, time, budget, total }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-4">{description}</p>
          
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Badge variant="outline" className="mr-2">{category}</Badge>
              <span className="text-gray-600">{area}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(date).toLocaleDateString()} at {time}
            </div>
            
            {locationNote && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {locationNote}
              </div>
            )}
            
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="h-4 w-4 mr-2" />
              ₹{budget} (Total: ₹{total})
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-800">
          ✅ Your task looks great! After posting, you'll be taken to payment where you can pay securely. Your task will go live once payment is confirmed.
        </p>
      </div>
    </div>
  );
}