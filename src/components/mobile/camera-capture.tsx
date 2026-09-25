'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCamera, useImagePicker, type CameraCapture } from '@/hooks/use-camera'
import { Camera, X, RotateCcw, Image, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface CameraCaptureProps {
  onCapture?: (captures: File[]) => void
  maxPhotos?: number
  showPreview?: boolean
  className?: string
}

export function CameraCaptureComponent({ 
  onCapture, 
  maxPhotos = 5, 
  showPreview = true,
  className 
}: CameraCaptureProps) {
  const [captures, setCaptures] = useState<CameraCapture[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const {
    videoRef,
    isActive,
    isSupported,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    checkSupport
  } = useCamera()
  
  const {
    selectFromGallery,
    convertFileToDataUrl,
    compressImage,
    createHiddenInput
  } = useImagePicker()

  useEffect(() => {
    checkSupport()
    createHiddenInput()
  }, [checkSupport, createHiddenInput])

  useEffect(() => {
    if (onCapture) {
      onCapture(captures.map(c => c.file))
    }
  }, [captures, onCapture])

  const handleOpenCamera = async () => {
    if (!isSupported) {
      toast.error('Camera not supported on this device')
      return
    }

    try {
      await startCamera()
      setIsOpen(true)
    } catch (error) {
      console.error('Failed to start camera:', error)
      toast.error('Failed to access camera')
    }
  }

  const handleCloseCamera = () => {
    stopCamera()
    setIsOpen(false)
  }

  const handleCapture = async () => {
    if (captures.length >= maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    try {
      const capture = await capturePhoto()
      if (capture) {
        setCaptures(prev => [...prev, capture])
        toast.success('Photo captured!')
      }
    } catch (error) {
      console.error('Failed to capture photo:', error)
      toast.error('Failed to take photo')
    }
  }

  const handleSelectFromGallery = async () => {
    if (captures.length >= maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    try {
      const file = await selectFromGallery()
      if (file) {
        const compressedFile = await compressImage(file)
        const dataUrl = await convertFileToDataUrl(compressedFile)
        
        const capture: CameraCapture = {
          blob: compressedFile,
          dataUrl,
          file: compressedFile
        }
        
        setCaptures(prev => [...prev, capture])
        toast.success('Photo added from gallery!')
      }
    } catch (error) {
      console.error('Failed to select from gallery:', error)
      toast.error('Failed to select photo')
    }
  }

  const handleRemoveCapture = (index: number) => {
    setCaptures(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    setCaptures([])
  }

  if (isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Camera Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <Button
                onClick={handleCloseCamera}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>

              <div className="flex gap-4">
                <Button
                  onClick={handleSelectFromGallery}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <Image className="h-6 w-6" />
                </Button>

                <Button
                  onClick={handleCapture}
                  size="lg"
                  className="h-16 w-16 rounded-full bg-white hover:bg-gray-100"
                  disabled={!isActive}
                >
                  <Camera className="h-8 w-8 text-black" />
                </Button>

                <Button
                  onClick={switchCamera}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="h-6 w-6" />
                </Button>
              </div>

              <div className="w-10">
                {captures.length > 0 && (
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {captures.length}/{maxPhotos}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleOpenCamera}
            variant="outline"
            className="flex-1"
            disabled={!isSupported || captures.length >= maxPhotos}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          
          <Button
            onClick={handleSelectFromGallery}
            variant="outline"
            className="flex-1"
            disabled={captures.length >= maxPhotos}
          >
            <Image className="h-4 w-4 mr-2" />
            Gallery
          </Button>
        </div>

        {/* Photo Preview Grid */}
        {showPreview && captures.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">
                  Photos ({captures.length}/{maxPhotos})
                </h3>
                {captures.length > 0 && (
                  <Button
                    onClick={handleClearAll}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {captures.map((capture, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={capture.dataUrl}
                      alt={`Capture ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      onClick={() => handleRemoveCapture(index)}
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!isSupported && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Camera not supported on this device. You can still select photos from your gallery.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}