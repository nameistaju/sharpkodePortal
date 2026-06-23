import { useState, useEffect } from "react"
import { DEPARTMENTS } from "../assets/assets"
import { Loader2Icon, EyeIcon, EyeOffIcon, CheckIcon, CopyIcon, LockIcon, RefreshCwIcon, KeyIcon, LogOutIcon } from "lucide-react"
import api from "../api/axios"
import toast from "react-hot-toast"
import { toastError } from "../api/helpers"

const generateRandomSuffix = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let suffix = '';
    const length = 2 + Math.floor(Math.random() * 3); // 2 to 4
    for (let i = 0; i < length; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return suffix;
};

const generateUnpredictablePasswordFront = (name, dob, randSuffix) => {
    const firstWord = (name || 'Employee').trim().split(/\s+/)[0];
    const cleanName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).replace(/[^a-zA-Z0-9]/g, '');

    let dobString = '01012000';
    if (dob) {
        const parts = dob.split('-'); // YYYY-MM-DD
        if (parts.length === 3) {
            dobString = `${parts[2]}${parts[1]}${parts[0]}`;
        }
    }

    return `${cleanName}@${dobString}#${randSuffix}`;
};

const PasswordStrengthCheck = ({ password }) => {
    const rules = [
        { label: "At least 8 characters", test: (val) => val.length >= 8 },
        { label: "At least one uppercase letter (A-Z)", test: (val) => /[A-Z]/.test(val) },
        { label: "At least one lowercase letter (a-z)", test: (val) => /[a-z]/.test(val) },
        { label: "At least one number (0-9)", test: (val) => /[0-9]/.test(val) },
        { label: "At least one special character", test: (val) => /[^A-Za-z0-9]/.test(val) }
    ];

    const passedRule = (rule, val) => val ? rule.test(val) : false;

    return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2 mt-2 w-full">
            <span className="font-medium text-slate-500 block mb-1">Password Complexity Rules:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rules.map((rule, idx) => {
                    const passed = passedRule(rule, password);
                    return (
                        <div key={idx} className="flex items-center gap-2">
                            {passed ? (
                                <CheckIcon className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                            ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0" />
                            )}
                            <span className={passed ? "text-emerald-700 font-medium" : "text-slate-500"}>
                                {rule.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const EmployeeForm = ({initialData, onSuccess, onCancel}) => {
    const [loading, setLoading] = useState(false)
    const isEditMode = !!initialData;

    // Form inputs state to dynamically build generated password
    const [nameVal, setNameVal] = useState(initialData?.name || "");
    const [dobVal, setDobVal] = useState(initialData?.dob ? new Date(initialData.dob).toISOString().split("T")[0] : "");

    // Creation States
    const [autoGenerate, setAutoGenerate] = useState(true);
    const [randSuffix, setRandSuffix] = useState(() => generateRandomSuffix());

    // Manual Password States
    const [passwordVal, setPasswordVal] = useState("");
    const [confirmPasswordVal, setConfirmPasswordVal] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Edit Mode States
    const [changePassword, setChangePassword] = useState(false);
    const [forceChange, setForceChange] = useState(initialData?.forcePasswordChange ?? true);
    const [securityInfo, setSecurityInfo] = useState(null);
    const [loadingSecurity, setLoadingSecurity] = useState(false);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    // Success State
    const [successData, setSuccessData] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isEditMode && initialData?._id) {
            const fetchSecurity = async () => {
                setLoadingSecurity(true);
                try {
                    const res = await api.get(`/employees/${initialData._id}/security`);
                    setSecurityInfo(res.data.data);
                } catch (err) {
                    console.error("Failed to fetch security info:", err);
                } finally {
                    setLoadingSecurity(false);
                }
            };
            fetchSecurity();
        }
    }, [isEditMode, initialData?._id, refetchTrigger]);

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(successData.password);
        setCopied(true);
        toast.success("Credentials copied");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleResetPassword = async () => {
        if (!window.confirm("Are you sure you want to reset this employee's password? This will log them out of all active sessions.")) {
            return;
        }
        setLoading(true);
        try {
            const res = await api.post(`/employees/${initialData._id}/reset-password`, {});
            toast.success("Password reset successfully");
            setSuccessData({
                email: initialData.email,
                password: res.data.data.temporaryPassword
            });
            setRefetchTrigger(prev => prev + 1);
        } catch (err) {
            toastError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoutAll = async () => {
        if (!window.confirm("Are you sure you want to log this employee out of all active sessions?")) {
            return;
        }
        setLoading(true);
        try {
            await api.post(`/employees/${initialData._id}/logout-all`, {});
            toast.success("Logged out from all devices");
            setRefetchTrigger(prev => prev + 1);
        } catch (err) {
            toastError(err);
        } finally {
            setLoading(false);
        }
    };

    const validateComplexity = (password) => {
        if (password.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(password)) return "Password must contain at least one number";
        if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character";
        return null;
    };

    const handleSubmit = async (e)=>{
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        if(!data.joinDate) delete data.joinDate;
        if(!data.dob) delete data.dob;

        let payload = { ...data };

        if (!isEditMode) {
            if (autoGenerate) {
                payload.autoGeneratePassword = true;
                delete payload.password;
                delete payload.confirmPassword;
            } else {
                if (passwordVal !== confirmPasswordVal) {
                    toast.error("Passwords do not match");
                    setLoading(false);
                    return;
                }
                const complexityError = validateComplexity(passwordVal);
                if (complexityError) {
                    toast.error(complexityError);
                    setLoading(false);
                    return;
                }
                payload.password = passwordVal;
                delete payload.confirmPassword;
            }
        } else {
            // Edit Mode
            delete payload.email; // Can't change email
            if (changePassword) {
                if (passwordVal !== confirmPasswordVal) {
                    toast.error("Passwords do not match");
                    setLoading(false);
                    return;
                }
                const complexityError = validateComplexity(passwordVal);
                if (complexityError) {
                    toast.error(complexityError);
                    setLoading(false);
                    return;
                }
                payload.password = passwordVal;
                delete payload.confirmPassword;
            } else {
                delete payload.password;
                delete payload.confirmPassword;
            }
            payload.forcePasswordChange = forceChange;
        }

        try {
            const id = initialData?._id;
            if(isEditMode){
                await api.patch(`/employees/${id}`, payload)
                toast.success("Employee updated successfully")
                onSuccess?.()
            } else {
                const res = await api.post("/employees", payload)
                toast.success("Employee created successfully")
                if (res.data.data.generatedPassword) {
                    setSuccessData({
                        email: res.data.data.employee.email,
                        password: res.data.data.generatedPassword
                    });
                } else {
                    onSuccess?.()
                }
            }
        } catch (error) {
            toastError(error);
        }finally{
            setLoading(false);
        }
    }

    if (successData) {
        return (
            <div className="card p-6 text-center space-y-6 max-w-md mx-auto animate-fade-in border border-slate-100">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckIcon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Employee Credentials Generated</h3>
                    <p className="text-sm text-slate-500 mt-1">Credentials generated for login access.</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl text-left space-y-4 text-sm border border-slate-100">
                    <div>
                        <span className="text-slate-400 block text-xs font-medium uppercase">Email Address</span>
                        <span className="text-slate-900 font-semibold mt-0.5 block">{successData.email}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-xs font-medium uppercase">Temporary Password</span>
                        <div className="flex items-center justify-between mt-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                            <code className="text-slate-900 font-mono font-bold">{successData.password}</code>
                            <button 
                                type="button"
                                onClick={handleCopyPassword}
                                className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-md text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-xs font-medium"
                            >
                                {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <span className="text-xs text-rose-500 font-semibold mt-2.5 block">
                            ⚠️ This password exists only in memory and is shown only once. Please copy it now!
                        </span>
                    </div>
                </div>
                <button type="button" onClick={onSuccess} className="btn-primary w-full py-2.5">
                    Done & Close
                </button>
            </div>
        );
    }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl animate-fade-in">
        <div className="card p-5 sm:p-6">
            <h3 className="font-medium mb-6 pb-4 border-b border-slate-100">Employee Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
                <div className="sm:col-span-2">
                    <label className="block mb-2">Full Name</label>
                    <input 
                        name="name" 
                        required 
                        value={nameVal}
                        onChange={(e) => setNameVal(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block mb-2">Phone Number</label>
                    <input name="phone" required defaultValue={initialData?.phone || ""} />
                </div>
                <div>
                    <label className="block mb-2">Work Email</label>
                    <input type="email" name="email" required disabled={isEditMode} defaultValue={initialData?.email || ""} />
                </div>
                <div>
                    <label className="block mb-2">Date of Birth</label>
                    <input 
                        type="date" 
                        name="dob" 
                        required={!isEditMode} 
                        value={dobVal}
                        onChange={(e) => setDobVal(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block mb-2">Join Date</label>
                    <input type="date" name="joinDate" defaultValue={initialData?.joinDate ? new Date(initialData.joinDate).toISOString().split("T")[0] : ""} />
                </div>
                <div>
                    <label className="block mb-2">Department</label>
                    <select name="department" required defaultValue={initialData?.department || ""}>
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map((deptName)=><option key={deptName} value={deptName}>{deptName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block mb-2">System Role</label>
                    <select name="role" defaultValue={initialData?.role || "EMPLOYEE"}>
                        <option value="EMPLOYEE">Employee</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
                {isEditMode && (
                    <div>
                        <label className="block mb-2">Status</label>
                        <select name="status" defaultValue={initialData?.status || "ACTIVE"}>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                )}
            </div>
        </div>

        {/* Security / Password section */}
        {isEditMode ? (
            <div className="card p-5 sm:p-6 border border-slate-100">
                <h3 className="font-medium mb-4 pb-4 border-b border-slate-100 flex items-center gap-2">
                    <LockIcon className="w-5 h-5 text-indigo-500" /> Security Settings
                </h3>
                
                {loadingSecurity ? (
                    <div className="space-y-3 py-2">
                        <div className="h-5 bg-slate-100 rounded w-1/3 skeleton" />
                        <div className="h-5 bg-slate-100 rounded w-1/4 skeleton" />
                    </div>
                ) : (
                    <div className="space-y-5 text-sm text-slate-700">
                        {securityInfo && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                                <div>
                                    <span className="text-slate-400 block text-xs font-medium uppercase">Last Password Change</span>
                                    <span className="text-slate-900 font-semibold">
                                        {securityInfo.lastPasswordChange ? new Date(securityInfo.lastPasswordChange).toLocaleString() : "Never"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-xs font-medium uppercase">Active Sessions</span>
                                    <span className="text-slate-900 font-semibold flex items-center gap-2">
                                        {securityInfo.activeSessions}
                                        {securityInfo.activeSessions > 0 && (
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={changePassword} 
                                    onChange={(e) => setChangePassword(e.target.checked)} 
                                />
                                <span className="font-medium text-slate-700">Manually Change Employee Password</span>
                            </label>

                            {changePassword && (
                                <div className="pl-7 space-y-4 max-w-xl animate-fade-in">
                                    <div className="relative">
                                        <label className="block mb-2">New Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                name="password" 
                                                required 
                                                value={passwordVal}
                                                onChange={(e) => setPasswordVal(e.target.value)}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOffIcon size={18}/> : <EyeIcon size={18}/>}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <label className="block mb-2">Confirm New Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showConfirmPassword ? "text" : "password"} 
                                                name="confirmPassword" 
                                                required 
                                                value={confirmPasswordVal}
                                                onChange={(e) => setConfirmPasswordVal(e.target.value)}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showConfirmPassword ? <EyeOffIcon size={18}/> : <EyeIcon size={18}/>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Password Strength Checklist */}
                                    <PasswordStrengthCheck password={passwordVal} />
                                </div>
                            )}

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="forcePasswordChange"
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={forceChange} 
                                    onChange={(e) => setForceChange(e.target.checked)} 
                                />
                                <span className="font-medium text-slate-700">Force password change next login</span>
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                            <button 
                                type="button" 
                                onClick={handleResetPassword}
                                className="btn-secondary flex items-center gap-2 border-amber-200 hover:bg-amber-50/50 text-amber-700 font-medium"
                            >
                                <KeyIcon className="w-4 h-4" /> Reset Password
                            </button>
                            {securityInfo && securityInfo.activeSessions > 0 && (
                                <button 
                                    type="button" 
                                    onClick={handleLogoutAll}
                                    className="btn-secondary flex items-center gap-2 border-rose-200 hover:bg-rose-50/50 text-rose-700 font-medium"
                                >
                                    <LogOutIcon className="w-4 h-4" /> Logout From All Devices
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="card p-5 sm:p-6 border border-slate-100 space-y-4">
                <h3 className="font-medium pb-4 border-b border-slate-100 flex items-center gap-2">
                    <LockIcon className="w-5 h-5 text-indigo-500" /> Account Password
                </h3>

                <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={autoGenerate} 
                        onChange={(e) => setAutoGenerate(e.target.checked)} 
                    />
                    <span className="font-medium text-slate-700">Auto Generate Password</span>
                </label>

                {autoGenerate ? (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between gap-4 max-w-md animate-fade-in">
                        <div>
                            <span className="text-slate-400 block text-xs font-medium uppercase text-left">Generated Preview</span>
                            <code className="text-slate-900 font-mono font-bold mt-1 block text-left">
                                {generateUnpredictablePasswordFront(nameVal, dobVal, randSuffix)}
                            </code>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setRandSuffix(generateRandomSuffix())}
                            className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white"
                        >
                            <RefreshCwIcon className="w-3.5 h-3.5" /> Generate Again
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl animate-fade-in text-sm text-slate-700">
                        <div className="relative">
                            <label className="block mb-2">Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    required 
                                    value={passwordVal}
                                    onChange={(e) => setPasswordVal(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 animate-fade-in"
                                >
                                    {showPassword ? <EyeOffIcon size={18}/> : <EyeIcon size={18}/>}
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <label className="block mb-2">Confirm Password</label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    name="confirmPassword" 
                                    required 
                                    value={confirmPasswordVal}
                                    onChange={(e) => setConfirmPasswordVal(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 animate-fade-in"
                                >
                                    {showConfirmPassword ? <EyeOffIcon size={18}/> : <EyeIcon size={18}/>}
                                </button>
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <PasswordStrengthCheck password={passwordVal} />
                        </div>
                    </div>
                )}
            </div>
        )}

         <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center">
                {loading && <Loader2Icon className="w-4 h-4 mr-2 animate-spin"/>}
                {isEditMode ? "Update Employee" : "Create Employee"}
            </button>
         </div>
    </form>
  )
}

export default EmployeeForm
