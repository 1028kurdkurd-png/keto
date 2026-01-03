import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import getCroppedImg from '../../utils/canvasUtils';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (_croppedImage: string) => void;
    onCancel: () => void;
    aspect?: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel, aspect = 1 }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        try {
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            );
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error(e);
            alert('Error cropping image');
        }
    }, [imageSrc, croppedAreaPixels, rotation, onCropComplete]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-[30px] w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center z-10">
                    <h3 className="font-black text-[#231f20] text-lg">Edit Image</h3>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Cropper Container */}
                <div className="relative flex-1 bg-[#1a1a1a]">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={setZoom}
                        objectFit="contain"
                    />
                </div>

                {/* Controls */}
                <div className="bg-white p-6 border-t border-gray-100 flex flex-col gap-4 z-10">

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-400">
                            <ZoomOut size={16} />
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full accent-[#c68a53] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex items-center gap-2 text-gray-400">
                            <ZoomIn size={16} />
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setRotation(r => r + 90)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 font-bold hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                            <RotateCw size={18} />
                            Rotate
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={showCroppedImage}
                                className="px-8 py-3 rounded-xl bg-[#231f20] text-[#c68a53] font-black shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Check size={20} />
                                Save Crop
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
