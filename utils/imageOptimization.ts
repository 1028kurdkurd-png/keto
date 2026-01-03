
export const convertToWebP = (file: File, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Conversion failed'));
                    return;
                }
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                    type: "image/webp",
                    lastModified: Date.now(),
                });
                resolve(newFile);
            }, 'image/webp', quality);
        };
        img.onerror = (error) => reject(error);
    });
};
