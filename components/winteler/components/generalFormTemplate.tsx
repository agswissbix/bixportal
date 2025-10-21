import React from 'react';
import BarcodeScanner from './barcodeScanner';
import CondizioniNoleggio from './condizioni_noleggio';
import { GenericFormField, GenericFormSchema, GenericFormSection } from './generalFormTypes';
import FloatingLabelSelect from './floatingLabelSelect';
import GeneralButton from './generalButton';
import FloatingLabelInput from './floatingLabelInput';
import { PhotoGallery } from './photoGallery';

const getNestedValue = (path: string, data: any, formatters: any, fieldId: string): any => {
    try {
        const keys = path.split('.');
        let value = data; 
        for (const key of keys) {
            if (value && value[key] !== undefined) {
                value = value[key];
            } else {
                return ''; 
            }
        }
        
        if (path.includes('.data')) {
            if (fieldId.toLowerCase().includes('data')) return formatters.formatDateForInput(value);
            if (fieldId.toLowerCase().includes('ora')) return formatters.formatTimeForInput(value);
        }
        
        return value;
    } catch (e) {
        return '';
    }
};

interface GeneralFormTemplateProps {
    schema: GenericFormSchema;
    formData: any; 
    handleChange: (path: string, value: any) => void;
    activeIndex: string;
    toggleCategory: (section: string) => void;
    
    handleCaricaFotoClick: (path: string) => void;
    rimuoviFoto: (index: number, path: string) => void;
    photoUrlMaps: Record<string, Map<File, string>>; 

    formatDateForInput?: (date: Date | null) => string; 
    formatTimeForInput?: (date: Date | null) => string;

    validationErrors: any;
    validateForm: (schema: GenericFormSchema, formData: any) => { isValid: boolean, errors: any };
}

interface FieldWithAction extends GenericFormField {
    actionButton?: {
        text: string;
        action: (path: string) => void;
        className?: string;
    };
}


