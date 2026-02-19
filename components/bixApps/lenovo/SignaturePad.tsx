import React, { useRef, useState, useEffect } from 'react';

interface Props {
    onSave: (data: string) => void;
    onCancel?: () => void;
}

const SignaturePad = ({ onSave, onCancel }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

        // Resize
        const resize = () => {
            const parent = canvas.parentElement;
            if(parent) {
                canvas.width = parent.clientWidth;
                canvas.height = 200;
            }
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    const getCoordinates = (e: any, canvas: HTMLCanvasElement) => {
        let clientX, clientY;
        if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const rect = canvas.getBoundingClientRect();
        return {
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top
        };
    };

    const startDrawing = (e: any) => {
        // e.preventDefault(); // Prevent scrolling on touch
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        // e.preventDefault(); 
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const data = canvas.toDataURL('image/png');
        onSave(data);
    };

    return (
        <div className="w-full">
            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white touch-none cursor-crosshair overflow-hidden">
                <canvas 
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ width: '100%', height: '200px' }}
                />
            </div>
            <div className="flex justify-between mt-4">
                <button onClick={clear} className="text-sm text-gray-500 hover:text-red-500 underline px-2">Clear</button>
                <div className="flex gap-2">
                    {onCancel && (
                        <button onClick={onCancel} className="px-4 py-2 text-gray-600 font-medium">Cancel</button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={!hasSignature}
                        className="px-6 py-2 bg-[#E2231A] text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm Signature
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
