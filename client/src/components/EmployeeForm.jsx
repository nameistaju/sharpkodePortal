import { useState, useEffect } from "react"
import { DEPARTMENTS } from "../assets/assets"
import { 
  Loader2Icon, EyeIcon, EyeOffIcon, CheckIcon, CopyIcon, 
  LockIcon, RefreshCwIcon, KeyIcon, LogOutIcon, User, 
  Calendar, FileText, ClipboardList, Shield, UploadCloud
} from "lucide-react"
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
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2 mt-2 w-full text-left">
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

    // Tabs control in edit mode
    const [activeTab, setActiveTab] = useState("profile"); // profile, attendance, leave, security, activity, documents

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

    // Edit Mode Security States
    const [changePassword, setChangePassword] = useState(false);
    const [forceChange, setForceChange] = useState(initialData?.forcePasswordChange ?? true);
    const [securityInfo, setSecurityInfo] = useState(null);
    const [loadingSecurity, setLoadingSecurity] = useState(false);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    // Edit Mode Attendance History
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);

    // Edit Mode Leave History
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [loadingLeaves, setLoadingLeaves] = useState(false);

    // Edit Mode Client Activities Feed
    const [activityHistory, setActivityHistory] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);

    // Success State
    const [successData, setSuccessData] = useState(null);
    const [copied, setCopied] = useState(false);

    // Load Security tab details
    useEffect(() => {
        if (isEditMode && initialData?._id && activeTab === "security") {
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
    }, [isEditMode, initialData?._id, activeTab, refetchTrigger]);

    // Load Attendance tab details
    useEffect(() => {
        if (isEditMode && initialData?._id && activeTab === "attendance") {
            const fetchAttendance = async () => {
                setLoadingAttendance(true);
                try {
                    const res = await api.get(`/attendance/history?employeeId=${initialData._id}&limit=50`);
                    setAttendanceHistory(res.data.data.items || []);
                } catch (err) {
                    console.error("Failed to fetch attendance:", err);
                } finally {
                    setLoadingAttendance(false);
                }
            };
            fetchAttendance();
        }
    }, [isEditMode, initialData?._id, activeTab]);

    // Load Leave tab details
    useEffect(() => {
        if (isEditMode && initialData?._id && activeTab === "leave") {
            const fetchLeaves = async () => {
                setLoadingLeaves(true);
                try {
                    const res = await api.get(`/leaves?employeeId=${initialData._id}&limit=50`);
                    setLeaveHistory(res.data.data.items || []);
                } catch (err) {
                    console.error("Failed to fetch leaves:", err);
                } finally {
                    setLoadingLeaves(false);
                }
            };
            fetchLeaves();
        }
    }, [isEditMode, initialData?._id, activeTab]);

    // Load Client Activities tab details
    useEffect(() => {
        if (isEditMode && initialData?._id && activeTab === "activity") {
            const fetchActivities = async () => {
                setLoadingActivities(true);
                try {
                    const res = await api.get(`/activities/feed?employeeId=${initialData._id}&limit=50`);
                    setActivityHistory(res.data.data.items || []);
                } catch (err) {
                    console.error("Failed to fetch activities:", err);
                } finally {
                    setLoadingActivities(false);
                }
            };
            fetchActivities();
        }
    }, [isEditMode, initialData?._id, activeTab]);

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
            <div className="card p-6 text-center space-y-6 max-w-md mx-auto animate-fade-in border border-slate-100 bg-white">
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
                                className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-md text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
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
                <button type="button" onClick={onSuccess} className="btn-primary w-full py-2.5 font-bold rounded-xl">
                    Done & Close
                </button>
            </div>
        );
    }

    // Modal Tabs Navigation Menu (Only displayed in Edit Mode)
    const tabItems = [
      { id: "profile", name: "Profile", icon: User },
      { id: "attendance", name: "Attendance Logs", icon: Calendar },
      { id: "leave", name: "Leave Balances", icon: FileText },
      { id: "security", name: "Security Settings", icon: Shield },
      { id: "activity", name: "Client Activities", icon: ClipboardList },
      { id: "documents", name: "Documents Vault", icon: UploadCloud }
    ];

    return (
      <div className="space-y-6">
        {/* Render Tab Selection bar in Edit mode */}
        {isEditMode && (
          <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-px scrollbar-none">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PROFILE TAB CONTENT OR CREATE MODE */}
          {(activeTab === "profile" || !isEditMode) && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700 text-left">
                  <div className="sm:col-span-2">
                      <label className="block mb-1.5 font-semibold text-slate-500">Full Name</label>
                      <input 
                          name="name" 
                          required 
                          value={nameVal}
                          onChange={(e) => setNameVal(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                  </div>
                  <div>
                      <label className="block mb-1.5 font-semibold text-slate-500">Phone Number</label>
                      <input 
                          name="phone" 
                          required 
                          defaultValue={initialData?.phone || ""} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                  </div>
                  <div>
                      <label className="block mb-1.5 font-semibold text-slate-500">Work Email</label>
                      <input 
                          type="email" 
                          name="email" 
                          required 
                          disabled={isEditMode} 
                          defaultValue={initialData?.email || ""} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                  </div>
                  <div>
                      <label className="block mb-1.5 font-semibold text-slate-500">Date of Birth</label>
                      <input 
                          type="date" 
                          name="dob" 
                          required={!isEditMode} 
                          value={dobVal}
                          onChange={(e) => setDobVal(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                  </div>
                  <div>
                      <label className="block mb-1.5 font-semibold text-slate-500">Join Date</label>
                      <input 
                          type="date" 
                          name="joinDate" 
                          defaultValue={initialData?.joinDate ? new Date(initialData.joinDate).toISOString().split("T")[0] : ""} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                  </div>
                  <div>
                      <label className="block mb-1.5 font-semibold text-slate-500">Department</label>
                      <select 
                          name="department" 
                          required 
                          defaultValue={initialData?.department || ""}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                          <option value="">Select Department</option>
                          {DEPARTMENTS.map((deptName)=><option key={deptName} value={deptName}>{deptName}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block mb-1.5 font-semibold text-slate-500">System Role</label>
                      <select 
                          name="role" 
                          defaultValue={initialData?.role || "EMPLOYEE"}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                          <option value="EMPLOYEE">Employee</option>
                          <option value="ADMIN">Admin</option>
                      </select>
                  </div>
                  {isEditMode && (
                      <div>
                          <label className="block mb-1.5 font-semibold text-slate-500">Status</label>
                          <select 
                              name="status" 
                              defaultValue={initialData?.status || "ACTIVE"}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                          </select>
                      </div>
                  )}
              </div>

              {/* Password Section inside Create Mode */}
              {!isEditMode && (
                <div className="border-t border-slate-100 pt-5 space-y-4 text-left">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <LockIcon className="w-4.5 h-4.5 text-indigo-500" /> Account Password Policy
                  </h3>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={autoGenerate} 
                      onChange={(e) => setAutoGenerate(e.target.checked)} 
                    />
                    <span className="font-semibold text-xs text-slate-700">Auto Generate Secure Temporary Password</span>
                  </label>

                  {autoGenerate ? (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between gap-4 max-w-md animate-fade-in">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Generated Preview</span>
                        <code className="text-slate-900 font-mono font-bold mt-1 block">
                          {generateUnpredictablePasswordFront(nameVal, dobVal, randSuffix)}
                        </code>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setRandSuffix(generateRandomSuffix())}
                        className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-[10px] font-bold bg-white rounded-lg border-slate-200 hover:bg-slate-50 cursor-pointer"
                      >
                        <RefreshCwIcon className="w-3 h-3" /> Re-Generate
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl animate-fade-in text-sm text-slate-700">
                      <div>
                        <label className="block mb-1.5 font-semibold text-slate-500">Password</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            required 
                            value={passwordVal}
                            onChange={(e) => setPasswordVal(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOffIcon size={16}/> : <EyeIcon size={16}/>}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block mb-1.5 font-semibold text-slate-500">Confirm Password</label>
                        <div className="relative">
                          <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            name="confirmPassword" 
                            required 
                            value={confirmPasswordVal}
                            onChange={(e) => setConfirmPasswordVal(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOffIcon size={16}/> : <EyeIcon size={16}/>}
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

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" className="btn-secondary font-bold rounded-xl" onClick={onCancel}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center font-bold rounded-xl">
                  {loading && <Loader2Icon className="w-4 h-4 mr-2 animate-spin"/>}
                  {isEditMode ? "Update Profile" : "Create Employee"}
                </button>
              </div>
            </div>
          )}

          {/* ATTENDANCE HISTORY TAB CONTENT */}
          {activeTab === "attendance" && isEditMode && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">Attendance History Logs</h3>
              {loadingAttendance ? (
                <div className="space-y-3 py-4">
                  <div className="h-6 bg-slate-50 skeleton rounded-lg w-full" />
                  <div className="h-6 bg-slate-50 skeleton rounded-lg w-full" />
                  <div className="h-6 bg-slate-50 skeleton rounded-lg w-full" />
                </div>
              ) : attendanceHistory.length === 0 ? (
                <p className="text-slate-400 text-xs py-8 text-center bg-slate-50 border border-dashed rounded-2xl">No attendance logs found for this employee.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-200/60 rounded-2xl bg-white shadow-3xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-3 pl-4">Date</th>
                        <th className="p-3">Punch In</th>
                        <th className="p-3">Punch Out</th>
                        <th className="p-3">Working Hours</th>
                        <th className="p-3 pr-4">GPS verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                      {attendanceHistory.map((log) => {
                        const dateStr = new Date(log.date).toLocaleDateString([], {
                          year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'
                        });
                        const punchInTime = log.punchIn?.time ? new Date(log.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
                        const punchOutTime = log.punchOut?.time ? new Date(log.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

                        return (
                          <tr key={log._id} className="hover:bg-slate-50/50">
                            <td className="p-3 pl-4 text-slate-900">{dateStr}</td>
                            <td className="p-3 font-mono text-slate-500">{punchInTime}</td>
                            <td className="p-3 font-mono text-slate-500">{punchOutTime}</td>
                            <td className="p-3 font-mono text-slate-600">{log.workingHours > 0 ? `${log.workingHours.toFixed(2)} hrs` : '-'}</td>
                            <td className="p-3 pr-4 text-[10px] text-slate-400 font-mono">
                              {log.punchIn?.location?.distanceFromOfficeMeters !== undefined && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">In: {Math.round(log.punchIn.location.distanceFromOfficeMeters)}m</span>
                              )}
                              {log.punchOut?.location?.distanceFromOfficeMeters !== undefined && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 ml-1.5">Out: {Math.round(log.punchOut.location.distanceFromOfficeMeters)}m</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* LEAVE BALANCES & REQUESTS TAB CONTENT */}
          {activeTab === "leave" && isEditMode && (
            <div className="space-y-6 text-left">
              {/* Balance Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Leave Balances</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(initialData.leaveBalances || []).map((bal) => (
                    <div key={bal.type} className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl text-center shadow-3xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{bal.type}</span>
                      <p className="text-2xl font-black text-slate-950 mt-1">{bal.allocated - bal.used} / {bal.allocated}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{bal.used} days consumed</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave requests list */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Leave Request History</h3>
                {loadingLeaves ? (
                  <div className="space-y-3 py-4">
                    <div className="h-6 bg-slate-50 skeleton rounded-lg w-full" />
                    <div className="h-6 bg-slate-50 skeleton rounded-lg w-full" />
                  </div>
                ) : leaveHistory.length === 0 ? (
                  <p className="text-slate-400 text-xs py-8 text-center bg-slate-50 border border-dashed rounded-2xl">No leave requests found for this employee.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200/60 rounded-2xl bg-white shadow-3xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3 pl-4">Type</th>
                          <th className="p-3">Start Date</th>
                          <th className="p-3">End Date</th>
                          <th className="p-3">Total Days</th>
                          <th className="p-3">Reason</th>
                          <th className="p-3 pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                        {leaveHistory.map((leave) => {
                          const startStr = new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                          const endStr = new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                          return (
                            <tr key={leave._id} className="hover:bg-slate-50/50">
                              <td className="p-3 pl-4 text-slate-900">{leave.leaveType}</td>
                              <td className="p-3 text-slate-500 font-mono">{startStr}</td>
                              <td className="p-3 text-slate-500 font-mono">{endStr}</td>
                              <td className="p-3 font-mono text-slate-600">{leave.totalDays} days</td>
                              <td className="p-3 text-slate-500 truncate max-w-[180px]">{leave.reason}</td>
                              <td className="p-3 pr-4">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  leave.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                  'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                  {leave.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECURITY SETTINGS TAB CONTENT */}
          {activeTab === "security" && isEditMode && (
            <div className="space-y-6 text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <LockIcon className="w-4 h-4 text-indigo-500" /> Security Credentials Policy
              </h3>

              {loadingSecurity ? (
                <div className="space-y-3 py-4">
                  <div className="h-6 bg-slate-50 skeleton rounded-lg w-1/3" />
                  <div className="h-6 bg-slate-50 skeleton rounded-lg w-1/4" />
                </div>
              ) : (
                <div className="space-y-5">
                  {securityInfo && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200/50 rounded-2xl shadow-3xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Last Password Change</span>
                        <span className="text-slate-900 font-bold text-xs mt-0.5 block">
                          {securityInfo.lastPasswordChange ? new Date(securityInfo.lastPasswordChange).toLocaleString() : "Never"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Active Device Sessions</span>
                        <span className="text-slate-900 font-bold text-xs mt-0.5 flex items-center gap-1.5">
                          {securityInfo.activeSessions}
                          {securityInfo.activeSessions > 0 && (
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={changePassword} 
                        onChange={(e) => setChangePassword(e.target.checked)} 
                      />
                      <span className="font-semibold text-xs text-slate-700">Manually Change Employee Password</span>
                    </label>

                    {changePassword && (
                      <div className="pl-6.5 space-y-4 max-w-xl animate-fade-in text-xs font-medium">
                        <div>
                          <label className="block mb-1.5 font-semibold text-slate-500">New Password</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"} 
                              name="password" 
                              required 
                              value={passwordVal}
                              onChange={(e) => setPasswordVal(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showPassword ? <EyeOffIcon size={16}/> : <EyeIcon size={16}/>}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block mb-1.5 font-semibold text-slate-500">Confirm New Password</label>
                          <div className="relative">
                            <input 
                              type={showConfirmPassword ? "text" : "password"} 
                              name="confirmPassword" 
                              required 
                              value={confirmPasswordVal}
                              onChange={(e) => setConfirmPasswordVal(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showConfirmPassword ? <EyeOffIcon size={16}/> : <EyeIcon size={16}/>}
                            </button>
                          </div>
                        </div>

                        <PasswordStrengthCheck password={passwordVal} />
                      </div>
                    )}

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="forcePasswordChange"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={forceChange} 
                        onChange={(e) => setForceChange(e.target.checked)} 
                      />
                      <span className="font-semibold text-xs text-slate-700">Force password change next login</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={handleResetPassword}
                      className="btn-secondary flex items-center gap-2 border-amber-200 hover:bg-amber-50/50 text-amber-700 font-bold rounded-xl cursor-pointer"
                    >
                      <KeyIcon className="w-4 h-4" /> Reset Temporary Password
                    </button>
                    {securityInfo && securityInfo.activeSessions > 0 && (
                      <button 
                        type="button" 
                        onClick={handleLogoutAll}
                        className="btn-secondary flex items-center gap-2 border-rose-200 hover:bg-rose-50/50 text-rose-700 font-bold rounded-xl cursor-pointer"
                      >
                        <LogOutIcon className="w-4 h-4" /> Revoke All Active Sessions
                      </button>
                    )}
                  </div>
                  
                  {changePassword && (
                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                      <button type="button" className="btn-secondary font-bold rounded-xl" onClick={() => setChangePassword(false)}>Cancel</button>
                      <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center font-bold rounded-xl">
                        {loading && <Loader2Icon className="w-4 h-4 mr-2 animate-spin"/>}
                        Save New Password
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CLIENT ACTIVITIES TAB CONTENT */}
          {activeTab === "activity" && isEditMode && (
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logged Client Activities</h3>
              {loadingActivities ? (
                <div className="space-y-3 py-4">
                  <div className="h-6 bg-slate-50 skeleton rounded-lg w-full" />
                  <div className="h-6 bg-slate-50 skeleton rounded-lg w-full" />
                </div>
              ) : activityHistory.length === 0 ? (
                <p className="text-slate-400 text-xs py-8 text-center bg-slate-50 border border-dashed rounded-2xl">No client activities logged by this employee.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-200/60 rounded-2xl bg-white shadow-3xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-3 pl-4">Client</th>
                        <th className="p-3">Activity Type</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3 pr-4">Logged At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                      {activityHistory.map((act) => {
                        const dateStr = new Date(act.createdAt).toLocaleString([], {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        });
                        return (
                          <tr key={act._id} className="hover:bg-slate-50/50">
                            <td className="p-3 pl-4 text-slate-900 font-bold">{act.client?.clientName || 'Unknown'}</td>
                            <td className="p-3">
                              <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] text-slate-500 font-bold">
                                {act.activityType}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-medium truncate max-w-[200px]">{act.description}</td>
                            <td className="p-3 font-mono text-slate-500">{act.durationMinutes} mins</td>
                            <td className="p-3 pr-4 font-mono text-slate-400">{dateStr}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS COMPLIANCE VAULT TAB CONTENT */}
          {activeTab === "documents" && isEditMode && (
            <div className="space-y-5 text-left">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance Documents Vault</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Secure, cryptographically signed storage of compliance records and identities</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Aadhaar Card', 'PAN Card', 'Offer Letter', 'Resume', 'Certificates'].map((docName) => (
                  <div 
                    key={docName} 
                    className="p-5 border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 rounded-2xl flex flex-col justify-center items-center text-center group cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center mb-3 shadow-3xs transition-colors">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700">{docName}</span>
                    <span className="text-[9px] text-slate-400 mt-1 leading-none font-bold uppercase tracking-wider">PDF, JPG, PNG (Max 5MB)</span>
                    <button 
                      type="button" 
                      className="btn-secondary py-1 text-[10px] font-bold mt-3 px-3 rounded-lg border-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      Choose File
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    );
}

export default EmployeeForm
