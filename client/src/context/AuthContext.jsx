/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { unwrap } from "../api/helpers";


const AuthContext = createContext(null)

export function AuthProvider({children}){
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem("token"))
    const [loading, setLoading] = useState(true)

    const refreshSession = async () => {
        const storedToken = localStorage.getItem("token")
        const storedRefreshToken = localStorage.getItem("refreshToken")
        if(!storedToken && !storedRefreshToken){
            setUser(null);
            setToken(null);
            setLoading(false);
            return;
        }
        try {
            const data = unwrap(await api.get("/auth/me"))
            setUser(data.user)
        } catch {
            // Token is invalid, clear it
            localStorage.removeItem("token")
            localStorage.removeItem("refreshToken")
            setUser(null)
            setToken(null)
        }finally{
            setLoading(false)
        }
    }

    useEffect(()=>{
        refreshSession()
    },[])

    const login = async (email, password, role_type) => {
        const data = unwrap(await api.post("/auth/login", {email, password, role_type}))
        localStorage.setItem("token", data.accessToken || data.token)
        localStorage.setItem("refreshToken", data.refreshToken)
        setToken(data.accessToken || data.token);
        setUser(data.user);
        return data.user;
    }

    const logout = async ()=>{
        const refreshToken = localStorage.getItem("refreshToken");
        const isAdmin = user?.role === "ADMIN";

        // Clear local auth state immediately and synchronously to prevent refresh loops on redirect
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        setToken(null);
        setUser(null);
        setLoading(false);

        // Perform fire-and-forget backend logout request in background
        if (refreshToken) {
            api.post("/auth/logout", { refreshToken }).catch(() => {
                // Ignore logout call errors
            });
        }

        // Redirect to appropriate login page immediately
        window.location.href = isAdmin ? "/login/admin" : "/login/employee";
    }

    const value = {user, token, loading, login, logout, refreshSession, setUser}

    return <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
}

export function useAuth(){
    const ctx = useContext(AuthContext);
    if(!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
