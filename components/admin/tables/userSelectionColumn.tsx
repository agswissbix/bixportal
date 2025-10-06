import React, {useState, useEffect, useMemo} from 'react'
import { Users } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useApi } from '@/utils/useApi'
import GenericComponent from '@/components/genericComponent'


const isDev = false

interface User {
  id: string
  username: string
  firstname: string
  lastname: string
  description?: string
  superuser?: string
  disabled?: string
}

interface ResponseInterface {
  users: User[];
  groups: User[];
}

const ResponseInterfaceDefault : ResponseInterface = {
  users: [],
  groups: []
}

const ResponseInerfaceDev : ResponseInterface = {
  users: [
    { id: "1", username: "admin", firstname: "Alice", lastname: "Rossi", description: "Amministratrice principale del sistema", disabled: "false", superuser: "true" } as User,
    { id: "2", username: "mverdi", firstname: "Marco", lastname: "Verdi", description: "Responsabile marketing", disabled: "false", superuser: "false" } as User,
    { id: "3", username: "lbianchi", firstname: "Laura", lastname: "Bianchi", description: "Analista dati", disabled: "false", superuser: "false" } as User,
  ],
  groups: [
    { id: "g_marketing", username: "GRP-MKT", firstname: "Marketing Team", lastname: "Group", description: "Gruppo team Marketing" },
    { id: "g_dev", username: "GRP-DEV", firstname: "Sviluppo", lastname: "Group", description: "Gruppo team Sviluppo" },
  ]
}

export const UserSelectionColumn: React.FC<{
  users: User[]
  groups: User[]
  selectedUserId: string
  onSelectUser: (userId: string) => void
  onUsersUpdate?: (users: User[]) => void
  onGroupsUpdate?: (groups: User[]) => void
}> = ({ selectedUserId, onSelectUser, onUsersUpdate, onGroupsUpdate }) => {
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? ResponseInerfaceDev : ResponseInterfaceDefault)
  const [users, setUsers] = useState<User[]>(isDev ? ResponseInerfaceDev.users.filter((u) => u.superuser !== "true") : [])
  const [groups, setGroups] = useState<User[]>(isDev ? ResponseInerfaceDev.groups : [])

  const payload = useMemo(() => {
    if (isDev) return null
    return { apiRoute: "get_users_and_groups_api" }
  }, [])

  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!isDev && response) {
      setResponseData(response)
      const normalUsers = response.users.filter(u => u.superuser !== "true")
      setUsers(normalUsers)
      setGroups(response.groups)
      onUsersUpdate?.(normalUsers)
      onGroupsUpdate?.(response.groups)
    }
  }, [response])

  useEffect(() => {
    if (isDev) {
      onUsersUpdate?.(users)
      onGroupsUpdate?.(groups)
    }
  }, [])


  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-gray-600" />
          Seleziona Utente/Gruppo
        </h2>
        <Select value={selectedUserId} onValueChange={onSelectUser} defaultValue={users.find(u => u.username === "superuser")?.id ?? ""}>
          <SelectTrigger>
            <SelectValue className='text-black' placeholder="Seleziona utente..." />
          </SelectTrigger>
          <SelectContent>

            {groups.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Gruppi</div>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500 text-white">Gruppo</Badge>
                      <span>{group.firstname}</span>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}

            {users.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                  Utenti
                </div>
                {users.map((user) => (
                  <SelectItem key={`user-${user.id}`} value={user.id}>
                    {user.username === "superuser" ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-500 text-white">Default</Badge>
                        <span>{user.username}</span>
                      </div>
                    ) : (
                      <span>
                        {user.username} ({user.firstname} {user.lastname})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedUserId && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">Seleziona una tabella dalla colonna successiva per gestire i settings</p>
        </div>
      )}
    </div>
      )}
    </GenericComponent>
  )
}