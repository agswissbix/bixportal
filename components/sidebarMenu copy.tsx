"use client"

import { useMemo, useContext, useState, useEffect } from "react"
import Image from "next/image"
import { useApi } from "@/utils/useApi"
import GenericComponent from "./genericComponent"
import { AppContext } from "@/context/appContext"
import {
  Home,
  Package,
  Mail,
  ChevronDown,
  HelpCircle,
  type LucideIcon,
  Star,
  LucideMenu,
  LogOut,
  Settings,
  Lock,
} from "lucide-react"
import "@/app/globals.css"
import { useRecordsStore } from "./records/recordsStore"
import { useRouter } from "next/navigation"
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react"
import Link from "next/link"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
// FLAG PER LO SVILUPPO
const isDev = false

// INTERFACCE
type PropsInterface = {}

interface ResponseInterface {
  menuItems: Record<string, any>
  otherItems: SubItem[]
  favoriteTables?: string[]
  userid?: string // Aggiunto per l'ID utente
  isAdmin?: boolean // Aggiunto per verificare se l'utente è admin
}

interface SubItem {
  id: string
  title: string
  href: string
}

// Mappa delle icone
const iconMap: Record<string, LucideIcon> = {
  Home: Home,
  Package: Package,
  Mail: Mail,
}

