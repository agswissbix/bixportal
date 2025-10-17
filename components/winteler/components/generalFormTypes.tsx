export type SupportedInputType = 'text' | 'number' | 'email' | 'date' | 'time' | 'checkbox' | 'textarea' | 'select' | 'radio' | 'divider' | 'label-only';
export type SpecialComponentType = 'PhotoUpload' | 'BarcodeScanner' | 'CustomHtmlBlock';

export interface GenericFormField {
    id: string; 
    label: string;
    type: SupportedInputType;
    path: string; 
    className?: string; 
    options?: { value: string | number; label: string }[];
    required?: boolean;
    actionButton?: { 
        text: string;
        action: (path: string) => void;
        className?: string;
    };
}

export interface GenericFormSection {
    key: string; 
    title: string;
    fields?: GenericFormField[];
    specialComponent?: SpecialComponentType;
    specialDataPath?: string; 
}

export type GenericFormSchema = GenericFormSection[];

export interface GeneralFormData {
    [key: string]: any; 
}