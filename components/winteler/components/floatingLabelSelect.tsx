import React from 'react';

type OptionType = {
  value: string | number;
  label: string;
};

type SelectProps = {
  id: string;
  name: string;
  label: React.ReactNode; 
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: OptionType[];
  placeholder?: string; 
};

function FloatingLabelSelect({
  id,
  name,
  label,
  value,
  onChange,
  options,
  placeholder = "",
}: SelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required 
        className="peer block w-full appearance-none bg-transparent px-1 pt-4 pb-1
                   border-b border-gray-300 focus:outline-none focus:border-green-500"
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label
        htmlFor={id}
        className="absolute left-1 top-3 text-base text-gray-400 cursor-text
                   transition-all duration-300 ease-in-out
                   
                   /* Animazione quando il campo ha un valore (è valido) o è in focus */
                   peer-focus:text-xs 
                   peer-focus:-top-3 
                   peer-focus:text-green-500
                   
                   peer-valid:text-xs
                   peer-valid:-top-3"
      >
        {label}
      </label>

      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400
                      peer-focus:text-green-500">
        <svg
          className="h-5 w-5 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
}

export default FloatingLabelSelect;