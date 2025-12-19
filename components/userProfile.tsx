"use client"

// UserSettings.jsx (Aggiornato)

import type React from "react"
import { useContext, useState, useEffect } from "react"
import GenericComponent from "./genericComponent"
import { AppContext } from "@/context/appContext"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { useRecordsStore } from "./records/recordsStore"
import { toast } from "sonner"
import { Camera, RefreshCcw, Upload, ImageIcon } from "lucide-react" // Nuove icone
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const isDev = true

interface PropsInterface {
  propExampleValue?: string
}

interface ResponseInterface {
  responseExampleValue?: string
}

// Componente separato per l'immagine del profilo
function UserProfilePic() {
  const { user } = useContext(AppContext)
  const { userid } = useRecordsStore()
  const [loading, setLoading] = useState(false)
  const { setTimestamp, timestamp } = useRecordsStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [presetAvatars, setPresetAvatars] = useState<string[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const profilePicUrl = `/api/media-proxy?url=userProfilePic/${userid}.png?t=${timestamp}`
  const defaultPicUrl = "/api/media-proxy?url=userProfilePic/default.jpg"

  useEffect(() => {
    const loadPresetAvatars = () => {
      // Generate paths for preset avatars (e.g., /avatar/{userid}_1.png, /avatar/{userid}_2.png, etc.)
      const avatars = Array.from({ length: 6 }, (_, i) => `/api/media-proxy?url=avatar/${userid}_${i + 1}.png`)
      setPresetAvatars(avatars)
    }

    if (userid) {
      loadPresetAvatars()
    }
  }, [userid])

  const updateUserProfilePic = async (file: File) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("apiRoute", "update_user_profile_pic")
      formData.append("image", file)

      await axiosInstanceClient.post("/postApi", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      toast.success("Immagine del profilo aggiornata con successo!")
      setTimestamp(Date.now()) // Aggiorna il timestamp per forzare il ricaricamento
      setIsDialogOpen(false)
    } catch (error) {
      toast.error("Errore durante l'aggiornamento dell'immagine del profilo.")
    } finally {
      setLoading(false)
    }
  }

  const selectPresetAvatar = async (avatarUrl: string) => {
    setLoading(true)
    setSelectedPreset(avatarUrl)
    try {
      // Fetch the preset image and convert it to a file
      const response = await fetch(avatarUrl)
      const blob = await response.blob()
      const file = new File([blob], "avatar.png", { type: "image/png" })

      await updateUserProfilePic(file)
      setSelectedPreset(null)
    } catch (error) {
      toast.error("Errore durante la selezione dell'avatar predefinito.")
      setSelectedPreset(null)
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updateUserProfilePic(file)
    }
  }

  return (
    <>
      <div className="relative group w-24 h-24">
        <img
          src={profilePicUrl || "/placeholder.svg"}
          alt="Immagine del profilo"
          className="w-full h-full rounded-full object-cover border-2 border-gray-300 transition-opacity duration-200"
          onError={(e) => {
            const target = e.currentTarget
            if (!target.src.includes("default.jpg")) {
              target.src = defaultPicUrl
            }
          }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-full">
            <RefreshCcw className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        <button
          onClick={() => setIsDialogOpen(true)}
          className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-0 group-hover:bg-opacity-50 transition-colors duration-300 rounded-full cursor-pointer"
          title="Modifica immagine del profilo"
        >
          <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Cambia Immagine del Profilo</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/30 p-1 rounded-lg">
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                <Upload className="w-4 h-4" />
                Carica File
              </TabsTrigger>
              <TabsTrigger 
                value="preset" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                <ImageIcon className="w-4 h-4" />
                Avatar Predefiniti
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 pt-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="profile-pic-upload"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="profile-pic-upload" className="flex flex-col items-center gap-2 cursor-pointer">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <span className="text-sm font-medium">Clicca per caricare un'immagine</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG o GIF (MAX. 5MB)</span>
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preset" className="pt-4">
              <div className="grid grid-cols-3 gap-4">
                {presetAvatars.map((avatarUrl, index) => (
                  <button
                    key={index}
                    onClick={() => selectPresetAvatar(avatarUrl)}
                    disabled={loading}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      selectedPreset === avatarUrl
                        ? "border-primary ring-2 ring-primary"
                        : "border-gray-300 hover:border-primary"
                    } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <img
                      src={avatarUrl || defaultPicUrl}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget
                        if (!target.src.includes("default.jpg")) {
                          target.src = defaultPicUrl
                        }
                      }}
                    />
                    {selectedPreset === avatarUrl && loading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                        <RefreshCcw className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Componente principale UserSettings
function UserSettings({ propExampleValue }: PropsInterface) {
  const { user, userName } = useContext(AppContext)
  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? { responseExampleValue: "Development response" } : { responseExampleValue: "Default response" },
  )
  const { userid } = useRecordsStore()

  // Omessa la logica di useApi per brevità, dato che il focus è sull'interfaccia.

  return (
    <GenericComponent response={responseData} loading={false} error={null}>
      {(response: ResponseInterface) => (
        <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl max-w-lg mx-auto my-10">
          <UserProfilePic />

          <div className="text-center mt-4">
            <h2 className="text-2xl font-semibold text-gray-900">{userName}</h2>
            <p className="text-sm text-gray-500">{user}</p>
          </div>

          {/*
          <div className="w-full border-t border-gray-200 my-8"></div>

          <div className="w-full">
            
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Impostazioni account</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
              <span className="text-gray-700">Notifiche Email</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
          </div>
          */}
        </div>
      )}
    </GenericComponent>
  )
}

export default UserSettings
