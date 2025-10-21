import React from 'react';

type InputProps = {
  id: string;
  name: string;
  label: React.ReactNode;
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  [key: string]: any;
};

function FloatingLabelInput({ id, name, label, value, onChange, type = 'text', ...rest }: InputProps) {
  const minProp = type === "number" ? { min: 0 } : {};

  return (
      <div className="relative">
          <input
              id={id}
              name={name}
              type={type}
              value={value}
              onChange={onChange}
              placeholder=" "
              className="block w-full px-1 pt-4 pb-1 bg-transparent border-b border-gray-300 
                   focus:outline-none focus:border-green-500 peer"
              {...minProp}
              {...rest}
          />

          <label
              htmlFor={id}
              className="absolute left-1 -top-3 text-xs text-gray-400 cursor-text
                   transition-all duration-300 ease-in-out
                   
                   peer-placeholder-shown:text-base 
                   peer-placeholder-shown:top-3
                   
                   peer-focus:text-xs 
                   peer-focus:-top-3 
                   peer-focus:text-green-500">
              {label}
          </label>
      </div>
  );
}

export default FloatingLabelInput;