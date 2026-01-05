import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { X, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropModal({ imageSrc, onCropComplete, onCancel, isOpen }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Use ref to track if save is in progress (prevents rapid double-clicks)
  const isSavingRef = useRef(false);

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback(
    (croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return null;

    try {
      const image = new Image();
      image.src = imageSrc;

      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const base64data = await new Promise<string>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Blob failed'));
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => resolve(reader.result as string);
        }, 'image/jpeg', 0.95);
      });

      return base64data;
    } catch (error) {
      console.error('Error creating cropped image:', error);
      return null;
    }
  };

  const handleApply = async () => {
    // Block if already saving (prevents double-click during save)
    if (isSavingRef.current || isSaving) {
      console.log('Save already in progress, blocking click');
      return;
    }

    // Set locks to prevent multiple clicks
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      // Create the cropped image
      const croppedImage = await createCroppedImage();
      
      if (croppedImage) {
        // Reset locks BEFORE calling onCropComplete to remove UI delay
        isSavingRef.current = false;
        setIsSaving(false);
        
        // Call the completion callback (this might close the modal)
        onCropComplete(croppedImage);
      } else {
        // If crop failed, reset locks
        isSavingRef.current = false;
        setIsSaving(false);
      }
    } catch (error) {
      console.error('Error during save:', error);
      // Reset locks on error
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  // Move the early return AFTER all hooks are called
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pink-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Crop Profile Picture</h2>
            <p className="text-sm text-gray-500">Adjust the image to your liking</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-full hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Crop Area */}
        <div className="relative flex-1 bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
          />
        </div>

        {/* Controls */}
        <div className="p-6 space-y-4 border-t border-pink-100 bg-gradient-to-b from-white to-pink-50/30">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ZoomIn className="w-4 h-4 text-pink-500" />
                Zoom Level
              </label>
              <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-gray-400" />
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
                disabled={isSaving}
              />
              <ZoomIn className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Instructions */}
          <div className="flex items-start gap-2 p-3 bg-pink-50 rounded-lg border border-pink-100">
            <Move className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-pink-600">Tip:</span> Drag the image to reposition, 
              or use the zoom slider to adjust the size
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              className="px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={isSaving}
              className="px-6 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isSaving && (
                <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              )}
              {isSaving ? 'Saving...' : 'Apply & Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}