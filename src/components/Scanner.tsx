import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Upload, X, FlipHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { useAudio } from '../services/audioService';
import { Camera as CapCamera } from '@capacitor/camera';

interface ScannerProps {
  onScan: (imageData: string) => void;
  isProcessing: boolean;
  onClose?: () => void;
}

export function Scanner({ onScan, isProcessing, onClose }: ScannerProps) {
  const { playSFX } = useAudio();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // front cam by default

  const stopCurrentStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async (facing: 'user' | 'environment' = 'user') => {
    setIsStarting(true);
    setError(null);
    stopCurrentStream();

    try {
      // Ask Capacitor for native camera permission (Android dialog)
      try {
        const permStatus = await CapCamera.requestPermissions({ permissions: ['camera'] });
        if (permStatus.camera === 'denied') {
          setError('permission');
          setIsStarting(false);
          return;
        }
      } catch (permErr) {
        // Running in browser (not native) — skip
        console.warn('Capacitor permission skipped (web mode):', permErr);
      }

      // Try requested facing mode
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
          setError(null);
          setIsStarting(false);
          return;
        }
      } catch (facingErr) {
        console.warn(`Camera facing "${facing}" failed, trying fallback...`, facingErr);
      }

      // Fallback: any camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        setError(null);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      const errorName = err?.name || '';
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setError('permission');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setError('notfound');
      } else {
        setError('generic');
      }
    }
    setIsStarting(false);
  }, [stopCurrentStream]);

  const flipCamera = useCallback(() => {
    playSFX('CLICK');
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    setStreamActive(false);
    startCamera(newFacing);
  }, [facingMode, startCamera, playSFX]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      playSFX('CLICK');
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        onScan(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror horizontally if front cam (user-facing)
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = dataUrl.split(',')[1];
        playSFX('SCAN');
        onScan(base64Data);
        stopCurrentStream();
        setStreamActive(false);
      }
    }
  }, [onScan, stopCurrentStream, playSFX, facingMode]);

  React.useEffect(() => {
    startCamera('user');
    return () => {
      stopCurrentStream();
      setStreamActive(false);
    };
  }, []);

  const errorMessages: Record<string, { title: string; desc: string }> = {
    permission: {
      title: 'Permission Denied',
      desc: 'Camera access blocked. Go to Settings > Apps > NanoVerse > Permissions and enable the camera.',
    },
    notfound: {
      title: 'Camera Not Found',
      desc: 'No camera detected on this device.',
    },
    generic: {
      title: 'Optical Sensor Failure',
      desc: 'Unable to access camera. Please try again or upload an image.',
    },
  };

  const currentError = error ? errorMessages[error] || errorMessages.generic : null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden">

      {/* HUD Overlay */}
      {!error && streamActive && (
        <div className="absolute inset-0 pointer-events-none z-10 border-[1px] border-cyan-500/30 m-4">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400" />
          <motion.div
            className="absolute left-0 right-0 h-[2px] bg-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Camera label */}
      {streamActive && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-black/60 border border-cyan-500/40 text-cyan-400 font-mono text-xs tracking-widest">
          {facingMode === 'user' ? '◉ FRONT CAM' : '◉ BACK CAM'}
        </div>
      )}

      {/* Camera Video — mirrored when front cam */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${error ? 'hidden' : 'block'} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
      />

      <canvas ref={canvasRef} className="hidden" />

      {/* Starting state - black bg, not grey */}
      {isStarting && !error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
          <div className="w-14 h-14 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-yellow-400 font-marker text-lg tracking-widest uppercase animate-pulse">SENSOR POWERING UP...</span>
          <span className="text-zinc-500 font-mono text-xs mt-2">Waiting for camera activation</span>
        </div>
      )}

      {/* Error State */}
      {error && currentError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
          <div className="w-20 h-20 bg-red-600 border-4 border-black flex items-center justify-center mb-4 shadow-[4px_4px_0_#000] rotate-2">
            <span className="text-4xl">⚠️</span>
          </div>
          <h3 className="text-xl font-marker text-white mb-2 uppercase">{currentError.title}</h3>
          <p className="text-zinc-400 text-sm mb-8 max-w-xs leading-relaxed">{currentError.desc}</p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => startCamera(facingMode)}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border-2 border-white text-white font-black uppercase text-sm shadow-[4px_4px_0_#000] flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <label className="w-full py-3 bg-yellow-400 text-black font-black uppercase text-sm border-2 border-black cursor-pointer shadow-[4px_4px_0_#000] flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
              <Upload className="w-4 h-4" />
              Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-black uppercase text-sm border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                <X className="w-4 h-4" />
                Close Scanner
              </button>
            )}
          </div>
        </div>
      )}

      {/* Controls bar */}
      {!isProcessing && streamActive && (
        <div className="absolute bottom-8 z-20 flex items-center gap-6">
          {/* Upload */}
          <label className="p-3 bg-zinc-800/80 border-2 border-white/20 text-white hover:bg-zinc-700 transition-colors cursor-pointer active:scale-95">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <Upload className="w-5 h-5" />
          </label>

          {/* Capture */}
          <button
            onClick={capture}
            className="group relative flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md border-4 border-white/60 hover:bg-white/20 transition-all active:scale-90"
          >
            <div className="w-14 h-14 bg-cyan-500/30 group-hover:bg-cyan-400/50 transition-colors flex items-center justify-center">
              <Camera className="w-7 h-7 text-white" />
            </div>
          </button>

          {/* Flip camera */}
          <motion.button
            onClick={flipCamera}
            whileTap={{ rotate: 180, scale: 0.9 }}
            className="p-3 bg-zinc-800/80 border-2 border-cyan-500/40 text-cyan-400 hover:bg-zinc-700 transition-colors cursor-pointer active:scale-95"
          >
            <FlipHorizontal className="w-5 h-5" />
          </motion.button>
        </div>
      )}

      {isProcessing && (
        <div className="absolute bottom-8 z-20 flex flex-col items-center gap-2">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <span className="text-cyan-400 font-mono text-xs animate-pulse">PROCESSING...</span>
        </div>
      )}
    </div>
  );
}
