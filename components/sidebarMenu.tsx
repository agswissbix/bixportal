import { useMemo, useState, useEffect, useContext } from "react"
import Image from "next/image"
import { useApi } from "@/utils/useApi"
import GenericComponent from "./genericComponent"
import {
  Home,
  Package,
  Mail,
  ChevronDown,
  HelpCircle,
  Menu,
  X,
  type LucideIcon,
  Settings,
  Lock,
  LogOut,
  Star,
} from "lucide-react"
import { useRecordsStore } from "./records/recordsStore"
import { AppContext } from "@/context/appContext"
import { Menu as HMenu, MenuButton, MenuItems, MenuItem } from "@headlessui/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const isDev = false

interface PropsInterface {}

interface ResponseInterface {
  menuItems: Record<string, MenuItem>
  otherItems: SubItem[]
  userid?: string
  favoriteTables?: string[]
  isAdmin?: boolean
}

interface SubItem {
  id: string
  title: string
  href: string
}

interface MenuItem {
  id: string
  title: string
  icon: string
  href?: string
  subItems?: SubItem[]
}

const iconMap: Record<string, LucideIcon> = {
  Home: Home,
  Package: Package,
  Mail: Mail,
}

export default function Sidebar({}: PropsInterface) {
  const responseDataDEFAULT: ResponseInterface = {
    menuItems: {},
    otherItems: [],
  }

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
  }

  const router = useRouter()

  const [openDropdown, setOpenDropdown] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { setSelectedMenu, userid, timestamp, theme } = useRecordsStore()
  const { user, activeServer } = useContext(AppContext)

  const handleMenuClick = (item: string) => {
    setSelectedMenu(item)
    setIsSidebarOpen(false)
  }

  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT)

  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "get_sidebarmenu_items",
    }
  }, [])

  const { response, loading, error, elapsedTime } =
    !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null, elapsedTime: null }

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response)
    }
  }, [response, responseData])

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="Sidebar" elapsedTime={elapsedTime}>
      {(data) => (
        <>
          {/* Bottone toggle SOLO su mobile */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-md shadow-lg z-50 xl:hidden"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Overlay solo su mobile */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* SIDEBAR */}
          <div
            id="sidebar"
            className={`
              fixed top-0 left-0 z-40 h-full w-80 bg-sidebar text-primary-foreground shadow-lg transition-transform duration-300 flex flex-col
              xl:relative xl:translate-x-0 xl:w-full
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            {/* HEADER FISSO - Logo */}
            <div className="flex-shrink-0 py-6 px-4">
              <Image
                src={
                    theme === "bixhub"
                        ? `/bixdata/logos/bixhub.png`
                        : `/bixdata/logos/bixdata.png`
                }
                alt="Logo"
                width={1000}
                height={1000}
                className="h-16 w-auto m-auto hover:cursor-pointer hover:scale-105 hover:translate-y-1 transition-all"
                onClick={() => window.location.reload()}
              />
            </div>

            {/* CONTENUTO SCROLLABILE */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {/* MENU ITEMS */}
              <ul className="list-none p-0 m-0">
                {activeServer === "telamico" ? (
                  <>
                    <span
                      className="block px-12 py-2 hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => handleMenuClick("TelAmicoCalendario")}
                    >
                      Calendario TelAmico
                    </span>

                    <span
                      className="block px-12 py-2 hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => handleMenuClick("TelAmicoAgenda")}
                    >
                      Agenda TelAmico
                    </span>

                    <span
                      className="block px-12 py-2 hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => handleMenuClick("Calendario")}
                    >
                      Agenda TelAmico
                    </span>
                  </>
                ) : activeServer === "swissbix" ? (
                  <>
                    <span
                      className="block px-12 py-2 hover:bg-gray-700 transition-colors cursor-pointer"
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
                              <Icon className="w-5 h-5" />
                              <span className="text-md ml-3">{item.title}</span>
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
                                    className="text-sm block px-8 py-2 hover:bg-secondary hover:text-secondary-foreground transition-colors"
                                    onClick={() => handleMenuClick(subItem.id)}
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
                          className="flex items-center px-6 py-4 hover:bg-secondary hover:text-secondary-foreground transition-colors"
                          onClick={() => item.id && handleMenuClick(item.id)}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="ml-3">{item.title}</span>
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* FOOTER FISSO - Menu utente */}
            <div className="flex-shrink-0 border-t border-secondary">
              <HMenu as="div" className="relative ml-4 mb-4 mt-4">
                <div className="flex items-center gap-2">
                  <MenuButton className="relative flex rounded-full bg-white text-sm focus:outline-none">
                    <img
                      src={`/api/media-proxy?url=userProfilePic/${userid}.png?t=${timestamp}`}
                      alt="profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-400"
                      onError={(e) => {
                        const target = e.currentTarget
                        if (!target.src.includes("default.jpg")) {
                          target.src = "/api/media-proxy?url=userProfilePic/default.jpg"
                        }
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-sidebar" />
                  </MenuButton>
                  <span className="text-sm font-medium truncate">{user}</span>
                </div>

                <MenuItems className="absolute right-0 bottom-full mb-2 w-48 origin-bottom-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <MenuItem>
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-black truncate">{user}</p>
                      <p className="text-xs text-gray-700">Profilo attivo</p>
                    </div>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      onClick={() => setSelectedMenu("userSettings")}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span>Cambia password</span>
                      </div>
                    </a>
                  </MenuItem>
                  <div className="my-1 h-px bg-gray-200" />
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        <span>Esci</span>
                      </div>
                    </a>
                  </MenuItem>
                </MenuItems>
              </HMenu>
            </div>
          </div>
        </>
      )}
    </GenericComponent>
  )
}