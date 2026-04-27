import React from "react";
import Link from "next/link";
import { FileText, ChevronRight, PhoneCall } from "lucide-react";

export default function UtilitiesHub() {
  const utilities = [
    {
      title: "Utility CSV Interpreter",
      description: "Carica e visualizza i contenuti dei tuoi file CSV in modo chiaro e formattato.",
      href: "/utility/utility-csvinterpreter",
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      bgColor: "bg-blue-50",
    },
    {
      title: "Utility 3cx Log",
      description: "Carica il CSV dei log 3CX ed analizza qualità, Jitter e Packet Loss per i vari UserAgent.",
      href: "/utility/utility-3cxlog",
      icon: <PhoneCall className="w-8 h-8 text-green-600" />,
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Strumenti di Utility</h1>
          <p className="text-gray-500 text-lg">
            Seleziona uno strumento dalla lista per continuare.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {utilities.map((util, index) => (
            <Link
              key={index}
              href={util.href}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-1 block"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-4 rounded-xl ${util.bgColor} mb-4 inline-block`}>
                    {util.icon}
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {util.title}
                </h3>
                <p className="text-gray-500 text-sm">
                  {util.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
