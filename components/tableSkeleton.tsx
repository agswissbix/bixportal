import { Skeleton } from "@/components/ui/skeleton"

export function TableSkeleton() {
  return (
    <div className="w-full h-full relative rounded-lg overflow-auto">
      <table className="min-w-full table-fixed text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 bg-table-background border-table-border rounded-t-2xl rounded-b-xl">
        <thead className="sticky top-0 z-20 text-xs text-gray-700 uppercase bg-table-header dark:text-gray-400 rounded-t-xl">
          <tr>
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i} className="px-4 py-4 min-w-[100px]">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 15 }).map((_, rowIndex) => (
            <tr key={rowIndex} className="theme-table border-b">
              {Array.from({ length: 6 }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-[200px] opacity-70" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
