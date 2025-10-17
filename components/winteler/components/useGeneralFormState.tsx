import { useState, useCallback, useRef, useEffect } from 'react';
import { GeneralFormData } from './generalFormTypes';

const updateNestedValue = (data: GeneralFormData, path: string, value: any): GeneralFormData => {
    const keys = path.split('.');
    let newData = { ...data };
    let currentLevel: any = newData;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (i === keys.length - 1) {
            let finalValue = value;
            
            if (path.includes('.data')) { 
                if (value === '') {
                    finalValue = null;
                } else {
                    const existingDate = currentLevel[key] instanceof Date ? new Date(currentLevel[key]) : (currentLevel[key] || new Date());
                    
                    if (typeof value === 'string' && value.includes('-')) { 
                        const [year, month, day] = value.split('-').map(Number);
                        existingDate.setFullYear(year, month - 1, day);
                    } else if (typeof value === 'string' && value.includes(':')) {
                        const [hours, minutes] = value.split(':').map(Number);
                        existingDate.setHours(hours, minutes, 0, 0);
                    }
                    finalValue = existingDate;
                }
            }
            
            currentLevel[key] = finalValue;

        } else {
            currentLevel[key] = { ...currentLevel[key] };
            currentLevel = currentLevel[key];
        }
    }
    return newData;
};

export const useGeneralFormState = (initialData: GeneralFormData, allFotoPaths: string[]) => {
    const [formData, setFormData] = useState<GeneralFormData>(initialData);
    const [activeIndex, setActiveIndex] = useState('');
    const [currentPhotoPath, setCurrentPhotoPath] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [photoUrlMaps, setPhotoUrlMaps] = useState<Record<string, Map<File, string>>>({});

    const toggleCategory = useCallback((sectionKey: string) => {
        setActiveIndex(prevIndex => (prevIndex === sectionKey ? '' : sectionKey));
    }, []);

    const handleChange = useCallback((path: string, value: any) => {
        setFormData(prev => updateNestedValue(prev, path, value));
    }, []);

    const handleCaricaFotoClick = useCallback((path: string) => {
        setCurrentPhotoPath(path);
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (files && files.length > 0 && currentPhotoPath) {
            const newFiles = Array.from(files);

            setFormData(prev => {
                const keys = currentPhotoPath.split('.');
                const currentFiles: File[] = keys.reduce((o, i) => o?.[i], prev) || [];
                
                const updatedData = updateNestedValue(prev, currentPhotoPath, [...currentFiles, ...newFiles]);
                return updatedData;
            });
            
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [currentPhotoPath]);

    const rimuoviFoto = useCallback((indexToRemove: number, path: string) => {
        setFormData(prev => {
            const keys = path.split('.');
            const currentFiles: File[] = keys.reduce((o, i) => o?.[i], prev) || [];
            
            const updatedFiles = currentFiles.filter((_, index) => index !== indexToRemove);
            
            return updateNestedValue(prev, path, updatedFiles);
        });
    }, []);

    useEffect(() => {
        const syncUrls = (files: File[], currentMap: Map<File, string>, path: string) => {
            const newMap = new Map<File, string>();
            const filesSet = new Set(files);
            
            currentMap.forEach((url, file) => {
                if (!filesSet.has(file)) URL.revokeObjectURL(url);
            });
    
            files.forEach(file => {
                const url = currentMap.has(file) ? currentMap.get(file)! : URL.createObjectURL(file);
                newMap.set(file, url);
            });
            
            setPhotoUrlMaps(prev => ({ ...prev, [path]: newMap }));
        };
        
        allFotoPaths.forEach(path => {
            try {
                const files: File[] = path.split('.').reduce((o, i) => o?.[i], formData) || [];
                const currentMap = photoUrlMaps[path] || new Map();
                
                if (files.length > 0 || currentMap.size > 0) {
                    syncUrls(files, currentMap, path);
                }
            } catch (e) {
               
            }
        });
        
    }, [formData, allFotoPaths]); 

    useEffect(() => {
        return () => {
            Object.values(photoUrlMaps).forEach(map => map.forEach(URL.revokeObjectURL));
        };
    }, []);

    return {
        formData,
        handleChange,
        activeIndex,
        toggleCategory,
        handleCaricaFotoClick,
        handleFileChange,
        rimuoviFoto,
        photoUrlMaps,
        fileInputRef,
    };
};