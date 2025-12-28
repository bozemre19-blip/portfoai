/**
 * FamilyMediaUpload Component
 * Modal for families to upload photos/videos of their child
 */
import React, { useState, useRef } from 'react';
import { addFamilyMedia, validateMediaFile, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from '../services/api';

interface FamilyMediaUploadProps {
    childId: string;
    childName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const FamilyMediaUpload: React.FC<FamilyMediaUploadProps> = ({
    childId,
    childName,
    onClose,
    onSuccess
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file
        const validation = validateMediaFile(selectedFile);
        if (!validation.valid) {
            setError(validation.error || 'Dosya geçersiz.');
            return;
        }

        setError(null);
        setFile(selectedFile);
        setName(selectedFile.name.split('.')[0]);

        // Create preview
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Lütfen bir dosya seçin.');
            return;
        }
        if (!name.trim()) {
            setError('Lütfen bir isim girin.');
            return;
        }

        setUploading(true);
        setError(null);
        setProgress(10);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            await addFamilyMedia(childId, file, {
                name: name.trim(),
                description: description.trim() || undefined
            });

            clearInterval(progressInterval);
            setProgress(100);

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 500);
        } catch (err: any) {
            console.error('Error uploading media:', err);
            setError(err.message || 'Yükleme sırasında hata oluştu.');
            setProgress(0);
        }
        setUploading(false);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isVideo = file?.type.startsWith('video/');

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="text-xl">📷</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Fotoğraf/Video Ekle</h2>
                                <p className="text-purple-100 text-sm">{childName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* File Input */}
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {!file ? (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                            >
                                <span className="text-4xl">📷</span>
                                <div className="text-center">
                                    <p className="font-medium text-gray-700 dark:text-gray-300">
                                        Dosya Seçin
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Fotoğraf (max {MAX_IMAGE_SIZE / (1024 * 1024)}MB) veya Video (max {MAX_VIDEO_SIZE / (1024 * 1024)}MB)
                                    </p>
                                </div>
                            </button>
                        ) : (
                            <div className="relative">
                                {isVideo ? (
                                    <video
                                        src={preview || undefined}
                                        className="w-full h-40 object-cover rounded-xl"
                                        controls
                                    />
                                ) : (
                                    <img
                                        src={preview || undefined}
                                        alt="Preview"
                                        className="w-full h-40 object-cover rounded-xl"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFile(null);
                                        setPreview(null);
                                        setName('');
                                    }}
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                                >
                                    ✕
                                </button>
                                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    {formatFileSize(file.size)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            İsim *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Örn: Park Gezisi"
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {/* Description Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Açıklama (Opsiyonel)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Bu fotoğraf/video hakkında kısa bir açıklama..."
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            rows={2}
                        />
                    </div>

                    {/* Progress Bar */}
                    {uploading && (
                        <div className="space-y-2">
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                Yükleniyor... {progress}%
                            </p>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !file || !name.trim()}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Yükleniyor...
                                </>
                            ) : (
                                <>
                                    <span>⬆️</span>
                                    Yükle
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FamilyMediaUpload;