export default function SidebarMenu({}: PropsInterface) {
  // DATI
  const devPropExampleValue = isDev ? "" : ""

  // DATI RESPONSE DI DEFAULT
  const responseDataDEFAULT: ResponseInterface = {
    menuItems: {},
    otherItems: [],
    favoriteTables: [],
  }

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
    otherItems: [],
    favoriteTables: [],
  }

  //DATI DEL COMPONENTE
  const [openDropdown, setOpenDropdown] = useState("favorites")
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  const { setSelectedMenu, selectedMenu, setUserid, userid, theme, timestamp } = useRecordsStore()

  // DATI DEL CONTESTO
  const { user, activeServer } = useContext(AppContext)

  //FUNZIONI DEL COMPONENTE
  const handleMouseEnter = (section: string) => {
    setActiveTooltip(section)
  }

  const handleMouseLeave = () => {
    setActiveTooltip(null)
  }

  const handleMenuClick = (item: string) => {
    setSelectedMenu(item)
  }

  // IMPOSTAZIONE DELLA RESPONSE
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT)

  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "get_sidebarmenu_items",
    }
  }, []) // Dipendenza vuota: viene eseguito solo al primo rendering

  // CHIAMATA AL BACKEND (solo se non in sviluppo)
  const apiResponse = useApi<ResponseInterface>(payload)
  const { response, loading, error, elapsedTime } = apiResponse

  // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo)
  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response)
      if (response.userid) {
        setUserid(response.userid)
      }
    }
  }, [response, responseData])

  return (
    <GenericComponent
      response={responseData}
      loading={loading}
      error={error}
      title="SidebarMenu"
      elapsedTime={elapsedTime}
    >
      {(data) => (
        <>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="fixed top-4 left-4 z-50 lg:hidden bg-sidebar text-primary-foreground p-2 rounded-md shadow-lg"
          >
            <LucideMenu className="w-6 h-6" />
          </button>

          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          <div
            id="sidebar"
            className={`
                            bg-sidebar text-primary-foreground h-full transition-all duration-300 rounded-r-xl shadow-lg flex flex-col justify-between
                            fixed lg:relative z-40 lg:z-auto
                            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                            w-80 lg:w-full
                        `}
          >
            <div>
              <div className="flex justify-between items-center p-4 lg:hidden">
                <span className="text-lg font-semibold">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-primary-foreground hover:bg-gray-700 p-1 rounded"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <Image
                src={
                  theme == "default"
                    ? `/bixdata/logos/${activeServer}.png`
                    : theme == "bixhub"
                      ? `/bixdata/logos/bixhub.png`
                      : `/bixdata/logos/${activeServer || "_" + theme}.png`
                }
                alt={activeServer ?? ""}
                width={1000}
                height={1000}
                className="h-16 w-auto m-auto hover:cursor-pointer hover:scale-105 hover:translate-y-1 transition-all ease-in-out duration-150"
                onClick={() => window.location.reload()}
              />
              <ul className="list-none p-0 m-0">
                {activeServer === "telamico" ? (
                  <>
                    <span
                      className="block px-12 py-2 hover:bg-gray-700 transition-colors"
                      onClick={() => handleMenuClick("TelAmicoCalendario")}
                    >
                      Calendario TelAmico
                    </span>

                    <span
                      className="block px-12 py-2 hover:bg-gray-700 transition-colors"
                      onClick={() => handleMenuClick("TelAmicoAgenda")}
                    >
                      Agenda TelAmico
                    </span>

                    <span
                      className="block px-12 py-2 hover:bg-gray-700 transition-colors"
                      onClick={() => handleMenuClick("Calendario")}
                    >
                      Agenda TelAmico
                    </span>
                  </>
                ) : activeServer === "swissbix" ? (
                  <>
                    <span
                      className="block px-12 py-2 hover:bg-gray-700 transition-colors"
                      onClick={() => handleMenuClick("Dashboard")}
                    >
                      Dashboard
                    </span>
                  </>
                ) : null}
                {/*
                                    <span className="block px-12 py-2 hover:bg-gray-700 transition-colors" onClick={() => handleMenuClick('Dashboard')}> 
                                        Dashboard
                                    </span>
                                */}
                {activeServer === "belotti" ? (
                  <>
                    {responseData.otherItems.map((item) => (
                      <span
                        key={item.id}
                        className="block px-12 py-2 hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => handleMenuClick(item.id)}
                      >
                        {item.description}
                      </span>
                    ))}
                  </>
                ) : activeServer === "winteler" ? (
                  <>
                    <span
                      className="cursor-pointer block px-12 py-2 hover:bg-gray-700 transition-colors"
                      onClick={() => router.push("/custom/winteler")}
                    >
                      Winteler custom
                    </span>
                  </>
                ) : responseData.isAdmin ? (
                  <>
                    <Link
                      href="/bixadmin/admin"
                      target="_blank"
                      className="cursor-pointer block px-12 py-2 hover:bg-gray-700 transition-colors"
                    >
                      Admin Settings
                    </Link>
                  </>
                ) : null}

                {responseData.favoriteTables && responseData.favoriteTables.length > 0 && (
                  <li>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === "favorites" ? "" : "favorites")}
                      className="w-full text-md flex items-center justify-between px-6 py-4 hover:bg-secondary hover:text-secondary-foreground focus:text-primary-foreground transition-colors"
                    >
                      <div className="flex items-center min-w-[20px]">
                        <Star className="w-5 h-5 min-w-[20px]" />
                        <span className="text-md ml-3 opacity-100 transition-opacity duration-300">Preferiti</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-300 ${openDropdown === "favorites" ? "-rotate-180" : ""}`}
                      />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${openDropdown === "favorites" ? "max-h-[800px]" : "max-h-0"}`}
                    >
                      <ul className="py-1 ml-6">
                        {responseData.favoriteTables.map((table) => (
                          <li key={table.id}>
                            <span
                              className="text-primary-foreground text-sm block px-8 py-2 hover:bg-secondary hover:text-secondary-foreground transition-colors cursor-pointer"
                              onClick={() => {
                                handleMenuClick(table.tableid)
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              {table.tableid}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                )}

                {Object.entries(data["menuItems"]).map(([key, item]) => {
                  const Icon = iconMap[item.icon] || HelpCircle
                  return (
                    <li key={item.id} className="">
                      {item.subItems ? (
                        <div>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === item.id ? "" : item.id)}
                            className="w-full text-md flex items-center justify-between px-6 py-4 hover:bg-secondary hover:text-secondary-foreground transition-colors"
                          >
                            <div className="flex items-center min-w-[20px]">
                              <Icon className="w-5 h-5 min-w-[20px]" />
                              <span className="text-md ml-3 opacity-100 transition-opacity duration-300">
                                {item.title}
                              </span>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 transition-transform duration-300 ${openDropdown === item.id ? "-rotate-180" : ""}`}
                            />
                          </button>

                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${openDropdown === item.id ? "max-h-[800px]" : "max-h-0"}`}
                          >
                            <ul className="py-1 ml-6">
                              {item.subItems.map((subItem) => (
                                <li key={subItem.id} className="cursor-pointer">
                                  <span
                                    className="text-primary-foreground text-sm block px-8 py-2 hover:bg-secondary hover:text-secondary-foreground transition-colors"
                                    onClick={() => {
                                      handleMenuClick(subItem.id)
                                      setIsMobileMenuOpen(false)
                                    }}
                                  >
                                    {subItem.title}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={item.href}
                          className="flex items-center px-6 py-4 hover:bg-gray-700 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon className="w-5 h-5 min-w-[20px]" />
                          <span className="ml-3 opacity-100 transition-opacity duration-300">{item.title}</span>
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
            <Menu as="div" className="relative ml-4 mb-4">
              <div className="flex items-center gap-2">
                <MenuButton className="relative flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">Open user menu</span>
                  <img
                    src={`/api/media-proxy?url=userProfilePic/${userid}.png?t=${timestamp}`}
                    alt="ciao"
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-400"
                    onError={(e) => {
                      const target = e.currentTarget
                      if (!target.src.includes("default.jpg")) {
                        target.src = "/api/media-proxy?url=userProfilePic/default.jpg"
                      }
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-gradient-to-br from-indigo-200 to-green-500 rounded-full border-2 border-gray-800 shadow-lg"></div>
                </MenuButton>
                <span className="text-white text-sm font-medium">{user}</span>
              </div>

              <MenuItems
                transition
                className="absolute right-0 bottom-full w-48 origin-bottom-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 transition focus:outline-none"
              >
                <MenuItem>
                  <div className="px-4 py-3 border-b border-gray-200">
                    {" "}
                    {/* Divisore leggero */}
                    <p className="text-sm font-medium text-black">{user}</p>
                    <p className="text-xs text-gray-700">Profilo attivo</p>
                  </div>
                </MenuItem>
                <MenuItem>
                  <a
                    href="#"
                    onClick={() => setSelectedMenu("userSettings")}
                    className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span>Impostazioni</span>
                    </div>
                  </a>
                </MenuItem>
                <MenuItem>
                  <a
                    href="#"
                    onClick={() => router.push("/change-password")}
                    className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>Cambia password</span>
                    </div>
                  </a>
                </MenuItem>
                <div className="my-1 h-px bg-gray-200" /> {/* Divisore orizzontale */}
                <MenuItem>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-red-500 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      <span>Esci</span>
                    </div>
                  </a>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </>
      )}
    </GenericComponent>
  )
}
