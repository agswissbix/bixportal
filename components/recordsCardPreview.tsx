// 📄 RecordsTablePreview.jsx
import React from 'react';
import { PlusIcon, RefreshCcw } from 'lucide-react';

const RecordsTablePreview = () => {
  return (
    <div className="w-full flex flex-col lg:flex-row justify-center items-center p-6 space-y-8 lg:space-y-0 lg:space-x-8 bg-white-100 dark:bg-gray-900 mx-auto">

      {/* Table Preview Section */}
      <div className="w-full lg:w-2/3 max-w-3xl p-4 rounded-lg bg-records-background dark:bg-gray-800 overflow-x-auto">
        <div className="flex justify-between items-center p-2 rounded-t-lg flex-wrap gap-2">
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm font-medium text-primary hover:text-primaryHover dark:bg-red-900 rounded-lg">
              Table
            </button>
            <button className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-primary">
              Kanban
            </button>
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm font-medium text-primary hover:text-primaryHover">
              <PlusIcon className="h-4 w-4" />
            </button>
            <button className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-primary">
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <table className="bg-table-background min-w-[400px] w-full rounded-t-2xl">
          <thead className="bg-table-header">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">City</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-table-hover transition-colors">
              <td className="border-t px-4 py-2 text-sm text-table-text">A01</td>
              <td className="border-t px-4 py-2 text-sm text-table-text">John Doe</td>
              <td className="border-t px-4 py-2 text-sm text-table-text">New York</td>
            </tr>
            <tr className="hover:bg-table-hover transition-colors">
              <td className="border-t px-4 py-2 text-sm text-table-text">A02</td>
              <td className="border-t px-4 py-2 text-sm text-table-text">Jane Smith</td>
              <td className="border-t px-4 py-2 text-sm text-table-text">London</td>
            </tr>
            <tr className="hover:bg-table-hover transition-colors">
              <td className="border-t px-4 py-2 text-sm text-table-text">A03</td>
              <td className="border-t px-4 py-2 text-sm text-table-text">Peter Jones</td>
              <td className="border-t px-4 py-2 text-sm text-table-text">Paris</td>
            </tr>
          </tbody>
          <tfoot className="bg-table-header rounded-b-lg">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-left text-sm font-semibold text-table-text">
                Total: 3
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Card Preview Section */}
      <div className="h-auto lg:h-100 w-full sm:w-96 max-w-md p-4 rounded-lg shadow-lg bg-card-background dark:bg-gray-800 border-2 border-table-border">
        <div className="bg-card-header p-2 rounded-t-lg">
          <div className="bg-primary p-4 rounded-md shadow-md">
            <span className="text-white font-bold">Badge</span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex space-x-2">
            <button className=" py-1 text-sm font-medium text-primary hover:text-primaryHover dark:bg-red-900 rounded-lg">
              Table
            </button>
            <button className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-primary">
              Kanban
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 text-card-text">
            <div>
              <label className="block text-sm font-medium">Estimated hours</label>
              <input
                type="text"
                className="mt-1 block w-full p-2 border border-card-border rounded-md shadow-sm bg-card-input"
                placeholder="Enter a value"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Company</label>
              <input
                type="text"
                className="mt-1 block w-full p-2 border border-card-border rounded-md shadow-sm bg-card-input"
                value="SWISSBIX SA"
                readOnly
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Status</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  className="block w-full p-2 border border-card-border rounded-md shadow-sm bg-card-input"
                  value="Project in progress"
                  readOnly
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
              {/* Pulsante Salva dentro la card */}
              <button className="mt-4 w-1/4 px-4 py-2 text-sm font-semibold rounded-md bg-secondary text-white hover:bg-secondaryHover">
                Salva
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordsTablePreview;
