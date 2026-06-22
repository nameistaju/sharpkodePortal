import { Loader2, Save, User } from 'lucide-react';
import { useState } from 'react'
import api from '../api/axios';
import { getErrorMessage, unwrap } from '../api/helpers';
import { useAuth } from '../context/AuthContext';

const ProfileForm = ({initialData, onSuccess}) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const { setUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)
        setError("")
        setMessage("")
        const formData = new FormData(e.currentTarget)
        try {
            const response = await api.patch("/employees/me/profile", formData)
            const data = unwrap(response);
            if (data.employee) {
                setUser((prev) => ({ ...prev, ...data.employee }));
            }
            setMessage("Profile updated successfully")
            onSuccess?.()
        } catch (err) {
            setError(getErrorMessage(err));
        }finally{
            setLoading(false)
        }
    }

  return (
    <form onSubmit={handleSubmit} className='card p-5 sm:p-6 mb-6'>
        <h2 className='text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2'>
           <User className="w-5 h-5 text-slate-400"/> Public Profile
        </h2>

        {error && <div className='bg-rose-50 text-rose-700 p-4 rounded-xl text-sm border border-rose-200 mb-6'>{error}</div>}
        {message && <div className='bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-200 mb-6'>{message}</div>}

        <div className='space-y-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                    <input name="name" defaultValue={initialData.name || ""}/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                    <input name="phone" defaultValue={initialData.phone || ""}/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input disabled value={initialData.email || ""} className='bg-slate-50 text-slate-400 cursor-not-allowed'/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                    <input disabled value={initialData.department || ""} className='bg-slate-50 text-slate-400 cursor-not-allowed'/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Profile Photo</label>
                <input type="file" name="profilePhoto" accept="image/*"/>
            </div>
            <div className='flex justify-end pt-2'>
                <button type='submit' disabled={loading} className='btn-primary flex items-center gap-2 justify-center w-full sm:w-auto'>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                    Save Changes
                </button>
            </div>
        </div>
    </form>
  )
}

export default ProfileForm
