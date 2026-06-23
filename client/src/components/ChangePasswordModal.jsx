import { Loader2Icon, LockIcon, X } from 'lucide-react'
import { useState } from 'react'
import api from '../api/axios'
import { getErrorMessage, unwrap } from '../api/helpers'
import { useAuth } from '../context/AuthContext'

const ChangePasswordModal = ({open, onClose }) => {
     const [loading, setLoading] = useState(false)
     const [message, setMessage] = useState({type: "", text: ""})
     const { setUser } = useAuth()

     const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)
        setMessage({ type: "", text: "" });
        const formData = new FormData(e.currentTarget)
        const currentPassword = formData.get("currentPassword");
        const newPassword = formData.get("newPassword");
        const confirmPassword = formData.get("confirmPassword");

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match." });
            setLoading(false);
            return;
        }

        try {
            const data = unwrap(await api.post("/auth/change-password", {
                currentPassword,
                newPassword
            }));
            localStorage.setItem("token", data.accessToken || data.token);
            localStorage.setItem("refreshToken", data.refreshToken);
            setUser(data.user);
            setMessage({type: "success", text: "Password updated successfully"})
            e.target.reset();
        } catch (error) {
            if (import.meta.env.DEV) {
                console.log("Full validation response/error:", error?.response?.data || error);
            }

            let errorMsg = getErrorMessage(error);
            const details = error.response?.data?.details;
            if (Array.isArray(details) && details.length > 0) {
                const errorMessages = details.map((d) => {
                    if (d.field === "newPassword") {
                        const msg = d.message;
                        if (
                            msg.includes("at least 8 characters") ||
                            msg.includes("uppercase") ||
                            msg.includes("lowercase") ||
                            msg.includes("number") ||
                            msg.includes("special character") ||
                            msg.includes("complexity") ||
                            msg.includes("strong")
                        ) {
                            return "Password must contain at least 8 characters, uppercase, lowercase, number, and special character.";
                        }
                        return msg;
                    }
                    if (d.field === "currentPassword") {
                        return "Current password is required.";
                    }
                    return d.message;
                });
                errorMsg = errorMessages.filter(Boolean).join(" ");
            }
            setMessage({ type: "error", text: errorMsg });
        }finally{
            setLoading(false);
        }
     }

     if(!open) return null;

  return (
    <div onClick={onClose} className='fixed inset-0 z-50 flex items-center justify-center p-4'>
        <div className='absolute inset-0 bg-black/40 backdrop-blur-sm'/>
        <div className='relative bg-white rounded-lg shadow-2xl w-full max-w-md animate-fade-in' onClick={(e) => e.stopPropagation()}>
            <div className='flex items-center justify-between p-6 pb-0'>
                <h2 className='text-lg font-medium text-slate-900 flex items-center gap-2'>
                    <LockIcon className="w-5 h-5 text-slate-400"/> Change Password
                </h2>
                <button onClick={onClose} className='p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600'><X className="w-5 h-5"/></button>
            </div>
            <form className="p-6 space-y-5" onSubmit={handleSubmit}>
                {message.text && (
                    <div className={`p-3 rounded-xl text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                        {message.text}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                    <input type="password" name="currentPassword" required/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                    <input type="password" name="newPassword" required/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                    <input type="password" name="confirmPassword" required/>
                </div>
                <div className='flex gap-3 pt-2'>
                    <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1 flex justify-center items-center gap-2">
                        {loading && <Loader2Icon className="w-4 h-4 animate-spin"/>}
                        Update Password
                    </button>
                </div>
            </form>
        </div>
    </div>
  )
}

export default ChangePasswordModal
