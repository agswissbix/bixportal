import React, { useMemo, useContext, useState, useEffect } from 'react';
import Image from 'next/image';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { Home, Package, Mail, ChevronDown, ChevronUp, HelpCircle, LucideIcon } from 'lucide-react';
import '@/app/globals.css';
import { useRecordsStore } from './records/recordsStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
interface PropsInterface {
}

interface ResponseInterface {
    menuItems: Record<string, MenuItem>;
}

interface SubItem{
    id: string;
    title: string;
    href: string;
}

interface MenuItem {
    id: string;
    title: string;
    icon: string;
    href?: string;
    subItems?: SubItem[];
}



// Mappa delle icone
const iconMap: Record<string, LucideIcon> = {
    'Home': Home,
    'Package': Package,
    'Mail': Mail,
};

export default function SidebarMenu({  }: PropsInterface) {
    // DATI
    const devPropExampleValue = isDev ? "" : "";

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
                icon: "Home",
                href: "#",
                subItems: [],
            },
            prodotti: {
                id: "prodotti",
                title: "Prodotti",
                icon: "Package",
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
                icon: "Mail",
                href: "#",
                subItems: [],
            },
        },
    };

    //DATI DEL COMPONENTE
    const [openDropdown, setOpenDropdown] = useState('');
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const {setSelectedMenu,selectedMenu} = useRecordsStore();

    // DATI DEL CONTESTO
    const { user, activeServer } = useContext(AppContext);

    //FUNZIONI DEL COMPONENTE
    const handleMouseEnter = (section: string) => {
        setActiveTooltip(section);
    };

    const handleMouseLeave = () => {
        setActiveTooltip(null);
    };

    const handleMenuClick = (item: string) => {
        setSelectedMenu(item);
    };

    // IMPOSTAZIONE DELLA RESPONSE
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_sidebarmenu_items',
        };
    }, []); // Dipendenza vuota: viene eseguito solo al primo rendering
    

    // CHIAMATA AL BACKEND (solo se non in sviluppo)
    const { response, loading, error, elapsedTime  } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null, elapsedTime: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    return (
        <GenericComponent response={responseData} loading={loading} error={error} title="SidebarMenu" elapsedTime={elapsedTime}> 
            {(data) => (
                <div id="sidebar" className="bg-sidebar text-white h-full xl:w-full w-full transition-all duration-300 rounded-r-xl shadow-lg">
                    <Image 
                        src={`/bixdata/logos/${activeServer}.png`}
                        //src={`/bixdata/logos/${activeServer === 'swissbix' ? 'bixdata' : activeServer === 'pitservice' ? 'pitservice' : 'default'}.png`}
                        alt={activeServer ?? ''}
                        width={1000}
                        height={1000}
                        className="h-16 w-auto m-auto hover:cursor-pointer hover:scale-105 hover:translate-y-1 transition-all ease-in-out duration-150"
                        onClick={() => handleMenuClick('Home')}
                        priority
                    />
                    <ul className="list-none p-0 m-0">
                    {activeServer === 'telamico' ? (
                        <>
                            <span className="block px-12 py-2 hover:bg-gray-700 transition-colors" onClick={() => handleMenuClick('TelAmicoCalendario')}> 
                                Calendario TelAmico
                            </span>

                            <span className="block px-12 py-2 hover:bg-gray-700 transition-colors" onClick={() => handleMenuClick('TelAmicoAgenda')}> 
                                Agenda TelAmico
                            </span>

                            <span className="block px-12 py-2 hover:bg-gray-700 transition-colors" onClick={() => handleMenuClick('Calendario')}> 
                                Agenda TelAmico
                            </span>
                        </>
                    ) : null
                    }
                    {/*
                        <span className="block px-12 py-2 hover:bg-gray-700 transition-colors" onClick={() => handleMenuClick('Dashboard')}> 
                            Dashboard
                        </span>
                    */}
                        {Object.entries(data['menuItems']).map(([key, item]) => {
                            const Icon = iconMap[item.icon] || HelpCircle;
                            return (
                                <li key={item.id} className="" onMouseEnter={() => handleMouseEnter(item.id)} onMouseLeave={handleMouseLeave}>
                                    {item.subItems ? (
                                        // Dropdown section
                                        <div>
                                            <button onClick={() => setOpenDropdown(openDropdown === item.id ? '' : item.id)} className="w-full text-md flex items-center justify-between px-6 py-4 hover:text-primary focus:text-primary transition-colors">
                                                <div className="flex items-center min-w-[20px]">
                                                    <Icon className="w-5 h-5 min-w-[20px]"/>
                                                    <span className="text-md ml-3 xl:opacity-100 opacity-0 transition-opacity duration-300">{item.title}</span>
                                                </div>
                                                <span className="xl:block hidden">
                                                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openDropdown === item.id ? '-rotate-180' : ''}`} />
                                                </span>
                                            </button>

                                            {/* Tooltip for mobile */}
                                            {activeTooltip === item.id && (
                                                <div className="absolute left-full top-0 ml-2 bg-gray-700 rounded-md shadow-lg py-2 min-w-[160px] z-50 xl:hidden">
                                                    <div className="px-4 py-2 font-semibold border-b border-gray-600">
                                                        {item.title}
                                                    </div>
                                                    <ul className="py-1">
                                                        {item.subItems.map((subItem) => (
                                                            <li key={subItem.id}>
                                                                <span className="block px-4 py-2 hover:bg-gray-600 transition-colors" onClick={() => console.log('Test funzionante')}>{subItem.title}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Dropdown menu for desktop */}
                                            <div className={`xl:block hidden overflow-hidden transition-all duration-300 ease-in-out ${openDropdown === item.id ? 'max-h-[800px]' : 'max-h-0'}`}>
                                                <ul className="py-1 ml-6">
                                                    {item.subItems.map((subItem) => (
                                                        <li key={subItem.id} className='cursor-pointer'>
                                                            <span className="text-gray-200 text-sm block px-8 py-2 hover:text-primary transition-colors" onClick={() => handleMenuClick(subItem.id)}>{subItem.title}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        // Regular link section
                                        <a href={item.href} className="flex items-center px-6 py-4 hover:bg-gray-700 transition-colors">
                                            <Icon className="w-5 h-5 min-w-[20px]" />
                                            <span className="ml-3 xl:opacity-100 opacity-0 transition-opacity duration-300">{item.title}</span>
                                        </a>
                                    )}

                                    {/* Tooltip for regular items */}
                                    {!item.subItems && activeTooltip === item.id && (
                                        <div className="absolute left-full top-0 ml-2 bg-gray-700 rounded-md shadow-lg py-2 px-4 whitespace-nowrap z-50 xl:hidden">
                                            {item.title}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </GenericComponent>
    );
}