import { createContext, useContext, useState } from "react"

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [stats,      setStats]      = useState(null)
  const [preference, setPreference] = useState(null)

  return (
    <UserContext.Provider value={{ stats, setStats, preference, setPreference }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
