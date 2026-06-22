import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2Icon, LockIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { getErrorMessage, unwrap } from "../api/helpers";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

const ChangePassword = () => {
  const { user, loading, refreshSession, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword && !user.forcePasswordChange) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const formData = new FormData(event.currentTarget);

    try {
      const data = unwrap(await api.post("/auth/change-password", {
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword")
      }));

      localStorage.setItem("token", data.accessToken || data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);
      await refreshSession();
      toast.success("Password changed successfully");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen surface-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md card p-7">
        <div className="mb-6">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <LockIcon className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Change your temporary password</h1>
          <p className="text-sm text-slate-500 mt-2">
            This account was created with a temporary password. Update it before continuing to SharpKode Workforce.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Temporary password</label>
            <input type="password" name="currentPassword" required autoComplete="current-password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">New password</label>
            <input type="password" name="newPassword" required autoComplete="new-password" />
            <p className="text-xs text-slate-500 mt-2">
              Use at least 8 characters with uppercase, lowercase, number, and special character.
            </p>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving && <Loader2Icon className="w-4 h-4 animate-spin" />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
