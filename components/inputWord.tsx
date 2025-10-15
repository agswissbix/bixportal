import React, { useEffect, useState } from 'react';
import { Input } from './ui/input';

// INTERFACCIA PROPS
interface PropsInterface {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export default function InputWord({ initialValue = '', onChange }: PropsInterface) {
  const [value, setValue] = useState(initialValue ?? '');


  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div>
      <div className="">
          <Input
            name="word"
            type="text"
            value={value}
            onChange={handleChange}
            placeholder=""
            className="block min-w-0 grow py-1.5 pl-3 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary sm:text-sm/6"
          />
      </div>
    </div>
  );
};
