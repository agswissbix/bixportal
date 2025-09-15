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
} from "lucide-react"
import { useRecordsStore } from "./records/recordsStore"
import { AppContext } from "@/context/appContext"
import { Menu as HMenu, MenuButton, MenuItems, MenuItem } from "@headlessui/react"

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
            className="fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-md shadow-lg z-50 lg:hidden"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Overlay solo su mobile */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* SIDEBAR */}
          <div
            id="sidebar"
            className={`
              fixed top-0 left-0 z-40 h-full w-80 bg-sidebar text-primary-foreground shadow-lg transition-transform duration-300 flex flex-col justify-between
              lg:relative lg:translate-x-0 lg:w-full
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <div>
              <div className="py-6 px-4">
                <Image
                  src={
                  theme == "default"
                    ? `/bixdata/logos/${activeServer}.png`
                    : theme == "bixhub"
                      ? `/bixdata/logos/bixhub.png`
                      : `/bixdata/logos/${activeServer || "_" + theme}.png`
                }
                  alt="Logo"
                  width={1000}
                  height={1000}
                  className="h-16 w-auto m-auto hover:cursor-pointer hover:scale-105 hover:translate-y-1 transition-all"
                  onClick={() => window.location.reload()}
                />
              </div>

              {/* MENU ITEMS */}
              <ul className="list-none p-0 m-0">
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

            {/* MENU UTENTE */}
            <HMenu as="div" className="relative ml-4 mb-4">
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
                <span className="text-sm font-medium">{user}</span>
              </div>

              <MenuItems className="absolute right-0 bottom-full w-48 origin-bottom-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <MenuItem>
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-black">{user}</p>
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
        </>
      )}
    </GenericComponent>
  )
}
