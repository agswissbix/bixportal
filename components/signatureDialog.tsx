import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DigitalSignature from './activeMind/DigitalSignature';

interface SignatureDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSignatureChange?: (signature: string | null) => void;
	onSaveSignature?: () => void;
}

export const SignatureDialog = ({ isOpen, onOpenChange, onSignatureChange, onSaveSignature }: SignatureDialogProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="z-[9999] bg-card-background border-2 border-accent/20 shadow-2xl max-w-2xl">
                <DialogHeader className="border-b border-accent/10 pb-4">
                    <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                        <svg 
                            className="w-6 h-6 text-accent" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                            />
                        </svg>
                        Firma Digitale
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    <div className="bg-accent/5 border-l-4 border-accent p-4 rounded-r-lg">
                        <p className="text-sm text-gray-600">
                            Apponi la tua firma digitale nel campo sottostante per confermare l'operazione.
                        </p>
                    </div>
                    
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-inner">
                        <DigitalSignature onSignatureChange={onSignatureChange} />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-accent/10">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={() => {
                                onOpenChange(false);
                                onSaveSignature && onSaveSignature();
                            }}
                            className="px-6 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
                        >
                            Conferma Firma
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}