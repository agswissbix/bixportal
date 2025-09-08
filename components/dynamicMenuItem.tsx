import { frontendFunctions } from "@/lib/functionsDispatcher"

export type CustomFunction = {
  tableid: string
  context: string
  title: string
  backend_function: string
  conditions?: any
  css?: string
}

export default function DynamicMenuItem({ fn, params, onClick }: { fn: CustomFunction, params?: any, onClick?: () => void }) {
  const handleClick = async () => {
    const func = frontendFunctions()[fn.backend_function]
    if (func) {
        console.log("Eseguendo funzione:", fn.backend_function, "con parametri:", params);
      await func(params)
    } else {
      console.warn(`Funzione non trovata: ${fn.backend_function}`)
    }
  }

  return (
    <li
      className={fn.css || "px-4 py-2 text-sm text-foreground hover:bg-muted cursor-pointer"}
      onClick={() => { handleClick(); onClick && onClick(); }}
    >
      {fn.title}
    </li>
  )
}
