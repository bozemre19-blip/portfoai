import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, XMarkIcon, ArrowPathIcon, CheckIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

/**
 * Kamera Yakalama Komponenti
 * - Web kamerasından canlı görüntü
 * - Fotoğraf çekme
 * - Dosyadan yükleme alternatifi
 * - Önizleme ve yeniden çekme
 */
const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      
      // Mevcut stream'i durdur
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Kamera izni iste
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Kamera erişim hatası:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Kamera izni verilmedi. Lütfen tarayıcı ayarlarından kamera iznini etkinleştirin.');
      } else if (err.name === 'NotFoundError') {
        setError('Kamera bulunamadı. Lütfen cihazınıza kamera bağlayın.');
      } else {
        setError('Kamera başlatılamadı. Lütfen dosyadan yükleme seçeneğini kullanın.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Canvas boyutlarını video boyutlarına ayarla
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Video frame'ini canvas'a çiz
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Canvas'ı base64 string'e çevir
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya türü kontrolü
    if (!file.type.startsWith('image/')) {
      setError('Lütfen geçerli bir resim dosyası seçin.');
      return;
    }

    // Dosya boyutu kontrolü (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Dosya boyutu çok büyük. Maksimum 10MB olmalıdır.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCapturedImage(imageData);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CameraIcon className="h-6 w-6" />
            Fotoğraf Çek
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
              <p className="font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* Camera View or Captured Image */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {capturedImage ? (
              // Captured Image Preview
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            ) : (
              // Live Camera Feed
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {hasPermission === false && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white p-6">
                      <CameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Kamera Erişimi Gerekli</p>
                      <p className="text-sm opacity-75">Lütfen dosyadan yükleme yapın</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {capturedImage ? (
              // Captured Image Controls
              <>
                <button
                  onClick={retakePhoto}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-all"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Yeniden Çek
                </button>
                <button
                  onClick={confirmPhoto}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium shadow-lg transition-all"
                >
                  <CheckIcon className="h-5 w-5" />
                  Kullan
                </button>
              </>
            ) : (
              // Camera Controls
              <>
                {/* File Upload Option */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200 rounded-lg font-medium transition-all"
                >
                  <PhotoIcon className="h-5 w-5" />
                  Dosyadan Yükle
                </button>

                {/* Capture Button */}
                {hasPermission && (
                  <>
                    <button
                      onClick={capturePhoto}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg transition-all transform hover:scale-105"
                    >
                      <CameraIcon className="h-6 w-6" />
                      Fotoğraf Çek
                    </button>

                    {/* Switch Camera (for mobile) */}
                    <button
                      onClick={switchCamera}
                      className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all"
                      title="Kamerayı Değiştir"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700 text-center">
              💡 <strong>İpucu:</strong> Kameranız yoksa veya izin vermediyseniz, "Dosyadan Yükle" butonunu kullanabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;

