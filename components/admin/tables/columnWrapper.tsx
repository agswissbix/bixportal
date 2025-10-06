import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const ColumnWrapper: React.FC<{
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
}> = ({ title, icon, children, isOpen, onToggle }) => {
  return (
    <div className="flex flex-col h-full relative">
      {/* Collapsibility Button and Header */}
      <div
        className={`flex-none flex items-center p-4 border-b cursor-pointer transition-colors duration-150 ${
          isOpen ? 'justify-between hover:bg-gray-100' : 'justify-center hover:bg-gray-200 h-full'
        }`}
        onClick={onToggle}
      >
        {isOpen ? (
          <>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {icon} {title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-500 hover:text-blue-600"
              onClick={(e: any) => { e.stopPropagation(); onToggle(); }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-2 [writing-mode:vertical-lr] transform rotate-180">
            <span className="text-sm font-medium text-gray-500 whitespace-nowrap tracking-wider">{title}</span>
            <ChevronLeft className="h-4 w-4 mt-2 text-gray-400 transform rotate-90" />
          </div>
        )}
      </div>

      {/* Content Area (Visible only when open) */}
      <div className={`flex-1 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}>
        {children}
      </div>
    </div>
  )
}