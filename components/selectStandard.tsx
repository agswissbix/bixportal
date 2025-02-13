import React, { useEffect,useState } from 'react';

// INTERFACCIA PROPS
interface PropsInterface {
    lookupItems: Array<{ itemcode: string; itemdesc: string }>;
    initialValue?: string; // Codice dell'elemento selezionato inizialmente
    onChange?: (value: string) => void; // Funzione chiamata quando il valore cambia
}

export default function ExampleComponent({ lookupItems,initialValue='',onChange }: PropsInterface) {
  
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (onChange && value !== initialValue) {
      onChange(value);
    }
  }, [value, onChange, initialValue]);  
  
  return (
    <div>
      <div className="mt-2">
        {/*
        <Select 
        defaultValue={lookupItems.filter(item => item.itemcode === initialValue)}
        isMulti={true}
        name = "items"
        className='basic-multi-select'
        classNamePrefix={"select"}

        />
        */}
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        >
          <option value="">Seleziona un elemento</option>
          {lookupItems.map((item) => (
            <option key={item.itemcode} value={item.itemcode}>
              {item.itemdesc}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};


