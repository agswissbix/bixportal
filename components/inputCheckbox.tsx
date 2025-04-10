import React, { useEffect, useState } from 'react';

// INTERFACCIA PROPS
interface PropsInterface {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export default function InputCheckbox({ initialValue, onChange }: PropsInterface) {
  const [checked, setChecked] = useState((initialValue ?? '') === 'Si');
  const [modified, setModified] = useState(false);

  useEffect(() => {
    if (!(initialValue ?? '')) {
      setChecked(false);
    }
  }, [initialValue]);

  useEffect(() => {
    if (onChange && modified) {
      onChange(checked ? 'Si' : 'No');
    }
  }, [checked, modified, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
    setModified(true);
  };

  return (
    <div className="">
      <div className="flex items-center mb-4">
        <input
          name="input-checkbox"
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          id="default-checkbox"
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
    </div>
  );
};
