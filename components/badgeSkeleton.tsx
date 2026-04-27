import { Skeleton } from "@/components/ui/skeleton"

export function BadgeSkeleton() {
  return (
    <div className="w-full max-w-4xl bg-white mx-auto dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-6">
      {/* Top section: Title & User */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-64" /> {/* Title */}
          <Skeleton className="h-4 w-24 mt-4" /> {/* Importo Label */}
          <Skeleton className="h-8 w-40" /> {/* Importo Value */}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" /> {/* Avatar */}
            <Skeleton className="h-5 w-32" /> {/* User name */}
            <Skeleton className="h-4 w-4" /> {/* Chevron */}
          </div>
          <Skeleton className="h-4 w-32 mt-4" /> {/* Margine Label */}
          <Skeleton className="h-8 w-32" /> {/* Margine Value */}
        </div>
      </div>

      {/* Middle section: Progress bar */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-48" /> {/* Analisi Margine Label */}
            <Skeleton className="h-4 w-24" /> {/* Previsto Label */}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-8 w-20" /> {/* Percentage */}
            <Skeleton className="h-3 w-16" /> {/* Effettivo Label */}
          </div>
        </div>
        <Skeleton className="h-3 w-full rounded-full mt-2" /> {/* Progress Bar */}
        <div className="flex justify-between mt-1">
          <Skeleton className="h-3 w-32" /> {/* Sub label L */}
          <Skeleton className="h-3 w-32" /> {/* Sub label R */}
        </div>
      </div>

      {/* Bottom section: Steps */}
      <div className="flex flex-col gap-4 mt-6">
        <Skeleton className="h-5 w-40" /> {/* Stato della trattativa Label */}
        <div className="flex justify-between items-center gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3 w-full relative">
              <Skeleton className="h-2 w-full absolute top-2 z-0" /> {/* Line connecting */}
              <Skeleton className="h-6 w-6 rounded-full z-10" /> {/* Step circle */}
              <div className="flex flex-col gap-1 items-center mt-2">
                <Skeleton className="h-3 w-16" /> {/* Step text line 1 */}
                <Skeleton className="h-3 w-12" /> {/* Step text line 2 */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
