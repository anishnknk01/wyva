'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, ZoomIn } from 'lucide-react'

interface PhotoGalleryProps {
  photos: string[]
  className?: string
  maxPreview?: number
}

export function PhotoGallery({ photos, className, maxPreview = 4 }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  if (!photos || photos.length === 0) {
    return null
  }

  const visiblePhotos = showAll ? photos : photos.slice(0, maxPreview)
  const remainingCount = photos.length - maxPreview

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-2">
        {visiblePhotos.map((photo, index) => (
          <div key={index} className="relative aspect-square group">
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedPhoto(photo)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
        
        {!showAll && remainingCount > 0 && (
          <Button
            onClick={() => setShowAll(true)}
            variant="outline"
            className="aspect-square flex flex-col items-center justify-center text-sm"
          >
            <span className="font-semibold">+{remainingCount}</span>
            <span>more</span>
          </Button>
        )}
      </div>

      {showAll && remainingCount > 0 && (
        <Button
          onClick={() => setShowAll(false)}
          variant="ghost"
          className="w-full mt-2 text-sm"
        >
          Show less
        </Button>
      )}

      {/* Photo Modal - Simple full screen overlay */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <Button
            onClick={() => setSelectedPhoto(null)}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <img
            src={selectedPhoto}
            alt="Full size photo"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}