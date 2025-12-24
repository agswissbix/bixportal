// DynamicMenuItem.tsx
import { useState } from "react";
import { useFrontendFunctions } from "@/lib/functionsDispatcher";
import LoadingComp from "./loading";

export type CustomFunction = {
  tableid: string;
  context: string;
  title: string;
  function: string;
  conditions?: any;
  params?: any;
  css?: string;
};

export default function DynamicMenuItem({
  fn,
  params,
  onClick,
}: {
  fn: CustomFunction;
  params?: any;
  onClick?: () => void;
}) {
  const frontendFunctions = useFrontendFunctions();
  const [isLoading, setIsLoading] = useState(false);
  const handleClick = async () => {
    setIsLoading(true); // Start loading
    const func = frontendFunctions[fn.function];
    try {
      if (func) {
        console.log(`Esecuzione della funzione: ${fn.function} con params:`, params);
        if (params !== undefined) {
          await func(params);
        } else {
          await func();
        }
      } else {
        console.warn(`Funzione non trovata: ${fn.function}`);
      }
    } catch (error) {
      console.error(
        `Errore durante l'esecuzione della funzione: ${fn.function}`,
        error
      );
    } finally {
      setIsLoading(false); // End loading
    }
    onClick && onClick();
  };

  return (
    <li
      role="button"
      aria-disabled={isLoading}
      onClick={!isLoading ? handleClick : undefined}
      className={`
        w-full
        flex items-center gap-2
        px-4 py-2
        text-sm font-medium
        text-gray-700 dark:text-gray-200
        rounded-lg
        cursor-pointer
        hover:bg-gray-100 dark:hover:bg-gray-700
        transition-colors
        ${isLoading ? "opacity-60 cursor-not-allowed" : ""}
        ${fn.css || ""}
      `}
    >
      {isLoading ? (
        <LoadingComp />
      ) : (
        fn.title
      )}
    </li>
  );
}