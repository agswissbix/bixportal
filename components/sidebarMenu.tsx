import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { Home, Package, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import '@/app/globals.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
            selectedMenu?: String;
        }
        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            menuItems: Record<string, MenuItem>;
        }

        interface MenuItem {
            id: string;
            title: string;
            icon: React.ElementType; 
            href?: string;
            subItems?: SubItem[];
          }
          
        interface SubItem {
            id: string;
            title: string;
            href: string;
          }

export default function SidebarMenu({ selectedMenu }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "" : selectedMenu;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                menuItems: {}
            };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                menuItems: {
                    home: {
                      id: "home",
                      title: "Home",
                      icon: Home, // Nome dell'icona come stringa (se stai utilizzando stringhe nel progetto)
                      href: "#",
                      subItems: [], // Aggiunto un array vuoto per uniformità con la struttura
                    },
                    prodotti: {
                      id: "prodotti",
                      title: "Prodotti",
                      icon: Package, // Nome dell'icona come stringa
                      subItems: [
                        { id: "cat1", title: "Categoria 1", href: "#" },
                        { id: "cat2", title: "Categoria 2", href: "#" },
                        { id: "cat3", title: "Categoria 3", href: "#" },
                        { id: "cat4", title: "Categoria 4", href: "#" },
                      ],
                    },
                    contatti: {
                      id: "contatti",
                      title: "Contatti",
                      icon: Mail, // Nome dell'icona come stringa
                      href: "#",
                      subItems: [], // Aggiunto per coerenza
                    },
                  },
            };

            

            //DATI DEL COMPONENTE
            
                const [openDropdown, setOpenDropdown] = useState('');
                const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    //FUNZIONI DEL COMPONENTE
                const handleMouseEnter = (section: string) => {
                    setActiveTooltip(section);
                };
            
                const handleMouseLeave = () => {
                    setActiveTooltip(null);
                };
            
                const handleMenuClick = (item: string) => {
                    // Gestione interna del click
                    //setSelectedMenu(item); // Comunica al componente padre la selezione
                  };


    // IMPOSTAZIONE DELLA RESPONSE
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_sidebarmenu_items', // riferimento api per il backend
        };
    }, [selectedMenu]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(data) => (
                            
                <div id="sidebar" className="bg-sidebar text-white h-full xl:w-full w-full transition-all duration-300">
                    <ul className="list-none p-0 m-0">
                    <span className="block px-12 py-2 hover:bg-gray-700 transition-colors" onClick={() => handleMenuClick('TelAmicoCalendario')}> 
                            Calendario TelAmico
                    </span>
                    <span className="block px-12 py-2 hover:bg-gray-700 transition-colors" onClick={() => handleMenuClick('TelAmicoAgenda')}> 
                            Agenda TelAmico
                    </span>
                    <span className="block px-12 py-2 hover:bg-gray-700 transition-colors" onClick={() => handleMenuClick('Calendario')}> 
                            Agenda TelAmico
                    </span>
                    <span className="block px-12 py-2 hover:bg-gray-700 transition-colors" onClick={() => handleMenuClick('PitCalendar')}> 
                            PitCalendar
                    </span>
                            {Object.entries(data['menuItems']).map(([key, item]) => (
                            <li key={item.id} className="border-b border-gray-700 relative" onMouseEnter={() => handleMouseEnter(item.id)} onMouseLeave={handleMouseLeave}>
                                {item.subItems ? (
                                    // Dropdown section
                                    <div>
                                        <button onClick={() => setOpenDropdown(openDropdown === item.id ? '' : item.id)} className="w-full flex items-center justify-between px-6 py-4 hover:text-primary focus:text-primary transition-colors" >
                                            <div className="flex items-center min-w-[20px]">
                                                <item.icon className="w-5 h-5 min-w-[20px]"/>
                                                <span className="ml-3 xl:opacity-100 opacity-0 transition-opacity duration-300">{item.title}</span>
                                            </div>
                                            <span className="xl:block hidden">
                                                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${ openDropdown === item.id ? '-rotate-180' : ''}`}
                                                />
                                            </span>
                                        </button>
        
                                        {/* Tooltip for mobile */}
                                        {activeTooltip === item.id && (
                                            <div
                                                className="absolute left-full top-0 ml-2 bg-gray-700 rounded-md shadow-lg py-2 min-w-[160px] z-50 xl:hidden">
                                                <div className="px-4 py-2 font-semibold border-b border-gray-600">
                                                    {item.title}
                                                </div>
                                                <ul className="py-1">
                                                    {item.subItems.map((subItem) => (
                                                        <li key={subItem.id}  >
                                                            <span  className="block px-4 py-2 hover:bg-gray-600 transition-colors" onClick={() => console.log('Test funzionante')}> {subItem.title} </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
        
                                        {/* Dropdown menu for desktop */}
                                        <div
                                            className={`xl:block hidden overflow-hidden transition-all duration-300 ease-in-out ${
                                                openDropdown === item.id ? 'max-h-[800]' : 'max-h-0'
                                            }`}
                                        >
                                            <ul className="py-2 ml-6">
                                                {item.subItems.map((subItem) => (
                                                    <li key={subItem.id} className='cursor-pointer'>
                                                        <span className="block px-12 py-2 hover:text-primary transition-colors" onClick={() => handleMenuClick(subItem.id)}> 
                                                            {subItem.title}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    // Regular link section
                                    <a
                                        href={item.href}
                                        className="flex items-center px-6 py-4 hover:bg-gray-700 transition-colors"
                                    >
                                        <item.icon className="w-5 h-5 min-w-[20px]" />
                                        <span className="ml-3 xl:opacity-100 opacity-0 transition-opacity duration-300">
                            {item.title}
                        </span>
                                    </a>
                                )}
        
                                {/* Tooltip for regular items */}
                                {!item.subItems && activeTooltip === item.id && (
                                    <div className="absolute left-full top-0 ml-2 bg-gray-700 rounded-md shadow-lg py-2 px-4 whitespace-nowrap z-50 xl:hidden">
                                        {item.title}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
    )}
        </GenericComponent>
    );
};
