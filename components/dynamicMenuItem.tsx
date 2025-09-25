// DynamicMenuItem.tsx
import { useState } from "react";
import { useFrontendFunctions } from "@/lib/functionsDispatcher";

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
      className={
        fn.css ||
        "px-4 py-2 text-sm text-foreground hover:bg-gray-100 cursor-pointer"
      }
      onClick={!isLoading ? handleClick : undefined}
    >
      {isLoading ? (
				<div className="flex items-center space-x-2">
					<span>Caricamento...</span>
					<svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
					  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				</div>
		 ) : (
		   fn.title
		 )}
    </li>
  );
}
