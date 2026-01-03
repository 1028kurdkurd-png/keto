
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Upload, X, Trash2, Check, Image as ImageIcon, Loader, Crop as CropIcon } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { dbService, StoredImage } from '../../services/db';
import { TranslationStrings } from '../../types';
import { convertToWebP } from '../../utils/imageOptimization';

interface MediaLibraryProps {
    onSelect?: (_image: StoredImage) => void;
    onClose?: () => void;
    className?: string;
    isModal?: boolean;
    t?: TranslationStrings;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ onSelect, onClose, className = '', isModal = false, t }) => {
    const [images, setImages] = useState<StoredImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cropper State
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [cropFileName, setCropFileName] = useState("image.jpg");

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            const imgs = await dbService.getAllImages();
            setImages(imgs);
        } catch (error) {
            console.error('Failed to load images', error);
            alert(t?.uploadFailed || 'Failed to load images');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0) return;
        if (files.length > 10) {
            alert(t?.uploadFailed ? `${t.uploadFailed} - Max 10 files allowed` : 'Please select up to 10 images at once');
            e.target.value = '';
            return;
        }

        setUploading(true);
        try {
            for (const file of files) {
                // Validate size (keep under 1MB) - simple check, if larger we'll still try
                if (file.size > 2000000) {
                    console.warn('Large file detected, consider compressing before upload', file.name);
                }

                // Compress/Convert to WebP
                let processedFile = file;
                try {
                    processedFile = await convertToWebP(file);
                    console.log(`Converted ${file.name} to WebP:`, processedFile.name);
                } catch (err) {
                    console.warn('WebP conversion failed, using original', err);
                }

                const newImage = await dbService.saveImage(processedFile);
                setImages(prev => [newImage, ...prev]);
            }
        } catch (err) {
            console.error('Batch upload failed', err);
            alert(t?.uploadFailed || 'Failed to upload images');
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: any, quality = 1): Promise<Blob | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return null;
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/webp', quality);
        });
    };

    const handleSaveCrop = async () => {
        if (!cropImage || !croppedAreaPixels) return;

        try {
            setUploading(true);

            // Try high quality first
            let quality = 0.95;
            let croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels, quality);

            // Compress if too large (> 500KB approx for WebP is plenty)
            while (croppedBlob && croppedBlob.size > 500000 && quality > 0.5) {
                quality -= 0.1;
                console.log(`Image too large (${(croppedBlob.size / 1024).toFixed(0)}KB), compressing to q=${quality.toFixed(1)}...`);
                croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels, quality);
            }

            if (croppedBlob) {
                // If still too large, warn but try anyway (or fail gracefully)
                if (croppedBlob.size > 950000) {
                    console.warn("Image still large after compression:", croppedBlob.size);
                }

                // Convert Blob to File
                const fileName = cropFileName.replace(/\.[^/.]+$/, "") + ".webp";
                const file = new File([croppedBlob], fileName, { type: 'image/webp' });

                const blobToBase64 = (b: Blob) => new Promise<string>((resolve, reject) => {
                    const r = new FileReader();
                    r.onload = () => resolve(r.result as string);
                    r.onerror = () => reject(r.error);
                    r.readAsDataURL(b);
                });

                if (editingImageId) {
                    // Update existing image
                    await dbService.updateImage(editingImageId, file);
                    const base64 = await blobToBase64(croppedBlob as Blob);
                    // Refresh the images list entry with the new base64 data
                    setImages(prev => prev.map(img => img.id === editingImageId ? { ...img, data: base64, name: file.name } as StoredImage : img));
                } else {
                    // Save as new
                    const newImage = await dbService.saveImage(file);
                    setImages(prev => [newImage, ...prev]);
                }

                // Close Cropper
                setCropImage(null);
                setEditingImageId(null);
                setZoom(1);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to crop/save image");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm(t?.deleteConfirm || 'Are you sure you want to delete this image?')) return;

        try {
            await dbService.deleteImage(id);
            setImages(prev => prev.filter(img => img.id !== id));
        } catch (error) {
            console.error('Delete failed', error);
            alert(t?.deleteFailed || 'Delete failed');
        }
    };

    // If Cropping, render Crop UI
    if (cropImage) {
        return (
            <div className={`flex flex-col h-full bg-white relative ${className} ${isModal ? 'p-6' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-[#231f20] flex items-center gap-2">
                        <CropIcon className="text-[#c68a53]" /> Crop Image
                    </h3>
                    <button onClick={() => setCropImage(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="relative flex-1 bg-black rounded-2xl overflow-hidden min-h-[300px]">
                    <Cropper
                        image={cropImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1} // Force Square
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                </div>

                <div className="mt-4 flex flex-col gap-4">
                    <div className="flex items-center gap-4 px-2">
                        <span className="text-xs font-bold text-gray-400">Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#c68a53]"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setCropImage(null)}
                            className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-500 hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveCrop}
                            disabled={uploading}
                            className="flex-1 py-3 rounded-xl font-bold bg-[#231f20] text-[#c68a53] hover:bg-black flex items-center justify-center gap-2"
                        >
                            {uploading ? <Loader className="animate-spin" /> : <Check />}
                            Save & Use
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex flex-col h-full ${className} ${isModal ? 'p-6' : ''} card`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[#231f20] flex items-center gap-3">
                    <ImageIcon className="text-[#c68a53]" /> {t?.mediaLibrary || "Media Library"}
                </h3>
                <div className="flex gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 btn-primary px-4 py-2 font-bold"
                            disabled={uploading}
                        >
                            {uploading ? <Loader className="animate-spin" size={18} /> : <Upload size={18} />}
                            {t?.uploadNew || "Upload New"}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                            multiple
                        />

                        <button
                            onClick={async () => {
                                if (selectedIds.size === 0) return alert(t?.noImages || "No images selected");
                                if (!confirm(t?.deleteConfirm || "Delete selected images?")) return;
                                // Bulk delete
                                for (const id of Array.from(selectedIds)) {
                                    await dbService.deleteImage(id);
                                }
                                setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
                                setSelectedIds(new Set());
                            }}
                            className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors"
                        >
                            <Trash2 size={18} /> {t?.deleteConfirm || "Delete Selected"}
                        </button>

                        {isModal && onClose && (
                            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px] bg-gray-50 rounded-2xl p-4 border border-gray-100">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">{t?.loading || "Loading library..."}</div>
                ) : images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4">
                        <ImageIcon size={48} />
                        <p className="font-bold">{t?.noImages || "No images found"}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map(img => (
                            <div
                                key={img.id}
                                onClick={() => onSelect?.(img)}
                                className={`group relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm border-2 border-transparent hover:border-[#c68a53] cursor-pointer transition-all ${isModal ? 'active:scale-95' : ''}`}
                            >
                                <img src={img.data} alt="Stored" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={selectedIds.has(img.id)} onChange={(e) => { e.stopPropagation(); const next = new Set(selectedIds); if (e.target.checked) next.add(img.id); else next.delete(img.id); setSelectedIds(next); }} className="w-4 h-4" />
                                    </label>
                                    {onSelect && (
                                        <span className="bg-[#c68a53] text-white p-2 rounded-full"><Check size={16} /></span>
                                    )}
                                    <button
                                        onClick={(e) => handleDelete(e, img.id)}
                                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={async (e) => { e.stopPropagation(); setCropImage(img.data); setCropFileName(img.name); setEditingImageId(img.id); /* mark for update on save */ }}
                                        className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-200"
                                    >
                                        <CropIcon size={16} />
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-1 text-[10px] font-mono truncate text-center">
                                    {new Date(img.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaLibrary;
