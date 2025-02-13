import React, { useEffect,useState } from 'react';

// INTERFACCIA PROPS
interface PropsInterface {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export default function InputDate({ initialValue = '',onChange }: PropsInterface) {

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (onChange && value !== initialValue) {
      onChange(value);
    }
  }, [value, onChange, initialValue]);

  return (
    <div>
      <div className="mt-2">
        <div className="flex items-center mb-4">
        <input
            name="word"
            type="checkbox"
            value={value}
            onChange={(e) => setValue(e.target.value)} // Aggiorna lo stato locale
            placeholder="Inserisci un valore"
            id="default-checkbox"   className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
        </div>
      </div>
    </div>
  );
};


