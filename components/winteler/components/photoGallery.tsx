import React from 'react';
import Image from 'next/image';

interface PhotoGalleryProps {
    urlMap: Map<File, string>;
    path: string; // Es. 'datiCliente.fotoPatente'
    rimuoviFoto: (index: number, path: string) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ urlMap, path, rimuoviFoto }) => {
    if (urlMap.size === 0) return null;

    return (
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from(urlMap.entries()).map(([file, url], index) => (
                <div key={url} className="relative flex flex-col items-center">
                    <Image
                        src={url}
                        alt={`Anteprima ${index + 1}`}
                        width={150}
                        height={150}
                        className="object-contain border border-gray-300 rounded"
                    />
                    <button
                        type="button"
                        onClick={() => rimuoviFoto(index, path)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                        Rimuovi
                    </button>
                </div>
            ))}
        </div>
    );
};