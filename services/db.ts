
export interface StoredImage {
    id: string;
    data: string; // Base64 string
    name: string;
    type: string;
    createdAt: number;
}

import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, getDoc } from 'firebase/firestore';

export interface StoredImage {
    id: string;
    data: string; // Base64 string
    name: string;
    type: string;
    createdAt: number;
}

const collectionName = 'images';

// Individual exports for test compatibility
export async function saveImage(file: File): Promise<StoredImage> {
    return new Promise((resolve, reject) => {
        // Validate size (approx 1MB limit for Firestore doc)
        if (file.size > 1000000) { // ~1MB hard limit
            reject(new Error("Image too large. Please use images under 1MB (or let the auto-compressor handle it)."));
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            const newImg = {
                data: base64,
                name: file.name,
                type: file.type,
                createdAt: Date.now()
            };

            try {
                const docRef = await addDoc(collection(db, collectionName), newImg);
                resolve({ id: docRef.id, ...newImg });
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export async function getAllImages(): Promise<StoredImage[]> {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredImage));
}

export async function updateImage(id: string, file: File): Promise<StoredImage> {
    // Read file to base64 and update existing doc
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            const update = {
                data: base64,
                name: file.name,
                type: file.type,
                updatedAt: Date.now()
            };

            try {
                await updateDoc(doc(db, collectionName, id), update);
                // Fetch the updated document to return a complete StoredImage (including createdAt)
                const snap = await getDoc(doc(db, collectionName, id));
                if (!snap.exists()) return reject(new Error('Updated image not found'));
                const data = snap.data() as any;
                resolve({ id, ...data } as StoredImage);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

class DBService {
    private collectionName = 'images';

    async saveImage(file: File): Promise<StoredImage> {
        return saveImage(file);
    }

    async getAllImages(): Promise<StoredImage[]> {
        return getAllImages();
    }

    async deleteImage(id: string): Promise<void> {
        await deleteDoc(doc(db, this.collectionName, id));
    }

    async updateImage(id: string, file: File): Promise<StoredImage> {
        return updateImage(id, file);
    }
}

export const dbService = new DBService();
