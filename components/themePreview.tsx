// 📄 ThemePreview.jsx
import React from "react";

interface ThemePreviewProps {
  themeName: string;
}

const themeColors = {
  'default': { sidebar: '#074048', header: '#ffd900', elements: '#ff5b5b', text: '#d1d5db' },
  'oceanic': { sidebar: '#0f1c2e', header: '#20c997', elements: '#007bff', text: '#d1d5db' },
  'sunset': { sidebar: '#5b0f49', header: '#f9d423', elements: '#d82b4a', text: '#d1d5db' },
  'forest': { sidebar: '#1d4320', header: '#f0b721', elements: '#4a914c', text: '#d1d5db' },
  'bixhub': { sidebar: '#282828', header: '#ffffff', elements: '#ff9900', text: '#9ca3af' },
};

const ThemePreview: React.FC<ThemePreviewProps> = ({ themeName }) => {
  return (
    <div
      className={`${themeName} w-48 h-32 rounded-lg shadow-xl overflow-hidden border border-card-border bg-card`}
    >
      {/* Sidebar */}
      <div className="bg-sidebar w-12 h-full float-left flex flex-col p-2 space-y-2">
        <div className={`${themeName} h-4 w-4 rounded-full bg-primary`}></div>
        <div className="h-2 w-full rounded-sm opacity-50 bg-border"></div>
        <div className="h-2 w-full rounded-sm opacity-50 bg-border"></div>
        <div className="h-2 w-full rounded-sm opacity-50 bg-border"></div>
      </div>

      {/* Main content area */}
      <div className="w-36 h-full float-right p-2 flex flex-col space-y-2">
        {/* Header/Toolbar */}
        <div className="flex justify-between items-center h-4">
          <div className="flex space-x-1 items-center">
            <div className="w-6 h-3 rounded-sm bg-primary"></div>
            <div className="w-6 h-3 rounded-sm bg-primary"></div>
          </div>
          <div className="flex space-x-1 items-center">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <div className="w-3 h-3 rounded-full bg-secondary"></div>
          </div>
        </div>

        {/* Search bar */}
        <div className="w-full h-4 rounded-sm opacity-25 bg-secondary"></div>

        {/* Table/List content */}
        <div className="space-y-1">
          <div className="w-full h-2 rounded-sm bg-primary"></div>
          <div className="w-full h-2 rounded-sm opacity-50 bg-primary"></div>
          <div className="w-full h-2 rounded-sm opacity-50 bg-primary"></div>
          <div className="w-full h-2 rounded-sm opacity-50 bg-primary"></div>
        </div>

        {/* Right Panel placeholder */}
        <div className="flex-1 flex justify-end items-end">
          <div className="w-1/3 h-10 rounded-sm bg-tertiary"></div>
        </div>
      </div>
    </div>
  );
};

export default ThemePreview;
