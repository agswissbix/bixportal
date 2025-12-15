import React, { useEffect, useMemo, useState, KeyboardEvent } from 'react';
import Select, { SingleValue, MultiValue, ActionMeta } from 'react-select';

// INTERFACCIA PROPS
interface PropsInterface {
  lookupItems: Array<{ userid: string; firstname: string; lastname: string; }>;
  initialValue?: string | string[];
  // onChange accetta sia string che array di string a seconda della modalità usata
  onChange?: (value: string | string[]) => void;
  isMulti?: boolean;
}

interface OptionType {
  value: string;
  label: string;
  imageUrl: string;

}

// Stili custom per react-select
const customStyles = {
  control: () =>
    "min-h-[42px] rounded-lg border border-gray-300 bg-gray-50 hover:border-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 pl-2 pr-2",
  menu: () =>
    "mt-1 bg-white rounded-lg shadow-lg max-h-50 overflow-y-auto z-50",
  option: () =>
    "px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-900",
  singleValue: () => "text-sm text-gray-900",
  multiValue: () => "bg-blue-100 rounded-md m-1",
  multiValueLabel: () => "px-2 py-1 text-sm text-blue-700",
  multiValueRemove: () =>
    "px-2 py-1 hover:bg-blue-200 hover:text-blue-900 rounded-r-md",
  placeholder: () => "text-sm text-gray-500",
  input: () => "text-sm text-gray-900",
};

export default function SelectUser({
  lookupItems,
  initialValue = '',
  onChange,
  isMulti = false,
}: PropsInterface) {
  // Calcola le opzioni a partire da lookupItems
  const options: OptionType[] = useMemo(
    () =>
      lookupItems.map((item) => ({
        value: String(item.userid),
        label: `${item.firstname} ${item.lastname}`,
        imageUrl: `/api/media-proxy?url=userProfilePic/${item.userid}.png`


      })),
    [lookupItems]
  );

  console.log(lookupItems);
  // Funzione per calcolare il valore iniziale in base a initialValue e isMulti
  const getInitialValue = () => {
    if (isMulti) {
      const initialValues = Array.isArray(initialValue)
        ? initialValue.map(val => String(val))
        : [String(initialValue)].filter(Boolean);
      return options.filter((option) => initialValues.includes(option.value));
    } else {
      return options.find((option) => option.value === String(initialValue)) || null;
    }
  };

  // Stato per gestire l'opzione selezionata
  const [selectedOption, setSelectedOption] = useState<
    OptionType | OptionType[] | null
  >(getInitialValue());

  
  // Aggiorna lo stato se cambiano initialValue, lookupItems o la modalità isMulti
  useEffect(() => {
    const computed = getInitialValue();
    console.log("DEBUG: lookupItems:", lookupItems);
    console.log("DEBUG: options:", options);
    console.log("DEBUG: computed selectedOption:", computed);
    setSelectedOption(computed);
  }, [initialValue, isMulti, lookupItems, options]);

  // Effetto per il debug del valore di initialValue
  useEffect(() => {
    console.log("DEBUG: initialValue ricevuto:", initialValue);
  }, [initialValue]);

  // Gestione della modifica della selezione
  const handleChange = (
    newValue: SingleValue<OptionType> | MultiValue<OptionType>,
    actionMeta: ActionMeta<OptionType>
  ) => {
    setSelectedOption(newValue as OptionType | OptionType[]);
    if (onChange) {
      if (isMulti) {
        const values = (newValue as MultiValue<OptionType>).map(
          (option) => option.value
        );
        onChange(values);
      } else {
        const value = newValue
          ? (newValue as SingleValue<OptionType>).value
          : '';
        onChange(value);
      }
    }
  };

  // Gestione del tasto Invio: simula il click sulla prima opzione del menu se presente
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      const select = event.target as HTMLElement;
      const menu = select.querySelector('[class$="-menu"]');
      if (menu) {
        const firstOption = menu.querySelector('[class$="-option"]');
        if (firstOption) {
          (firstOption as HTMLElement).click();
        }
      }
    }
  };

  useEffect(() => {
        if(onChange && initialValue){
          onChange(initialValue);
        } 
      }, [initialValue]);

  return (
    <div className="relative">
      <Select
        isMulti={isMulti}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Seleziona un utente"
        isClearable
        getOptionValue={(option: OptionType) => option.value}
        getOptionLabel={(option: OptionType) => option.label}
        formatOptionLabel={(option: OptionType) => (
          <div className="flex items-center gap-2">
            <img
              src={option.imageUrl}
              alt={option.label}
              className="w-6 h-6 rounded-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("default.jpg")) {
                  target.src = "/api/media-proxy?url=userProfilePic/default.jpg";
                }
              }}
            />
            <span>{option.label}</span>
          </div>
        )}
        classNames={{
          container: () => "relative",
          control: () => customStyles.control(),
          menu: () => customStyles.menu(),
          option: () => customStyles.option(),
          singleValue: () => customStyles.singleValue(),
          multiValue: () => customStyles.multiValue(),
          multiValueLabel: () => customStyles.multiValueLabel(),
          multiValueRemove: () => customStyles.multiValueRemove(),
          placeholder: () => customStyles.placeholder(),
          input: () => customStyles.input(),
        }}
        unstyled
      />
    </div>
  );
}
