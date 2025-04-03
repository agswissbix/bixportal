import React, { useEffect, useState } from 'react';

// INTERFACCIA PROPS
interface PropsInterface {
  initialValue?: File | null;
  onChange?: (file: File | null) => void;
}

export default function InputFile({ initialValue = null, onChange }: PropsInterface) {
  const [value, setValue] = useState<File | null>(initialValue);
  const [fileName, setFileName] = useState<string>('');

  // Sync the state value with the initialValue when it changes
  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
      setFileName(initialValue.name);
    }
  }, [initialValue]);

  useEffect(() => {
    if (onChange && value !== initialValue && value) {
      onChange(value);
    }
  }, [value, onChange, initialValue]);

  return (
    <div>
      <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300">
        <input
          name="file"
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setValue(file);
              setFileName(file.name);
              if (onChange) {
                onChange(file);
              }
            }
          }}
          className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
        />
        {fileName && (
          <span className="text-sm text-gray-500 mr-2">{fileName}</span>
        )}
      </div>
    </div>
  );
}
