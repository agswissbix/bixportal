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

interface DynamicMenuItemProps {
  fn: CustomFunction;
  params?: any;
  onClick?: () => void;
  externalLoading?: boolean; // Nuova prop per delegare lo stato al genitore
}

export default function DynamicMenuItem({
  fn,
  onClick,
  externalLoading,
}: DynamicMenuItemProps) {
  
  // Se externalLoading è definito, usiamo quello, altrimenti potremmo usare uno stato interno (opzionale)
  const isLoading = externalLoading ?? false;

  return (
    <li
      role="button"
      aria-disabled={isLoading}
      onClick={(e) => {
        e.stopPropagation(); // Evita bubbling se necessario
        if (!isLoading && onClick) onClick();
      }}
      className={`
        list-none
        w-full
        flex items-center gap-2
        px-4 py-2
        text-sm font-medium
        text-gray-700 dark:text-gray-200
        rounded-lg
        cursor-pointer
        transition-colors
        ${isLoading ? "opacity-60 cursor-not-allowed" : ""}
        ${fn.css || ""}
      `}
    >
      {isLoading ? (
        <LoadingComp />
      ) : (
        <span>{fn.title}</span>
      )}
    </li>
  );
}