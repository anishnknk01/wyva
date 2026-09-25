import { useState, useRef, useCallback } from 'react';
import { useErrorHandler } from './use-error-handler';

export interface CameraCapture {
  blob: Blob;
  dataUrl: string;
  file: File;
}

export interface CameraConfig {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number;
}

export function useCamera() {
  const { handleAsyncError } = useErrorHandler();
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const checkSupport = useCallback(() => {
    const supported = !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia &&
      typeof FileReader !== 'undefined'
    );
    setIsSupported(supported);
    return supported;
  }, []);

  const startCamera = useCallback(async (config: CameraConfig = {}) => {
    if (!checkSupport()) {
      throw new Error('Camera not supported on this device');
    }

    return handleAsyncError(async () => {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: config.facingMode || 'environment',
          width: config.width ? { ideal: config.width } : { ideal: 1920 },
          height: config.height ? { ideal: config.height } : { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setIsActive(true);
      return mediaStream;
    }, {
      title: 'Camera access failed',
      description: 'Please allow camera access to take photos'
    });
  }, [handleAsyncError, checkSupport]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
  }, [stream]);

  const capturePhoto = useCallback(async (config: CameraConfig = {}): Promise<CameraCapture | null> => {
    if (!videoRef.current || !isActive) {
      throw new Error('Camera not active');
    }

    return handleAsyncError(async () => {
      const video = videoRef.current!;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Canvas not supported');
      }

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to capture image'));
            }
          },
          'image/jpeg',
          config.quality || 0.9
        );
      });

      // Create data URL
      const dataUrl = canvas.toDataURL('image/jpeg', config.quality || 0.9);
      
      // Create file
      const timestamp = Date.now();
      const file = new File([blob], `photo-${timestamp}.jpg`, { type: 'image/jpeg' });

      return {
        blob,
        dataUrl,
        file,
      };
    }, {
      title: 'Photo capture failed',
      description: 'Please try taking the photo again'
    });
  }, [isActive, handleAsyncError]);

  const switchCamera = useCallback(async () => {
    if (!isActive || !stream) return;

    const currentFacingMode = stream.getVideoTracks()[0]?.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    stopCamera();
    await startCamera({ facingMode: newFacingMode });
  }, [isActive, stream, stopCamera, startCamera]);

  return {
    videoRef,
    isActive,
    isSupported,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    checkSupport,
  };
}

// Hook for file selection (gallery/camera picker)
export function useImagePicker() {
  const { handleAsyncError } = useErrorHandler();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectFromGallery = useCallback(async (): Promise<File | null> => {
    return new Promise((resolve) => {
      if (!fileInputRef.current) {
        resolve(null);
        return;
      }

      const input = fileInputRef.current;
      input.accept = 'image/*';
      input.multiple = false;
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0] || null;
        resolve(file);
      };
      
      input.click();
    });
  }, []);

  const convertFileToDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const compressImage = useCallback(async (
    file: File, 
    maxWidth: number = 1920, 
    maxHeight: number = 1080, 
    quality: number = 0.8
  ): Promise<File> => {
    return handleAsyncError(async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        throw new Error('Canvas not supported');
      }

      return new Promise<File>((resolve, reject) => {
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          // Set canvas size
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    }, {
      title: 'Image compression failed',
      description: 'The image could not be processed'
    }) || file;
  }, [handleAsyncError]);

  const createHiddenInput = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    return fileInputRef.current;
  }, []);

  return {
    fileInputRef,
    selectFromGallery,
    convertFileToDataUrl,
    compressImage,
    createHiddenInput,
  };
}