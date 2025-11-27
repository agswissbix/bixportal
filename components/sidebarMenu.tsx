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
  Settings,
  Lock,
  LogOut,
  Star,
  SquareArrowOutUpRight,
} from "lucide-react"
import * as Icons from "lucide-react"
import { useRecordsStore } from "./records/recordsStore"
import { AppContext } from "@/context/appContext"
import { Menu as HMenu, MenuButton, MenuItems, MenuItem } from "@headlessui/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { logoutUser } from "@/utils/auth"

const isDev = false

interface PropsInterface {}

interface ResponseInterface {
  menuItems: Record<string, MenuItem>
  otherItems: SubItem[]
  userid?: string
  favoriteTables?: string[]
}

interface SubItem {
  id: string
  title: string
  href: string
  order: number | null
}

interface MenuItem {
  id: string
  title: string
  icon: string
  href?: string
  order: number | null
  subItems?: SubItem[]
}

const iconMap: Record<string, any> = {
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
        order: 1,
        subItems: [],
      },
      prodotti: {
        id: "prodotti",
        title: "Prodotti",
        icon: "Package",
        order: 2,
        subItems: [
          { id: "cat1", title: "Categoria 1", href: "#", order: 1 },
          { id: "cat2", title: "Categoria 2", href: "#", order: 2 },
          { id: "cat3", title: "Categoria 3", href: "#", order: 3 },
          { id: "cat4", title: "Categoria 4", href: "#", order: 4 },
        ],
      },
      contatti: {
        id: "contatti",
        title: "Contatti",
        icon: "Mail",
        href: "#",
        order: 3,
        subItems: [],
      },
    },
    otherItems: [],
  }

  const router = useRouter()

  const [openDropdown, setOpenDropdown] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { selectedMenu, setSelectedMenu, setUserid, userid, timestamp, theme } = useRecordsStore()
  const { user, activeServer, role } = useContext(AppContext)

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
      if (response.userid) {
        setUserid(response.userid)
      }
      console.log(response)
    }
  }, [response, responseData])

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="Sidebar" elapsedTime={elapsedTime}>
      {(data) => (
        <>
          {/* Bottone toggle SOLO su mobile */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg z-50 xl:hidden hover:scale-105 active:scale-95 transition-transform"
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
            <div className="flex-shrink-0 py-6 px-6">
              <Image
                src={
                    theme === "bixhub"
                        ? `/bixdata/logos/bixhub.png`
                        : `/bixdata/logos/bixdata.png`
                }
                alt="Logo"
                width={1000}
                height={1000}
                className="h-16 w-auto m-auto hover:cursor-pointer hover:scale-105 hover:translate-y-1 transition-all duration-200"
                onClick={() => window.location.reload()}
              />
            </div>

            {/* CONTENUTO SCROLLABILE */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3">
              {/* MENU ITEMS */}
              <ul className="list-none p-0 m-0 space-y-1">
                {activeServer === "telamico" ? (
                  <>
                    <li>
                      <span
                        className="block px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 cursor-pointer active:scale-[0.98]"
                        onClick={() => handleMenuClick("TelAmicoCalendario")}
                      >
                        Calendario TelAmico
                      </span>
                    </li>

                    <li>
                      <span
                        className="block px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 cursor-pointer active:scale-[0.98]"
                        onClick={() => handleMenuClick("TelAmicoAgenda")}
                      >
                        Agenda TelAmico
                      </span>
                    </li>

                    <li>
                      <span
                        className="block px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 cursor-pointer active:scale-[0.98]"
                        onClick={() => handleMenuClick("Calendario")}
                      >
                        Agenda TelAmico
                      </span>
                    </li>
                  </>
                ) : activeServer === "swissbix" || activeServer === "demo_jerry" ? (
                  <>
                    <li>
                      <span
                        className="block px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 cursor-pointer active:scale-[0.98]"
                        onClick={() => handleMenuClick("Dashboard")}
                      >
                        Dashboard
                      </span>
                    </li>
                  </>
                ) : null}
                
                {activeServer === "belotti" ? (
                  <>
                    {responseData.otherItems.map((item) => (
                      <li key={item.id}>
                        <span
                          className="block px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 cursor-pointer active:scale-[0.98]"
                          onClick={() => handleMenuClick(item.id)}
                        >
                          {item.description}
                        </span>
                      </li>
                    ))}
                  </>
                ) : activeServer === "winteler" ? (
                  <>
                    <li>
                      <span
                        className="cursor-pointer block px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 active:scale-[0.98]"
                        onClick={() => router.push("/custom/winteler")}
                      >
                        Winteler custom
                      </span>
                    </li>
                  </>
                ) : activeServer === 'wegolf' ? (
                  <li>
                    <Link
                      href="/bixadmin/utenti"
                      target="_blank"
                      className="flex items-center gap-3 cursor-pointer block px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 active:scale-[0.98]"
                    >
                      <SquareArrowOutUpRight className="w-5 h-5"/>
                      Users Settings
                    </Link>
                  </li>
                ) : null}

                {role === "admin" && (
                  <li>
                    <Link
                      href="/bixadmin/admin"
                      target="_blank"
                      className="flex items-center gap-3 cursor-pointer block px-4 py-2.5 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 active:scale-[0.98]"
                    >
                      <SquareArrowOutUpRight className="w-5 h-5"/>
                      Admin Settings
                    </Link>
                  </li>
                )}

                {responseData.favoriteTables && responseData.favoriteTables.length > 0 && (
                  <li className="mt-2">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === "favorites" ? "" : "favorites")}
                      className="w-full text-md flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary hover:text-secondary-foreground focus:text-primary-foreground transition-all duration-200 active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3 min-w-[20px]">
                        <Star className="w-5 h-5 min-w-[20px]" />
                        <span className="text-md opacity-100 transition-opacity duration-300">Preferiti</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-300 ${openDropdown === "favorites" ? "-rotate-180" : ""}`}
                      />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${openDropdown === "favorites" ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}
                    >
                      <ul className="py-1 ml-3 mt-1 space-y-0.5">
                        {responseData.favoriteTables.map((table) => (
                          <li key={table.id}>
                            <span
                              className="text-primary-foreground text-sm block px-4 py-2 rounded-md hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 cursor-pointer active:scale-[0.98]"
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

                {Object.entries(data["menuItems"])
                  .filter(([, item]) => item.order !== null)
                  .sort(([, a], [, b]) => a.order - b.order)
                  .map(([key, item]) => {
                  const Icon = (Icons as any)[item.icon] || Home
                  const isActive = item.subItems?.find((subitem) => subitem.id === selectedMenu && openDropdown !== item.id)
                  
                  return (
                    <li key={item.id} className="mt-1">
                      {item.subItems ? (
                        <div>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === item.id ? "" : item.id)}
                            className={`w-full text-md flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 active:scale-[0.98] ${isActive ? 'bg-secondary text-secondary-foreground' : ''}`}
                          >
                            <div className="flex items-center gap-3 min-w-[20px]">
                              <Icon className="w-5 h-5" />
                              <span className="text-md">{item.title}</span>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 transition-transform duration-300 ${openDropdown === item.id ? "-rotate-180" : ""}`}
                            />
                          </button>

                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${openDropdown === item.id ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}
                          >
                            <ul className="py-1 ml-3 mt-1 space-y-0.5">
                              {item.subItems
                                .filter((subItem) => subItem.order !== null)
                                .sort((a, b) => a.order - b.order)
                                .map((subItem) => (
                                <li key={subItem.id} className="cursor-pointer">
                                  <span
                                    className={`text-sm block px-4 py-2 rounded-md hover:bg-secondary 
                                      hover:text-secondary-foreground transition-all duration-200 active:scale-[0.98] ${selectedMenu === subItem.id ? 'bg-secondary text-secondary-foreground font-medium' : ''}`}
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
                          className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 active:scale-[0.98]"
                          onClick={() => item.id && handleMenuClick(item.id)}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* FOOTER FISSO - Menu utente */}
            <div className="flex-shrink-0 border-t border-secondary/50">
              <HMenu as="div" className="relative mx-4 my-4">
                <div className="flex items-center gap-3">
                  <MenuButton className="relative flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-sidebar transition-all hover:scale-105 active:scale-95">
                    <img
                      src={`/api/media-proxy?url=userProfilePic/${userid}.png`}
                      alt="profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                      onError={(e) => {
                        const target = e.currentTarget
                        if (!target.src.includes("default.jpg")) {
                          target.src = "/api/media-proxy?url=userProfilePic/default.jpg"
                        }
                      }}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-sidebar" />
                  </MenuButton>
                  <span className="text-sm font-medium truncate">{user}</span>
                </div>

                <MenuItems className="absolute right-0 bottom-full mb-2 w-56 origin-bottom-right rounded-xl bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <MenuItem>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-black truncate">{user}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Profilo attivo</p>
                    </div>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      onClick={() => setSelectedMenu("userSettings")}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg mx-1 my-0.5"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4" />
                        <span>Impostazioni</span>
                      </div>
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg mx-1 my-0.5"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4" />
                        <span>Cambia password</span>
                      </div>
                    </a>
                  </MenuItem>
                  <div className="my-1 h-px bg-gray-100 mx-2" />
                  <MenuItem>
                    <a
                      href="/login"
                      onClick={logoutUser}
                      className="block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg mx-1 my-0.5"
                    >
                      <div className="flex items-center gap-3">
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