const renderInputField = (field: FieldWithAction, props: GeneralFormTemplateProps, formatters: any) => {
    if (field.type === 'label-only') {
        return (
            <div 
                key={field.id} 
                className={`block font-medium text-gray-700 mb-2 text-center ${field.className || 'w-1/2'}`}
            >
                <h3 className="text-base text-gray-800">
                    {field.label}
                </h3>
            </div>
        );
    }
    
    if (field.type === 'divider') {
        return (
            <div 
                key={field.id} 
                className={`mt-8 mb-4 ${field.className || 'w-full'} border border-gray-200  shadow-sm bg-gray-50 p-4`}
            >
                <h3 className="text-lg text-gray-800">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
            </div>
        );
    }

    const rawValue = getNestedValue(field.path, props.formData, formatters, field.id);
    
    const isCheckbox = field.type === 'checkbox';
    const isSelect = field.type === 'select';
    const isRadio = field.type === 'radio';
    const isNumber = field.type === 'number';
    const isTextarea = field.type === 'textarea';

    const hasActionButton = !!field.actionButton;
    
    const externalContainerClasses = `${field.className || 'w-full mt-8'}`;
    
    const inputWrapperClasses = hasActionButton ? 'w-1/2 pr-2' : 'w-full';
    const buttonWrapperClasses = hasActionButton ? 'w-1/2 pl-2 flex items-end' : ''; 

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement; 
        let val: any = target.value;
        
        if (field.type === 'number') {
            if (val === '') {
                val = '';
            } else {
                const num = Number(val);
                val = isNaN(num) ? val : num.toString(); 
            }
        } else if (field.type === 'checkbox') {
            const checkboxTarget = e.target as HTMLInputElement;
            val = checkboxTarget.checked;
        } else if (isRadio || isSelect) { 
             val = target.value;
        }
        
        props.handleChange(field.path, val);
    };

    if (isCheckbox) {
        return (
            <div className={`mt-8 ${field.className || ''}`} key={field.id}>
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={rawValue || false}
                        onChange={handleValueChange}
                    />
                    <span>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                </label>
            </div>
        );
    }
    
    if (isRadio && field.options) {
        return (
            <div className={`${field.className || ''}`} key={field.id}>
                <label className="block font-medium text-gray-700 mb-2 text-center">
                    {field.label}
                    {field.required && <span className="text-red-500 text-sm ml-1">*</span>}
                </label>
                <div className="flex justify-center w-full">
                    <div className="flex space-x-4">
                        {field.options.map(option => (
                            <div key={option.value} className="flex items-center">
                                <input
                                    id={`${field.id}-${option.value}`}
                                    name={field.id}
                                    type="radio"
                                    value={option.value}
                                    checked={rawValue === option.value}
                                    onChange={handleValueChange}
                                    className="focus:ring-black text-gray-900 border-gray-300"
                                />
                                <label 
                                    htmlFor={`${field.id}-${option.value}`} 
                                    className="ml-2 text-sm text-gray-700 cursor-pointer"
                                >
                                    {option.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                
            </div>
        );
    }

    if (isSelect && field.options) {
        const selectLabel = (
            <span>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
        );

        return (
            <div className={`${externalContainerClasses}`} key={field.id}>
                <FloatingLabelSelect
                    id={field.id}
                    name={field.id}
                    label={selectLabel}
                    value={rawValue}
                    options={field.options}
                    onChange={handleValueChange}
                />
            </div>
        );
    }

    if (isTextarea) {
        return (
            <div className={`${field.className || 'w-full'}`} key={field.id}>
                <label 
                    htmlFor={field.id} 
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                    id={field.id}
                    name={field.id}
                    value={rawValue || ''}
                    onChange={handleValueChange}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300  shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
        );
    }
    
    const inputType = (field.type === 'date' || field.type === 'time') ? field.type : 'text';

    const inputLabel = (
        <span>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
        </span>
    );

    return (
        <div className={`${externalContainerClasses} ${hasActionButton ? 'flex' : ''}`} key={field.id}>
            
            <div className={inputWrapperClasses}>
                <FloatingLabelInput
                    id={field.id}
                    name={field.id}
                    label={inputLabel}
                    type={isNumber ? 'text' : inputType}
                    value={rawValue}
                    onChange={handleValueChange}
                    required={field.required}
                />
            </div>
            
            {hasActionButton && field.actionButton && (
                <div className={buttonWrapperClasses}>
                    <GeneralButton 
                        text={field.actionButton.text} 
                        action={() => field.actionButton!.action(field.path)}
                        className={field.actionButton.className || 'w-full'}
                        type="button"
                    />
                </div>
            )}
        </div>
    );
};


const renderSpecialComponent = (section: GenericFormSection, props: GeneralFormTemplateProps) => {
    const specialPath = section.specialDataPath;

    switch (section.specialComponent) {
        case 'BarcodeScanner':
            if (!specialPath) return null;
    
            const barcodeValue = getNestedValue(specialPath, props.formData, {}, 'barcode');
            
            if (!barcodeValue) {
                return (
                    <div className="mt-4">
                        <BarcodeScanner
                            onScanSuccess={(decodedText, decodedResult) => {
                            props.handleChange(specialPath, decodedText);
                        }}
                        onScanError={(errorMessage) => { 
                            console.error("Scan Error:", errorMessage);
                        }}
                        />
                    </div>
                );
            }
            
            return null;
        case 'PhotoUpload':
            if (!specialPath) return null;
            const urlMap = props.photoUrlMaps[specialPath] || new Map();
            
            return (
                <>
                    <PhotoGallery 
                        urlMap={urlMap}
                        path={specialPath}
                        rimuoviFoto={props.rimuoviFoto}
                    />
                    <GeneralButton
                        text={urlMap.size > 0 ? 'Aggiungi Foto' : 'Carica Foto'}
                        className='mb-4'
                        action={() => props.handleCaricaFotoClick(specialPath)}
                        type="button"
                    />
                </>
            );
        case 'CustomHtmlBlock':
            if (section.key === 'condizioniNoleggio') {
                return (
                    <div className='max-w-lg'>
                        <CondizioniNoleggio />
                    </div>
                );
            }
            return <p>Blocco HTML personalizzato per {section.key}</p>;
        
        default:
            return null;
    }
};


export const GeneralFormTemplate: React.FC<GeneralFormTemplateProps> = (props) => {
    const { schema, activeIndex, toggleCategory } = props;

    const defaultFormatter = (_date: Date | null) => '';

    const formatters = { 
        formatDateForInput: props.formatDateForInput || defaultFormatter, 
        formatTimeForInput: props.formatTimeForInput || defaultFormatter 
    };

    return (
        <>
            {schema.map(section => (
                <div
                    key={section.key}
                    className="bg-white shadow overflow-hidden border border-gray-200"
                >
                    <button
                        type="button"
                        className="w-full text-left flex items-center p-4 text-lg font-semibold text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out border-b border-gray-200"
                        onClick={() => toggleCategory(section.key)}
                        aria-expanded={activeIndex === section.key}
                    >
                        <span>{section.title}</span>
                    </button>

                    {activeIndex === section.key && (
                        <div className='p-4'>
                            {section.specialComponent === 'BarcodeScanner' && renderSpecialComponent(section, props)}

                            <div className='mb-8'>
                                <div className={section.key === 'controlloOfficina' || section.key === 'datiVettura' ? 'flex flex-wrap -mx-2 max-w-lg' : ''}>
                                    {section.fields?.map(field => renderInputField(field as FieldWithAction, props, formatters))}
                                </div>
                            </div>

                            
                            {section.specialComponent === 'CustomHtmlBlock' && renderSpecialComponent(section, props)}
                            {section.specialComponent === 'PhotoUpload' && renderSpecialComponent(section, props)}
                        </div>
                    )}

                    {activeIndex === section.key && (
                        <div className='p-4'>
                            {props.validationErrors[section.key]?.map((error: any, index: number) => (
                                <p key={index} className="text-red-500 text-sm mb-2">
                                    {error.label}: {error.message}
                                </p>
                            ))}
                        </div>
                    )}      
                </div>
            ))}
        </>
    );
};