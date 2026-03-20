"use client";

import React, { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

// INTERFACCIA PROPS
interface PropsInterface {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export default function InputCheckbox({
  initialValue,
  onChange,
}: PropsInterface) {
  const [checked, setChecked] = useState((initialValue ?? "") === "Si");
  const [modified, setModified] = useState(false);

  useEffect(() => {
    if (!(initialValue ?? "")) {
      setChecked(false);
    }
  }, [initialValue]);

  useEffect(() => {
    if (onChange && modified) {
      onChange(checked ? "Si" : "No");
    }
  }, [checked, modified, onChange]);

  const handleChange = (value: boolean) => {
    setChecked(value);
    setModified(true);
  };

  return (
    <div className="flex items-center space-x-2 min-h-[36px] ">
      <Switch
        id="input-switch"
        checked={checked}
        onCheckedChange={handleChange}
        className={[
          // Layout del track
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
          // Transizione colore
          "transition-colors duration-200 ease-in-out",
          // Focus ring accessibile
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Stato checked → colore primario, unchecked → bordo sottile e sfondo neutro
          "data-[state=checked]:bg-primary",
          "data-[state=unchecked]:bg-input data-[state=unchecked]:border data-[state=unchecked]:border-border",
          // Thumb (pallino interno) — shadcn lo gestisce con [&>span]
          "[&>span]:block [&>span]:h-5 [&>span]:w-5 [&>span]:rounded-full [&>span]:bg-white",
          "[&>span]:shadow-md [&>span]:ring-0",
          "[&>span]:transition-transform [&>span]:duration-200 [&>span]:ease-in-out",
          "[&>span]:data-[state=checked]:translate-x-5 [&>span]:data-[state=unchecked]:translate-x-0",
        ].join(" ")}
      />
 
      {/* Etichetta di stato opzionale — aiuta la leggibilità */}
      <span
        className={[
          "select-none text-sm font-medium leading-none transition-colors duration-200",
          checked ? "text-primary" : "text-muted-foreground",
        ].join(" ")}
      >
        {checked ? "Sì" : "No"}
      </span>
    </div>
  );
}
