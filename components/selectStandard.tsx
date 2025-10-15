"use client"

import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import Select, { type SingleValue, type MultiValue, type ActionMeta } from "react-select"

// INTERFACCIA PROPS
interface PropsInterface {
  lookupItems: Array<{ itemcode: string; itemdesc: string }>
  initialValue?: string | string[] // Es: "123;456"
  onChange?: (value: string | string[]) => void // Es: "123;456"

  isMulti?: boolean
}

interface OptionType {
  value: string
  label: string
}

const customStyles = {
  control: () =>
    "min-h-[42px] rounded-lg border border-gray-300 bg-gray-50 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary pl-2 pr-2 transition-all duration-200",
  menu: () => "mt-2 bg-white rounded-lg shadow-lg border border-gray-300 z-[9999]",
  option: (state: any) => {
    const baseClasses =
      "px-3 py-2.5 cursor-pointer text-sm transition-colors duration-150 rounded-md border-b border-gray-200 last:border-0"

    // Selected (checked) state
    if (state.isSelected) {
      return `${baseClasses} bg-secondary-hover text-secondary-foreground`
    }

    // Hover state (not selected)
    return `${baseClasses} hover:text-secondary-foreground hover:bg-secondary`
  },
  singleValue: () => "text-sm text-foreground",
  multiValue: () => "bg-primary bg-blue-100 border border-primary rounded-md m-1",
  multiValueLabel: () => "px-2 py-1 text-sm text-primary-foreground text-blue-700",
  multiValueRemove: () => "px-2 py-1 hover:bg-primary-hover text-primary-foreground hover:border-primary-foreground rounded-r-md transition-colors",
  placeholder: () => "text-sm text-muted-foreground",
  input: () => "text-sm text-foreground",
}

export default function SelectStandard({ lookupItems, initialValue = "", onChange, isMulti = false }: PropsInterface) {
  // Calcola le opzioni a partire da lookupItems
  const options: OptionType[] = useMemo(
    () =>
      lookupItems.map((item) => ({
        value: String(item.itemcode),
        label: `${item.itemdesc}`,
      })),
    [lookupItems],
  )

  const getInitialValue = () => {
    if (isMulti) {
      const initialValues = Array.isArray(initialValue)
        ? initialValue.map((val) => String(val))
        : [String(initialValue)].filter(Boolean)
      return options.filter((option) => initialValues.includes(option.value))
    } else {
      return options.find((option) => option.value === String(initialValue)) || null
    }
  }

  const [selectedOption, setSelectedOption] = useState<OptionType | OptionType[] | null>(getInitialValue())

  useEffect(() => {
    const computed = getInitialValue()
    console.log("DEBUG: lookupItems:", lookupItems)
    console.log("DEBUG: options:", options)
    console.log("DEBUG: computed selectedOption:", computed)
    setSelectedOption(computed)
  }, [initialValue, isMulti, lookupItems, options])

  useEffect(() => {
    console.log("DEBUG: initialValue ricevuto:", initialValue)
  }, [initialValue])

  const handleChange = (
    newValue: SingleValue<OptionType> | MultiValue<OptionType>,
    actionMeta: ActionMeta<OptionType>,
  ) => {
    if (isMulti) {
      setSelectedOption(Array.isArray(newValue) ? [...newValue] : [])
    } else {
      setSelectedOption(newValue as OptionType | null)
    }

    if (onChange) {
      if (isMulti) {
        const values = (newValue as MultiValue<OptionType>).map((option) => option.value)
        onChange(values)
      } else {
        const value = newValue ? (newValue as SingleValue<OptionType>).value : ""
        onChange(value)
      }
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      const select = event.target as HTMLElement
      const menu = select.querySelector('[class$="-menu"]')
      if (menu) {
        const firstOption = menu.querySelector('[class$="-option"]')
        if (firstOption) {
          ;(firstOption as HTMLElement).click()
        }
      }
    }
  }

  useEffect(() => {
    if (onChange && initialValue) {
      onChange(initialValue)
    }
  }, [initialValue])

  return (
    <div className="relative">
      <Select
        menuPortalTarget={document.body}
        isMulti={isMulti}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Seleziona un'opzione"
        isClearable
        menuPlacement="auto"
        getOptionValue={(option: OptionType) => option.value}
        getOptionLabel={(option: OptionType) => option.label}
        classNames={{
          container: () => "relative",
          control: () => customStyles.control(),
          menu: () => customStyles.menu(),
          option: (state) => customStyles.option(state),
          singleValue: () => customStyles.singleValue(),
          multiValue: () => customStyles.multiValue(),
          multiValueLabel: () => customStyles.multiValueLabel(),
          multiValueRemove: () => customStyles.multiValueRemove(),
          placeholder: () => customStyles.placeholder(),
          input: () => customStyles.input(),
        }}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 50 }),
        }}
        unstyled
      />
    </div>
  )
}
