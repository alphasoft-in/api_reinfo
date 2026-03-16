"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  LayoutDashboard, 
  CheckCircle2, 
  PauseCircle, 
  FileText, 
  LogOut, 
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Bell,
  ExternalLink,
  ChevronDown,
  Activity,
  UserCircle2,
  Filter,
  User,
  Zap,
  Users,
  AlertCircle,
  Settings,
  ShieldCheck,
  Edit3,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  Trash2,
  Pencil,
  X
} from "lucide-react";
import axios from "axios";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isRegistering, setIsRegistering] = useState(false);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, vigentes: 0, suspendidos: 0 });
  const [usage, setUsage] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminError, setAdminError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loginError, setLoginError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [plansConfig, setPlansConfig] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [subHistory, setSubHistory] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingUpgradePlan, setPendingUpgradePlan] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    checkSession();
    const handleClickOutside = (e) => {
      if (showUserMenu && !e.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const checkSession = async () => {
    try {
      const res = await axios.get("/api/v1/auth/me");
      if (res.data.success) {
        setUser(res.data.user);
        setIsLoggedIn(true);
      }
    } catch (err) {
      setIsLoggedIn(false);
    } finally {
      setIsValidatingSession(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      fetchUsage();
      fetchSubHistory();
      
      // Load data and config
      if (user?.role === 'superadmin') {
        if (activeTab === 'admin' || activeTab === 'dashboard') {
          console.log('Tab change/Effect: fetching admin users');
          fetchAdminUsers();
        }
        fetchPlanes();
        if (activeTab === 'dashboard') fetchData();
      } else {
        fetchPlanes();
        if (activeTab === 'dashboard' && (query || hasSearched)) {
          fetchData();
        } else if (activeTab === 'dashboard') {
          setData([]); 
        }
      }
    }
  }, [isLoggedIn, page, activeTab, hasSearched, user?.role]);

  const fetchAdminUsers = async () => {
    try {
      setAdminError("");
      console.log('Initiating Admin Users Fetch...');
      const res = await axios.get("/api/v1/admin/users");
      console.log('Admin Users Response:', res.status, res.data);
      if (res.data.success) {
        if (res.data.users) {
          setAdminUsers(res.data.users);
          if (res.data.users.length === 0) {
            setAdminError("La consulta fue exitosa pero no se encontró ningún cliente en la base de datos.");
          }
        } else {
          setAdminError("Error: La respuesta no contiene la lista de usuarios.");
        }
      } else {
        setAdminError(res.data.message || "Error desconocido al recuperar clientes.");
      }
    } catch (err) { 
      const msg = err.response?.data?.message || err.message;
      setAdminError("Error de Conexión/Permisos: " + msg);
      console.error('Network/Auth Error in Admin Fetch:', err.response?.status, err.message);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await axios.get("/api/v1/user/usage");
      if (res.data.success) {
        setUsage(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/v1/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlanes = async () => {
    try {
      const res = await axios.get("/api/v1/planes");
      if (res.data.success) setPlansConfig(res.data.planes);
    } catch (err) { console.error(err); }
  };

  const fetchSubHistory = async () => {
    try {
      const res = await axios.get("/api/v1/user/subscriptions");
      if (res.data.success) setSubHistory(res.data.history);
    } catch (err) { console.error(err); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/api/v1/user/notifications");
      if (res.data.success) setNotifications(res.data.notifications);
    } catch (err) { console.error(err); }
  };

  const markNotificationsAsRead = async () => {
    try {
      await axios.post("/api/v1/user/notifications");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) { console.error(err); }
  };

  const handleUpdatePlanConfig = async (id, updates) => {
    try {
      const res = await axios.put("/api/v1/planes", { id, ...updates });
      if (res.data.success) {
        fetchPlanes();
        setEditingPlan(null);
      }
    } catch (err) { console.error(err); }
  };

  const fetchData = async (searchQuery = query) => {
    setLoading(true);
    setSearchError("");
    try {
      const statusParam = activeTab === "vigentes" ? "vigente" : activeTab === "suspendidos" ? "suspendido" : "todos";
      const params = { limit: 12, offset: (page - 1) * 12, status: statusParam };
      if (searchQuery) {
        if (/^\d+$/.test(searchQuery)) params.ruc = searchQuery;
        else params.name = searchQuery;
      }
      const res = await axios.get("/api/v1/registros", { params });
      if (res.data.success) {
        setData(res.data.data);
        setTotalPages(Math.ceil(res.data.filteredCount / 12));
        // Proactive sync of usage after successful query
        if (user?.role !== 'superadmin') fetchUsage();
      }
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      if (err.response?.status === 403) {
        setSearchError(err.response?.data?.message || "Límite de consultas alcanzado.");
        setData([]); // Clear data if blocked
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    try {
      const res = await axios.post("/api/v1/auth/login", { email, password });
      
      if (res.data.mfaRequired) {
        setMfaToken(res.data.mfaToken);
        setMfaRequired(true);
        return;
      }

      if (res.data.success) {
        setUser(res.data.user);
        setIsLoggedIn(true);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || "Acceso no autorizado.");
    }
  };

  const handleVerifyMFA = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/v1/auth/login/verify", { 
        code: e.target.code.value,
        mfaToken
      });
      if (res.data.success) {
        setUser(res.data.user);
        setIsLoggedIn(true);
        setMfaRequired(false);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || "Código inválido.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await axios.post("/api/v1/auth/register", { 
        password: e.target.password.value,
        email: e.target.email.value,
        plan: e.target.plan?.value || 'FREE'
      });
      if (res.data.success) {
        setIsRegistering(false);
        setLoginError("Registro corporativo exitoso. Por seguridad, configure la autenticación de 2 pasos en su perfil tras ingresar.");
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || "Error al registrar.");
    }
  };

  const handlePlanSelect = async (planName) => {
    const planKey = planName.toUpperCase();
    if (usage?.user?.plan === planKey) return;
    
    // Instead of immediate upgrade, show payment modal
    setPendingUpgradePlan(planName);
    setShowUpgradeModal(true);
  };

  const handleUpgradeSubmit = async (paymentData) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/v1/user/upgrade", { 
        plan: pendingUpgradePlan.toUpperCase(),
        ...paymentData
      });
      if (res.data.success) {
        await fetchUsage();
        await checkSession();
        setShowUpgradeModal(false);
        setPendingUpgradePlan(null);
        setActiveTab("dashboard");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetApiKey = async () => {
    if (!confirm("¿Estás seguro de regenerar tu API Key? Las integraciones actuales dejarán de funcionar.")) return;
    setLoading(true);
    try {
      const res = await axios.post("/api/v1/user/reset-key");
      if (res.data.success) {
        await checkSession();
        alert("Nueva API Key generada con éxito");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const res = await axios.post("/api/v1/admin/users", { userId, ...updates });
      if (res.data.success) {
        fetchAdminUsers();
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (err) { 
      console.error(err); 
      alert("Error de conexión al actualizar usuario");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const res = await axios.delete(`/api/v1/admin/users?id=${userId}`);
      if (res.data.success) {
        fetchAdminUsers();
        setShowDeleteConfirm(null);
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (err) { 
      console.error(err); 
      alert("Error de conexión al eliminar usuario");
    }
  };

  const handleLogout = async () => {
    await axios.post("/api/v1/auth/logout");
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setHasSearched(true);
      setPage(1);
      // Removed direct fetchData() call to avoid double increment
      // setHasSearched(true) will trigger the useEffect to call fetchData()
    }
  };

  const handleBrowseAll = () => {
    if (confirm("Al cargar todos los registros se descontará 1 crédito de tu cuota. ¿Deseas continuar?")) {
      setPage(1);
      setHasSearched(true);
      fetchData();
    }
  };

  if (isValidatingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-zinc-950 transition-colors duration-500">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-zinc-200/50 dark:shadow-none animate-pulse">
            <Database className="w-8 h-8 text-zinc-900 dark:text-zinc-100" />
          </div>
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-xs font-light text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Iniciando Ecosistema</p>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-zinc-950 p-6 selection:bg-zinc-900 selection:text-white">
        <div className="w-full max-w-[420px] space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center text-center space-y-4">
             <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center shadow-sm">
               <Database className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
             </div>
             <div className="space-y-1">
                <h1 className="text-xl font-light tracking-normal">{isRegistering ? 'Crear Cuenta SAAS' : 'Acceso Corporativo'}</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Sistema de Gestión de Registros REINFO</p>
             </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none p-10">
            <form onSubmit={mfaRequired ? handleVerifyMFA : (isRegistering ? handleRegister : handleLogin)} className="space-y-6">
              {!mfaRequired ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-light text-zinc-500 uppercase tracking-widest ml-1">{isRegistering ? 'Email Corporativo' : 'Correo Electrónico'}</label>
                    <input 
                      name="email" type="email" required 
                      className="w-full h-11 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-300"
                      placeholder="empresa@correo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-light text-zinc-500 uppercase tracking-widest ml-1">Contraseña</label>
                    <input 
                      name="password" type="password" required 
                      className="w-full h-11 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-300"
                      placeholder="••••••••"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                   <div className="text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-blue-500 mx-auto" />
                      <p className="text-sm font-light">Verificación en dos pasos requerida</p>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1">Código de 6 dígitos</label>
                      <input 
                        name="code" type="text" maxLength="6" required autoFocus
                        className="w-full h-12 text-center text-xl tracking-[0.5em] font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="000000"
                      />
                   </div>
                </div>
              )}
              
              {isRegistering && (
                <div className="space-y-2">
                  <label className="text-xs font-light text-zinc-500 uppercase tracking-widest ml-1">Plan Inicial</label>
                  <div className="relative">
                    <select 
                      name="plan" required
                      className="w-full h-11 px-4 pr-12 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all appearance-none cursor-pointer"
                    >
                      <option value="FREE">FREE - 5 Consultas</option>
                      <option value="PROFESSIONAL">PRO - 5,000 Consultas</option>
                      <option value="ENTERPRISE">ENTERPRISE - 20,000 Consultas</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-3.5 h-4 text-zinc-400" />
                    </div>
                  </div>
                </div>
              )}
              {loginError && (
                <div className={`p-3 border rounded-lg ${loginError.includes('exitoso') ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                  <p className="text-xs font-light text-center">{loginError}</p>
                </div>
              )}
              <button 
                type="submit"
                disabled={loading || (user?.active === false && user?.role !== 'superadmin')}
                className={`w-full h-12 rounded-xl transition-all shadow-lg ${user?.active === false && user?.role !== 'superadmin' ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-light hover:opacity-90 shadow-zinc-900/10 dark:shadow-none'}`}
              >
                {loading ? 'Procesando...' : mfaRequired ? 'Verificar Código' : isRegistering ? 'Registrar Empresa' : 'Continuar'}
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
              {mfaRequired ? (
                <button onClick={() => setMfaRequired(false)} className="text-xs font-light text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">
                  Volver al inicio
                </button>
              ) : (
                <button onClick={() => setIsRegistering(!isRegistering)} className="text-xs font-light text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 uppercase tracking-widest transition-colors">
                  {isRegistering ? '¿Ya tienes cuenta? Ingresa' : '¿Nueva empresa? Regístrate'}
                </button>
              )}
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-zinc-400 font-light uppercase tracking-widest">Plataforma de Consulta Certificada v4.6</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoggedIn && !user) return null;

  return (
    <div className="flex h-screen bg-[#fcfdfe] dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 overflow-hidden font-sans selection:bg-zinc-900 selection:text-white">
      {/* Sidebar Interface */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 hidden lg:flex flex-col shrink-0 bg-white dark:bg-zinc-950">
        <div className="h-16 flex items-center px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white dark:text-zinc-900" />
            </div>
            <span className="font-light text-lg tracking-normal">REINFO Pro</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          <div className="mb-4">
            <p className="px-3 text-[10px] font-light text-zinc-400 uppercase tracking-widest mb-2">Monitor Principal</p>
            {[
              { id: "dashboard", icon: LayoutDashboard, label: "Vista General" },
              ...(user?.role === 'superadmin' ? [
                { id: "vigentes", icon: CheckCircle2, label: "Registros Vigentes" },
                { id: "suspendidos", icon: PauseCircle, label: "En Suspensión" },
                { id: "planes", icon: Zap, label: "Gestión de Planes" },
              ] : [
                { id: "planes", icon: Zap, label: "Planes y Precios" },
              ]),
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setPage(1); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-light transition-all ${activeTab === item.id ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50'}`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`} />
                {item.label}
              </button>
            ))}
          </div>

          {user?.role === 'superadmin' && (
            <div className="pt-4 border-t border-zinc-50 dark:border-zinc-900/50 mt-4">
               <p className="px-3 text-[10px] font-light text-zinc-400 uppercase tracking-widest mb-2">Administrar SaaS</p>
               <button
                  onClick={() => setActiveTab('admin')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-light transition-all ${activeTab === 'admin' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:bg-zinc-50/80'}`}
               >
                  <Users className="w-4 h-4" />
                  Gestión Clientes
               </button>
            </div>
          )}
          
          <div className="pt-6">
             <p className="px-3 text-[10px] font-light text-zinc-400 uppercase tracking-widest mb-2">Recursos API</p>
             <button 
               onClick={() => setActiveTab('docs')}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-light transition-all ${activeTab === 'docs' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50'}`}
             >
               <FileText className={`w-4 h-4 ${activeTab === 'docs' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`} />
               Documentación
             </button>
          </div>
        </nav>

        <div className="p-6 mt-auto shrink-0">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-[10px] font-light text-zinc-400 uppercase mb-3">
              <span>Plan {usage?.user?.plan || 'Free'}</span>
              <Zap className="w-3 h-3 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-light">{(usage?.user?.quota_used || user?.quota_used || 0).toLocaleString()}</span>
              <span className="text-xs text-zinc-400 font-light">/ {(usage?.user?.quota_limit || user?.quota_limit || 10).toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-1000" 
                style={{ width: `${((usage?.user?.quota_used || 0) / (usage?.user?.quota_limit || 1)) * 100}%` }} 
              />
            </div>
            {usage?.user?.subscription_end && (
              <p className="text-[9px] text-zinc-400 mt-3 font-light uppercase tracking-normaler">Vence: {new Date(usage.user.subscription_end).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-zinc-950">
        {/* Header Console */}
        <header className="h-16 flex items-center justify-between px-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
          <div className="flex-1 max-w-xl">
            <form 
              onSubmit={handleSearch} 
              className="relative flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 focus-within:border-zinc-900 dark:focus-within:border-zinc-100 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all shadow-inner overflow-hidden group"
            >
              <div className="pl-4 pr-2 py-2 flex items-center justify-center shrink-0">
                <Search className={`w-4 h-4 transition-colors ${query ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`} />
              </div>
              <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar por RUC o Titular..."
                className="flex-1 bg-transparent border-none py-2 text-sm focus:ring-0 outline-none placeholder:text-zinc-400"
              />
              <div className="flex items-center self-stretch">
                <button 
                  type="submit"
                  disabled={loading || !query.trim()}
                  className={`w-14 h-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-0 disabled:translate-x-4 disabled:pointer-events-none rounded-r-2xl border-l border-zinc-200 dark:border-zinc-800 ${
                    loading 
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400' 
                      : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.1)]'
                  }`}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3 ml-6">
            <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
            
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                  if (!showNotifications) markNotificationsAsRead();
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${showNotifications ? 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[60] animate-in fade-in slide-in-from-top-2 origin-top-right overflow-hidden">
                   <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/10">
                      <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Notificaciones</p>
                      <span className="text-[9px] text-zinc-400 font-light px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                        {notifications.length} Totales
                      </span>
                   </div>
                   
                   <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
                      {notifications.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                           <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-3">
                              <Bell className="w-5 h-5 text-zinc-300" />
                           </div>
                           <p className="text-sm font-light text-zinc-900 dark:text-zinc-100">Bandeja Vacía</p>
                           <p className="text-[10px] text-zinc-500 mt-1">No tienes alertas pendientes en este momento.</p>
                        </div>
                      ) : notifications.map(notif => (
                        <div key={notif.id} className={`p-5 border-b border-zinc-50 dark:border-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all relative group ${!notif.is_read ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}>
                           <div className="flex gap-4">
                              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                                notif.type === 'success' ? 'bg-green-50 text-green-600' : 
                                notif.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                                notif.type === 'error' ? 'bg-red-50 text-red-600' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                                 {notif.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 
                                  notif.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                                  notif.type === 'error' ? <ShieldAlert className="w-4 h-4" /> :
                                  <Bell className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                 <p className="text-[12px] font-medium text-zinc-900 dark:text-zinc-100 leading-tight mb-1">{notif.title}</p>
                                 <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-light">{notif.message}</p>
                                 <p className="text-[9px] text-zinc-400 mt-2 font-light uppercase tracking-tighter">
                                    {new Date(notif.created_at).toLocaleDateString()} • {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                              </div>
                              {!notif.is_read && (
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                              )}
                           </div>
                        </div>
                      ))}
                   </div>

                   <button 
                     onClick={() => setShowNotifications(false)}
                     className="w-full py-3.5 text-[10px] font-light text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 uppercase tracking-widest bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border-t border-zinc-100 dark:border-zinc-800"
                   >
                      Cerrar Panel
                   </button>
                </div>
              )}
            </div>
            
            <div className="relative user-menu-container">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-3 h-11 px-4 border transition-all outline-none rounded-2xl ${showUserMenu ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm' : 'border-transparent hover:bg-white dark:hover:bg-zinc-900'}`}
              >
                <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-[10px] font-light text-white dark:text-zinc-900 uppercase">
                  {user?.email?.[0] || user?.username?.[0] || 'U'}
                </div>
                <div className="text-left hidden xl:block">
                   <p className="text-xs font-light leading-none">{user?.email?.split('@')?.[0] || user?.username || 'Usuario'}</p>
                   <p className="text-[10px] text-zinc-500 font-light uppercase mt-1">
                     {user?.role === 'superadmin' ? 'Sistemas' : 'Cliente'}
                   </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-top-2 origin-top-right">
                  <div className="px-4 py-3 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] font-light text-zinc-400 uppercase tracking-widest mb-2">Identidad</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-xs font-light">
                        {user?.email?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-light truncate max-w-[140px]">{user?.email || 'Sesión Activa'}</p>
                        <p className="text-[10px] text-zinc-500 font-light uppercase">{usage?.user?.plan || user?.plan || 'Free'} Plan</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <button onClick={() => { setActiveTab('planes'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-light text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all">
                      <Zap className="w-4 h-4 text-zinc-400" />
                      Planes y Facturación
                    </button>
                    <button 
                      onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-light text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all"
                    >
                      <Settings className="w-4 h-4 text-zinc-400" />
                      Configuración
                    </button>
                  </div>
                  <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-2 mx-1" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-light text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all">
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 custom-scrollbar">
          {!usage?.user?.two_factor_enabled && !user?.two_factor_enabled && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                     <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                     <p className="text-sm font-light text-blue-900 dark:text-blue-100">Seguridad: Active la Autenticación en 2 Pasos</p>
                     <p className="text-xs text-blue-600/80 dark:text-blue-400/60 font-light">Proteja su acceso corporativo y datos sensibles configurando un token de seguridad.</p>
                  </div>
               </div>
               <button 
                 onClick={() => setActiveTab('settings')}
                 className="px-4 py-2 bg-blue-600 text-white text-[10px] font-light rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest"
               >
                 Configurar Ahora
               </button>
            </div>
          )}
          {activeTab === 'admin' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light tracking-normal">Administración de Clientes</h2>
                  <p className="text-sm text-zinc-400 font-light mt-1">Gestión centralizada de suscripciones, cuotas y acceso de empresas.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                    <span className="text-[10px] font-light text-zinc-400 uppercase tracking-widest mr-2">Total Clientes:</span>
                    <span className="text-sm font-light">{adminUsers.length}</span>
                  </div>
                  <button 
                    onClick={fetchAdminUsers}
                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-all border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    title="Refrescar Lista"
                  >
                    <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading && 'animate-spin'}`} />
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <th className="px-6 py-4 text-[11px] font-light text-zinc-400 uppercase tracking-wider">Identidad Corporativa</th>
                      <th className="px-6 py-4 text-[11px] font-light text-zinc-400 uppercase tracking-wider">Plan Actual</th>
                      <th className="px-6 py-4 text-[11px] font-light text-zinc-400 uppercase tracking-wider">Uso de Cuota</th>
                      <th className="px-6 py-4 text-[11px] font-light text-zinc-400 uppercase tracking-wider">Créditos / Pago</th>
                      <th className="px-6 py-4 text-[11px] font-light text-zinc-400 uppercase tracking-wider">Status Acceso</th>
                      <th className="px-6 py-4 text-[11px] font-light text-zinc-400 uppercase tracking-wider text-right">Gestión Administrativa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-light">
                    {adminError ? (
                      <tr>
                        <td colSpan="6" className="py-20 text-center">
                          <div className="max-w-md mx-auto space-y-3">
                             <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-4 opacity-50" />
                             <p className="text-red-600 dark:text-red-400 text-sm font-light italic">{adminError}</p>
                             <button 
                               onClick={fetchAdminUsers}
                               className="px-4 py-2 bg-zinc-900 text-white text-[10px] font-light rounded-xl uppercase tracking-widest mt-4"
                             >
                               Reintentar Conexión
                             </button>
                          </div>
                        </td>
                      </tr>
                    ) : adminUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-20 text-center">
                          <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 opacity-10" />
                          <p className="text-zinc-400 text-sm font-light uppercase tracking-widest">Sincronizando Usuarios...</p>
                        </td>
                      </tr>
                    ) : adminUsers.map(u => (
                      <tr key={u.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-light text-zinc-900 dark:text-zinc-100">{u.email || u.username}</p>
                          <p className="text-[10px] text-zinc-400 font-mono italic">Acceso Verificado</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-light uppercase ${u.plan === 'ENTERPRISE' ? 'bg-zinc-800 text-zinc-100' : u.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
                            {u.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                               <div className="h-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${(u.quota_used / u.quota_limit) * 100}%` }} />
                             </div>
                             <span className="text-[10px] text-zinc-400 font-light">{((u.quota_used / u.quota_limit) * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                             <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-light w-fit ${u.payment_status === 'active' ? 'bg-blue-50 text-blue-600' : u.payment_status === 'pending_approval' ? 'bg-amber-50 text-amber-700 animate-pulse' : 'bg-orange-50 text-orange-700'}`}>
                                {u.payment_status === 'active' ? 'PAGO VERIFICADO' : u.payment_status === 'pending_approval' ? 'PENDIENTE APROBACIÓN' : 'PAGO PENDIENTE'}
                             </span>
                             {u.requested_plan && (
                               <span className="text-[9px] text-zinc-400 font-light italic">Solicito: {u.requested_plan}</span>
                             )}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center gap-1.5 text-[10px] font-light ${u.active ? 'text-blue-600' : 'text-zinc-400'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`} />
                              {u.active ? 'OPERATIVO' : 'SUSPENDIDO'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-4">
                              <button 
                                onClick={() => handleUpdateUser(u.id, { 
                                  ...u, 
                                  payment_status: u.payment_status === 'active' ? 'pending' : 'active',
                                  subscription_end: u.subscription_end,
                                  quota_limit: u.quota_limit,
                                  requested_plan: u.requested_plan
                                })}
                                className={`h-9 px-4 rounded-xl text-[10px] font-light transition-all ${u.payment_status === 'active' ? 'bg-zinc-100/50 text-zinc-400 hover:text-red-500' : u.payment_status === 'pending_approval' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20' : 'bg-zinc-900 text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900'}`}
                              >
                                {u.payment_status === 'active' ? 'ANULAR PAGO' : u.payment_status === 'pending_approval' ? 'APROBAR Y ACTIVAR' : 'APROBAR PAGO'}
                              </button>

                              <div className="flex items-center gap-1 border-l border-zinc-100 dark:border-zinc-800 pl-4">
                                <button 
                                  onClick={() => setEditingUser(u)}
                                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                  title="Gestionar Acceso"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => setShowDeleteConfirm(u)}
                                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-zinc-400 hover:text-red-600 transition-colors"
                                  title="Eliminar Cliente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                        <Trash2 className="w-7 h-7 text-red-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-light">Eliminar Cliente</h3>
                        <p className="text-sm text-zinc-500 font-light">
                          ¿Estás seguro de eliminar a <span className="font-medium text-zinc-900 dark:text-zinc-100">{showDeleteConfirm.email || showDeleteConfirm.username}</span>?
                          <br />Esta acción es irreversible y borrará todos sus logs de consulta.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-8">
                      <button 
                        onClick={() => setShowDeleteConfirm(null)}
                        className="h-11 rounded-xl text-sm font-light border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(showDeleteConfirm.id)}
                        className="h-11 rounded-xl text-sm font-light bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                      >
                        Eliminar Ahora
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit User Modal */}
              {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                     <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xl font-light">Detalles del Cliente</h3>
                       <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                          <X className="w-5 h-5 text-zinc-400" />
                       </button>
                     </div>
                     
                       <form onSubmit={(e) => {
                         e.preventDefault();
                         handleUpdateUser(editingUser.id, {
                           email: e.target.email.value,
                           quota_limit: parseInt(e.target.quota.value),
                           plan: e.target.plan.value,
                           active: e.target.status.value === 'true',
                           role: e.target.role.value,
                           payment_status: editingUser.payment_status
                         });
                         setEditingUser(null);
                       }} className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1">Estado de Acceso</label>
                              <div className="relative">
                                <select 
                                  name="status" defaultValue={editingUser.active.toString()}
                                  className="appearance-none w-full h-11 pl-4 pr-10 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-light focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all cursor-pointer"
                                >
                                  <option value="true">ACTIVO / OPERATIVO</option>
                                  <option value="false">SUSPENDIDO / BLOQUEADO</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1">Rol de Usuario</label>
                              <div className="relative">
                                <select 
                                  name="role" defaultValue={editingUser.role}
                                  className="appearance-none w-full h-11 pl-4 pr-10 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-light focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all cursor-pointer"
                                >
                                  <option value="user">USUARIO ESTÁNDAR</option>
                                  <option value="admin">ADMINISTRADOR</option>
                                  <option value="superadmin">SUPERADMIN</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1">Identidad Corporativa (Email)</label>
                            <input 
                              name="email" type="email" defaultValue={editingUser.email || editingUser.username} required 
                              className="w-full h-11 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-light focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1">Plan de Acceso</label>
                              <div className="relative">
                                <select 
                                  name="plan" defaultValue={editingUser.plan}
                                  onChange={(e) => {
                                    const plan = e.target.value;
                                    const input = document.getElementById('modal-quota-input');
                                    if (input) {
                                      const defaultQuotas = { 'FREE': 5, 'PROFESSIONAL': 5000, 'ENTERPRISE': 20000, 'PLATFORM': 1000000 };
                                      input.value = defaultQuotas[plan] || 5;
                                    }
                                  }}
                                  className="appearance-none w-full h-11 pl-4 pr-10 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-light focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all cursor-pointer"
                                >
                                  <option value="FREE">FREE</option>
                                  <option value="PROFESSIONAL">PROFESSIONAL</option>
                                  <option value="ENTERPRISE">ENTERPRISE</option>
                                  <option value="PLATFORM">PLATFORM</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1">Consultas</label>
                              <input 
                                id="modal-quota-input"
                                name="quota" type="number" defaultValue={editingUser.quota_limit} required 
                                className="w-full h-11 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-light focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all"
                              />
                            </div>
                          </div>

                          {editingUser.payment_status === 'pending_approval' && editingUser.payment_amount && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
                               <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                  <CreditCard className="w-4 h-4" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Pago Reportado por Cliente</span>
                               </div>
                               <div className="grid grid-cols-3 gap-4">
                                  <div>
                                     <p className="text-[9px] text-zinc-400 uppercase mb-1">Monto</p>
                                     <p className="text-sm font-mono text-zinc-900 dark:text-zinc-100">${editingUser.payment_amount}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] text-zinc-400 uppercase mb-1">Tipo</p>
                                     <p className="text-xs text-zinc-900 dark:text-zinc-100">{editingUser.payment_type}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] text-zinc-400 uppercase mb-1">Referencia</p>
                                     <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100">{editingUser.payment_reference}</p>
                                  </div>
                               </div>
                            </div>
                          )}
                        
                        <div className="pt-4 flex gap-3">
                          <button 
                            type="button"
                            onClick={() => setEditingUser(null)}
                            className="flex-1 h-12 rounded-xl text-sm font-light border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 h-12 rounded-xl text-sm font-light bg-zinc-900 text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 transition-all shadow-xl shadow-zinc-900/10"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                     </form>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'settings' ? (
            <div className="max-w-3xl mx-auto space-y-10 pb-20">
               <div className="space-y-4">
                  <h2 className="text-2xl font-extralight tracking-normal">Configuración del Perfil</h2>
                  <p className="text-zinc-500 font-light">Gestiona tu identidad, credenciales de API y preferencias de seguridad.</p>
               </div>

               <div className="space-y-8">
                  {/* Account Section */}
                  <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8">
                     <h3 className="text-lg font-light mb-6 flex items-center gap-2">
                        <UserCircle2 className="w-5 h-5 text-zinc-400" />
                        Información de Cuenta
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1">Email Corporativo</label>
                           <div className="w-full h-11 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-light flex items-center">
                              {user?.email || user?.username}
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1">Rol en Sistema</label>
                           <div className="w-full h-11 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-light flex items-center">
                              {user?.role === 'superadmin' ? 'Super Administrador' : 'Cliente Corporativo'}
                           </div>
                        </div>
                     </div>
                  </section>

                  {/* Dev Credentials Section */}
                  <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-light flex items-center gap-2">
                           <Zap className="w-5 h-5 text-amber-500" />
                           Credenciales de Desarrollador
                        </h3>
                     </div>
                     
                     <div className="space-y-4">
                        <p className="text-sm text-zinc-500 leading-relaxed">
                           Tu API Key es secreta. Úsala para integrar las consultas de REINFO en tus propios sistemas. No la compartas con nadie.
                        </p>
                        
                        <div className="space-y-2">
                           <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1 text-blue-500">Master API Key</label>
                           <div className="relative group">
                              <input 
                                readOnly value={user?.apiKey || 'Cargando...'}
                                type="password"
                                className="w-full h-12 pl-4 pr-32 bg-zinc-950 text-blue-400 font-mono text-xs rounded-xl border border-zinc-800 focus:ring-0 outline-none"
                              />
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(user?.apiKey);
                                  alert("API Key copiada al portapapeles");
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-[10px] font-light bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all uppercase tracking-widest"
                              >
                                Copiar
                              </button>
                           </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                           <div className="space-y-1">
                              <p className="text-xs font-light text-zinc-900 dark:text-zinc-100 italic">¿Has comprometido tu llave?</p>
                              <p className="text-[10px] text-zinc-500">Regenerar invalidará la anterior inmediatamente.</p>
                           </div>
                           <button 
                             onClick={handleResetApiKey}
                             disabled={loading}
                             className="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-light rounded-xl border border-red-100 hover:bg-red-100 transition-all uppercase tracking-widest"
                           >
                             Regenerar Key
                           </button>
                        </div>
                     </div>
                  </section>

                  {/* 2FA Section */}
                  <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-light flex items-center gap-2">
                           <AlertCircle className="w-5 h-5 text-blue-500" />
                           Seguridad: Autenticación en 2 Pasos
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${usage?.user?.two_factor_enabled ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400'}`}>
                           {usage?.user?.two_factor_enabled ? 'Activado' : 'Desactivado'}
                        </span>
                     </div>

                     {!twoFactorSetup ? (
                        <div className="space-y-4">
                           <p className="text-sm text-zinc-500 leading-relaxed">
                              Añade una capa extra de seguridad a tu cuenta corporativa usando una aplicación de autenticación (Google Authenticator, Authy, etc).
                           </p>
                           <button 
                             onClick={async () => {
                               setLoading(true);
                               try {
                                 const res = await axios.post("/api/v1/auth/2fa/setup");
                                 setTwoFactorSetup(res.data);
                               } catch (err) { console.error(err); }
                               finally { setLoading(false); }
                             }}
                             className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-light rounded-xl hover:opacity-90 transition-all uppercase tracking-widest"
                           >
                              Configurar 2FA
                           </button>
                        </div>
                     ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                              <div className="space-y-4">
                                 <p className="text-sm font-light">1. Escanea este código QR con tu aplicación:</p>
                                 <div className="w-48 h-48 bg-white p-2 border rounded-2xl mx-auto md:mx-0">
                                    <img src={twoFactorSetup.qrCode} alt="2FA QR Code" className="w-full h-full" />
                                 </div>
                                 <p className="text-[10px] text-zinc-400 font-mono break-all">{twoFactorSetup.secret}</p>
                              </div>
                              <div className="space-y-4">
                                 <p className="text-sm font-light">2. Ingresa el código de 6 dígitos para verificar:</p>
                                 <form 
                                   onSubmit={async (e) => {
                                     e.preventDefault();
                                     setLoading(true);
                                     try {
                                       const res = await axios.post("/api/v1/auth/2fa/verify", { code: e.target.code.value });
                                       if (res.data.success) {
                                          alert("2FA Activado correctamente");
                                          setTwoFactorSetup(null);
                                          fetchUsage();
                                       }
                                     } catch (err) { alert(err.response?.data?.message || "Error al verificar"); }
                                     finally { setLoading(false); }
                                   }}
                                   className="space-y-4"
                                 >
                                    <input 
                                      name="code" type="text" maxLength="6" required 
                                      className="w-full h-12 text-center text-xl tracking-[0.5em] font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-blue-500"
                                      placeholder="000000"
                                    />
                                    <button className="w-full h-12 bg-blue-600 text-white text-xs font-light rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest">
                                       Verificar y Activar
                                    </button>
                                    <button type="button" onClick={() => setTwoFactorSetup(null)} className="w-full text-[10px] text-zinc-400 uppercase tracking-widest hover:text-zinc-900 mt-2">
                                       Cancelar
                                    </button>
                                 </form>
                              </div>
                           </div>
                        </div>
                     )}
                  </section>
               </div>
            </div>
          ) : activeTab === 'docs' ? (
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
               <div className="space-y-4">
                  <h2 className="text-3xl font-light tracking-normal">Documentación Técnica API <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full ml-2">v1.2</span></h2>
                  <p className="text-zinc-500 font-light">Guía técnica para la integración corporativa con el ecosistema REINFO Pro.</p>
               </div>

               {/* Auth Section */}
               <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white dark:text-zinc-900" />
                     </div>
                     <div>
                        <h3 className="text-lg font-light">Autenticación y Seguridad</h3>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-light">Acceso Programático</p>
                     </div>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
                    Todas las peticiones a la API deben autenticarse mediante una Llave Secreta enviada en los encabezados HTTP.
                  </p>
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl font-mono text-[11px] border border-zinc-100 dark:border-zinc-800 text-zinc-400 flex justify-between items-center group">
                     <code>x-api-key: {user?.apiKey || 'sk_reinfo_xxxxxxxxxxxx'}</code>
                     <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">Llave Activa</span>
                  </div>
               </section>

               <div className="grid grid-cols-1 gap-12 mt-12">
                  {/* Category 1: REINFO */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-light text-zinc-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                       <Database className="w-3 h-3" /> Catálogo REINFO
                    </h3>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <span className="px-3 py-1 bg-blue-500 text-white text-[9px] font-medium rounded-lg uppercase tracking-widest">GET</span>
                               <code className="text-[13px] font-light text-zinc-500">/api/v1/registros</code>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-light italic">Consulta Principal</span>
                        </div>
                        <div className="p-6 space-y-4">
                           <p className="text-xs font-light text-zinc-500">Búsqueda avanzada de mineros por RUC, Nombre o Código Único.</p>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {[
                                { k: 'ruc', v: 'Filtro RUC' },
                                { k: 'name', v: 'Nombre Minero' },
                                { k: 'codigoUnico', v: 'Concesión' },
                                { k: 'status', v: 'vigente | suspendido' }
                              ].map(p => (
                                <div key={p.k} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                   <p className="text-[9px] text-blue-500 font-mono mb-1">{p.k}</p>
                                   <p className="text-[10px] text-zinc-400 font-light">{p.v}</p>
                                </div>
                              ))}
                           </div>

                           <div className="mt-6 space-y-3">
                              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-light">Estructura de Respuesta</p>
                              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 font-mono text-[11px] text-blue-400/80 leading-relaxed shadow-inner">
                                 <div className="flex justify-between items-center mb-2 text-[9px] text-zinc-600 uppercase">
                                    <span>JSON Response</span>
                                    <span>200 OK</span>
                                 </div>
                                 <p className="text-zinc-500">{'{'}</p>
                                 <p className="pl-4">"success": <span className="text-zinc-100">true</span>,</p>
                                 <p className="pl-4">"data": [{'{'}</p>
                                 <p className="pl-8 text-zinc-300">"ruc": "2010...",</p>
                                 <p className="pl-8 text-zinc-300">"minero": "...",</p>
                                 <p className="pl-8 text-zinc-300">"estado": "VIGENTE"</p>
                                 <p className="pl-4">{'}'}]</p>
                                 <p className="text-zinc-500">{'}'}</p>
                              </div>
                           </div>
                        </div>
                    </div>
                  </div>

                  {/* Category 2: User Account */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-light text-zinc-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                       <User className="w-3 h-3" /> Cuenta de Usuario
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { m: 'GET', url: '/v1/user/usage', t: 'Consumo y Quota', desc: 'Obtiene saldo actual y vencimiento.' },
                          { m: 'POST', url: '/v1/user/upgrade', t: 'Mejorar Plan', desc: 'Solicitud de upgrade corporativo.' },
                          { m: 'POST', url: '/v1/user/reset-key', t: 'Regenerar API Key', desc: 'Invalida la llave actual.' },
                          { m: 'POST', url: '/v1/auth/logout', t: 'Cerrar Sesión', desc: 'Invalida la sesión web (MFA).' }
                        ].map(api => (
                          <div key={api.url} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all group">
                             <div className="flex items-center justify-between mb-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-medium tracking-widest ${api.m === 'GET' ? 'bg-blue-50 text-blue-500' : 'bg-zinc-900 text-white'}`}>{api.m}</span>
                             </div>
                             <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1">{api.t}</h4>
                             <code className="text-[10px] text-zinc-400 block mb-3">{api.url}</code>
                             <p className="text-[11px] text-zinc-500 font-light">{api.desc}</p>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Code Snippet */}
                  <section className="space-y-4">
                     <h3 className="text-xs font-light text-zinc-400 uppercase tracking-[0.2em] px-2">Integración Estándar (cURL)</h3>
                     <div className="bg-zinc-900 text-zinc-400 p-8 rounded-[32px] font-mono text-[12px] leading-relaxed relative group overflow-hidden border border-zinc-800 shadow-2xl">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-30" />
                        <span className="text-zinc-600"># Búsqueda corporativa por RUC</span><br/>
                         curl -X GET <span className="text-blue-400">"{process.env.NEXT_PUBLIC_API_URL || 'https://api-reinfo.com'}/api/v1/registros?ruc=20100100101"</span> \<br/>
                         &nbsp;&nbsp;&nbsp;&nbsp; -H <span className="text-blue-400">"x-api-key: {user?.apiKey || 'TU_API_KEY_AQUI'}"</span>
                     </div>
                  </section>
               </div>
            </div>
          ) : activeTab === 'planes' ? (
            <div className="max-w-5xl mx-auto space-y-12">
               <div className="text-center space-y-4">
                  <h2 className="text-2xl font-light tracking-normal text-zinc-900 dark:text-zinc-100 italic">Suscripciones</h2>
                  <p className="text-zinc-400 max-w-lg mx-auto font-light text-[13px]">Potencia tus consultas con el nivel de acceso ideal.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {(plansConfig.length > 0 ? plansConfig : [
                    { name: 'Free', price: '0', limit: '5', features: ['5 Consultas Únicas', 'Acceso portal', 'Soporte email'] },
                    { name: 'Professional', price: '49', limit: '5,000', features: ['5k Consultas RUC', 'Exportación Excel/CSV', 'API Key dedicada', 'Soporte prioritario'] },
                    { name: 'Enterprise', price: '199', limit: '20,000', features: ['20k Consultas RUC', 'Conexión Directa DB', 'Analítica avanzada', 'SLA 99.9%', 'Manager dedicado'] },
                  ]).map((plan, i) => (
                    <div key={i} className={`bg-white dark:bg-zinc-900 border ${plan.name === 'Professional' ? 'border-zinc-200/60 dark:border-zinc-800 shadow-2xl shadow-zinc-200/40 dark:shadow-none' : 'border-zinc-100/80 dark:border-zinc-800/50 shadow-sm'} rounded-[40px] p-10 flex flex-col relative transition-all duration-500 hover:translate-y-[-4px] hover:shadow-xl ${usage?.user?.plan === plan.name.toUpperCase() ? 'ring-1 ring-blue-500/30 ring-offset-2 dark:ring-offset-zinc-950' : ''}`}>
                       {usage?.user?.plan === plan.name.toUpperCase() && (
                         <div className="absolute -top-3 left-10 bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-600/20 animate-in fade-in zoom-in">
                           Suscripción Activa
                         </div>
                       )}
                       {plan.name === 'Professional' && plan.name.toUpperCase() !== usage?.user?.plan && (
                         <div className="absolute top-6 right-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[8px] font-medium px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-zinc-900/10">
                           Recomendado
                         </div>
                       )}
                       
                       <h4 className="text-[10px] font-light text-zinc-400 uppercase tracking-[0.2em] mb-3">{plan.name}</h4>
                       
                       {editingPlan === plan.id && user?.role === 'superadmin' ? (
                         <div className="space-y-4 mb-8">
                           <div className="space-y-1">
                             <label className="text-[9px] text-zinc-400 uppercase">Precio ($)</label>
                             <input 
                               type="text" 
                               defaultValue={plan.price}
                               onBlur={(e) => handleUpdatePlanConfig(plan.id, { ...plan, price: e.target.value })}
                               className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-xl font-light focus:ring-1 focus:ring-blue-500"
                             />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[9px] text-zinc-400 uppercase">Límite Consultas</label>
                             <input 
                               type="text" 
                               defaultValue={plan.limit}
                               onBlur={(e) => handleUpdatePlanConfig(plan.id, { ...plan, limit: e.target.value })}
                               className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm font-light focus:ring-1 focus:ring-blue-500"
                             />
                           </div>
                           <button 
                             onClick={() => setEditingPlan(null)}
                             className="text-[10px] text-blue-600 font-light uppercase tracking-widest"
                           >
                             Cerrar Edición
                           </button>
                         </div>
                       ) : (
                         <div 
                           className={`flex items-baseline gap-1 mb-8 ${user?.role === 'superadmin' ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
                           onClick={() => user?.role === 'superadmin' && setEditingPlan(plan.id)}
                         >
                            <span className="text-4xl font-extralight tracking-tight text-zinc-900 dark:text-zinc-100">${Number(plan.price).toLocaleString()}</span>
                            <span className="text-[11px] text-zinc-400 font-light">/mes</span>
                            {user?.role === 'superadmin' && <Edit3 className="w-3 h-3 ml-2 text-zinc-300" />}
                         </div>
                       )}

                       <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 w-full mb-8" />
                       
                       <div className="mb-4">
                         <p className="text-[10px] text-zinc-400 font-light uppercase tracking-widest mb-1">Capacidad Mensual</p>
                         <p className="text-sm font-light text-zinc-900 dark:text-zinc-100">{Number(plan.limit || 0).toLocaleString()} Consultas</p>
                       </div>

                       <ul className="space-y-4 mb-10 flex-1">
                           {plan.features.map((f, j) => {
                             // Dynamic feature text for limit
                             let featureText = f;
                             if (j === 0) {
                               const limitNum = Number((plan.limit || '0').toString().replace(/,/g, ''));
                                if (limitNum >= 1000000) featureText = "Consultas Ilimitadas*"; // Logic kept for platform plan if ever unlimited
                                else if (limitNum === 20000) featureText = "20k Consultas Mensuales";
                                else if (limitNum === 5000) featureText = "5k Consultas Mensuales";
                                else featureText = `${limitNum.toLocaleString()} Consultas Mensuales`;
                             }
                             return (
                               <li key={j} className="flex items-center gap-3 text-[12px] text-zinc-600 dark:text-zinc-400 font-light">
                                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 opacity-80" />
                                  {featureText}
                               </li>
                             );
                           })}
                       </ul>

                        <button 
                          onClick={() => handlePlanSelect(plan.name)}
                          disabled={loading || usage?.user?.plan === plan.name.toUpperCase() || user?.role === 'superadmin' || usage?.user?.requested_plan === plan.name.toUpperCase()}
                          className={`w-full py-4 rounded-2xl text-[10px] font-medium transition-all uppercase tracking-[0.2em] shadow-lg ${
                            usage?.user?.plan === plan.name.toUpperCase() 
                              ? 'bg-zinc-50 text-zinc-300 cursor-not-allowed border border-zinc-100' 
                              : usage?.user?.requested_plan === plan.name.toUpperCase()
                                ? 'bg-amber-50 text-amber-600 border border-amber-200 animate-pulse'
                                : user?.role === 'superadmin'
                                  ? 'bg-zinc-100 text-zinc-400 cursor-default'
                                  : plan.name === 'Professional' 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-[0.98]' 
                                    : 'bg-white text-zinc-900 border border-zinc-200 hover:border-blue-500 hover:text-blue-600 hover:shadow-blue-500/10 hover:-translate-y-0.5 active:scale-[0.98]'
                          }`}
                        >
                           {user?.role === 'superadmin' ? 'Modo Administración' : usage?.user?.plan === plan.name.toUpperCase() ? 'Tu Plan Actual' : usage?.user?.requested_plan === plan.name.toUpperCase() ? 'Aprobación Pendiente' : loading ? 'Procesando...' : 'Obtener Acceso'}
                        </button>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <>
            {user?.active === false && user?.role !== 'superadmin' && (
              <div className="mb-8 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/50 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-orange-900 dark:text-orange-400">Cuenta SUSPENDIDA por Administración</h3>
                  <p className="text-[11px] text-orange-700 dark:text-orange-500 font-light">Su acceso ha sido bloqueado manualmente por un administrador. Si cree que esto es un error, por favor regularice su situación o contacte a soporte.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('planes')}
                  className="ml-auto px-4 py-2 bg-orange-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-orange-700 transition-all"
                >
                  Ver Planes
                </button>
              </div>
            )}

            {searchError && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900 dark:text-red-400 uppercase tracking-tight">Acceso Bloqueado</h3>
                  <p className="text-[12px] text-red-700 dark:text-red-500 font-light mt-0.5">{searchError}</p>
                </div>
                <button 
                  onClick={() => setActiveTab('planes')}
                  className="px-5 py-2.5 bg-red-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Mejorar Plan
                </button>
              </div>
            )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-light tracking-normal">
                {user?.role === 'superadmin' ? 'Monitor Global Sistema' : 'Mi Consumo REINFO'}
              </h1>
              <p className="text-xs text-zinc-400 font-light mt-0.5">
                {user?.role === 'superadmin' 
                  ? 'Visión consolidada de la red nacional REINFO.' 
                  : 'Monitoreo de créditos y consultas corporativas.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  fetchUsage();
                  if (user?.role === 'superadmin') {
                    fetchStats();
                    fetchAdminUsers();
                  } else {
                    fetchUsage();
                    fetchSubHistory();
                    fetchNotifications();
                  }
                  if (query || hasSearched) fetchData();
                }} 
                className="inline-flex items-center h-10 px-5 text-sm font-light bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading && 'animate-spin'}`} />
                Actualizar
              </button>
            </div>
          </div>

          {/* Quick Metrics - Independent Views */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {user?.role === 'superadmin' ? (
              // Case 1: Superadmin (Global Monitor)
              [
                { label: "Total Registros", value: stats.total, color: "text-zinc-900 dark:text-white", icon: Users },
                { label: "Vigentes Activos", value: stats.vigentes, color: "text-blue-600 dark:text-blue-400", icon: CheckCircle2 },
                { label: "En Suspensión", value: stats.suspendidos, color: "text-red-600 dark:text-red-400", icon: AlertCircle },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm transition-card hover:shadow-md flex items-center justify-between">
                  <div>
                     <p className="text-[10px] font-light text-zinc-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
                     <div className="flex items-baseline gap-1.5">
                        <p className={`text-2xl font-light tracking-normal ${stat.color}`}>{(stat.value || 0).toLocaleString()}</p>
                        <span className="text-[9px] font-light text-zinc-300 uppercase tracking-normaler">Nodos</span>
                     </div>
                   </div>
                  <div className={`w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5 opacity-80" />
                  </div>
                </div>
              ))
            ) : (
              // Case 2: Client (Personal Consumption Only)
              [
                { label: "Consultas Realizadas", value: usage?.user?.quota_used || usage?.quota_used || 0, color: "text-zinc-900 dark:text-white", icon: RefreshCw, unit: "Búsquedas" },
                { label: "Créditos Disponibles", value: Math.max(0, (usage?.user?.quota_limit || usage?.quota_limit || 0) - (usage?.user?.quota_used || usage?.quota_used || 0)), color: "text-blue-600 dark:text-blue-400", icon: Zap, unit: "Saldo" },
                { label: "Créditos del Plan", value: usage?.user?.quota_limit || usage?.quota_limit || user?.plan || "FREE", color: "text-zinc-500 dark:text-zinc-400", icon: ShieldCheck, unit: usage?.user?.plan || usage?.plan || "Nivel" },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm transition-card hover:shadow-md flex items-center justify-between">
                  <div>
                     <p className="text-[10px] font-light text-zinc-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
                     <div className="flex items-baseline gap-1.5">
                        <p className={`text-2xl font-light tracking-normal ${stat.color}`}>{(stat.value || 0).toLocaleString()}</p>
                        <span className="text-[9px] font-light text-zinc-300 uppercase tracking-normaler">{stat.unit}</span>
                     </div>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5 opacity-80" />
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Subscription History Table - For Clients in Overview */}
          {!hasSearched && user?.role !== 'superadmin' && subHistory.length > 0 && (
            <div className="mt-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="px-8 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/40">
                  <div className="flex items-center gap-3">
                     <CreditCard className="w-4 h-4 text-blue-500" />
                     <h2 className="text-xs font-light text-zinc-400 uppercase tracking-[0.2em]">Historial de Suscripciones</h2>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-light italic px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">Facturación Corporativa</span>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-zinc-50 dark:border-zinc-800/50">
                           <th className="px-8 py-5 text-[10px] font-light text-zinc-400 uppercase tracking-widest">Plan</th>
                           <th className="px-8 py-5 text-[10px] font-light text-zinc-400 uppercase tracking-widest">Periodo</th>
                           <th className="px-8 py-5 text-[10px] font-light text-zinc-400 uppercase tracking-widest text-right">Inversión</th>
                           <th className="px-8 py-5 text-[10px] font-light text-zinc-400 uppercase tracking-widest text-center">Medio de Pago</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/30">
                        {subHistory.map((sub, idx) => (
                           <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all duration-300">
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                       <Zap className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-sm font-light text-zinc-900 dark:text-zinc-100">{sub.plan_name}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-light text-zinc-600 dark:text-zinc-400">
                                       {new Date(sub.start_date).toLocaleDateString()} - {new Date(sub.end_date).toLocaleDateString()}
                                    </span>
                                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider">30 Días de Cobertura</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-right font-mono text-sm text-zinc-900 dark:text-zinc-100">
                                 ${sub.amount}
                              </td>
                              <td className="px-8 py-5 text-center">
                                 <span className="px-3 py-1 bg-green-50 dark:bg-green-900/10 text-green-600 text-[10px] font-light rounded-lg border border-green-100 dark:border-green-900/30">
                                    {sub.payment_method}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}


          {/* Master Table - Hidden for regular users until they search */}
          {(user?.role === 'superadmin' || hasSearched) && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-sm font-light tracking-normal text-zinc-600 dark:text-zinc-300 uppercase">Listado de Operadores</h2>
                </div>
                <div className="text-[11px] font-light text-zinc-400 uppercase tracking-widest italic opacity-50">Sincronizado hace 2m</div>
              </div>
              
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-6 py-4 text-[11px] font-light text-zinc-400 uppercase tracking-wider w-12 text-center">N°</th>
                      <th className="px-6 py-4 text-[11px] font-light text-zinc-400 uppercase tracking-wider">Titular de Operación</th>
                      <th className="px-6 py-4 text-[11px] font-light text-zinc-400 uppercase tracking-wider">Derecho Minero</th>
                      <th className="px-6 py-4 text-[11px] font-light text-zinc-400 uppercase tracking-wider">Localización</th>
                      <th className="px-6 py-4 text-[11px] font-light text-zinc-400 uppercase tracking-wider text-center">Situación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="py-32 text-center text-zinc-400">
                          <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 opacity-10" />
                          <span className="text-sm font-light uppercase tracking-widest opacity-40">Consultando Base de Datos...</span>
                        </td>
                      </tr>
                    ) : data.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center">
                          <div className="max-w-sm mx-auto space-y-4">
                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                              <Search className="w-8 h-8 text-zinc-300" />
                            </div>
                            <h3 className="text-lg font-light text-zinc-900 dark:text-zinc-100 italic">Listo para Consultar</h3>
                            <p className="text-sm text-zinc-400 font-light leading-relaxed">
                              Ingresa un RUC o Nombre en la barra superior para buscar un minero específico.
                            </p>
                            {user?.role === 'superadmin' && (
                              <div className="pt-4">
                                <button 
                                  onClick={handleBrowseAll}
                                  className="text-[10px] font-light text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 uppercase tracking-widest transition-all underline underline-offset-4"
                                  >
                                  O explorar todos los registros (1 crédito)
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : data.map((item) => (
                      <tr key={item.numero} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-6 py-4.5 text-[10px] font-mono text-zinc-300 text-center font-light italic">{item.numero}</td>
                        <td className="px-6 py-4.5">
                          <div className="font-light text-[13px] tracking-normal group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-default">{item.minero}</div>
                          <div className="text-[11px] font-light text-zinc-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                            RUC {item.ruc}
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="text-[12px] font-light text-zinc-700 dark:text-zinc-300 mb-0.5">{item.nombreDerecho || 'NO REPORTADO'}</div>
                          <div className="text-[11px] text-zinc-400 tracking-normaler uppercase">{item.codigoUnico}</div>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="text-[11px] font-light uppercase tracking-normal text-zinc-600 dark:text-zinc-400">{item.departamento} • {item.provincia}</div>
                          <div className="text-[11px] text-zinc-400 font-light mt-0.5">{item.distrito}</div>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className={`inline-flex items-center px-4 py-1 rounded-lg text-[9px] font-light uppercase tracking-widest border transition-all ${
                            item.estado === 'VIGENTE' 
                              ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20 shadow-sm shadow-blue-500/5' 
                              : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20 shadow-sm shadow-red-500/5'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${item.estado === 'VIGENTE' ? 'bg-blue-500' : 'bg-red-500'} animate-pulse`} />
                            {item.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="px-8 py-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/20 shrink-0">
                <p className="text-[11px] text-zinc-500 font-light uppercase tracking-wider">
                  Página <span className="text-zinc-900 dark:text-zinc-100">{page}</span> de <span className="text-zinc-400">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="h-9 px-4 text-[10px] font-light flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all uppercase tracking-widest"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  
                  <div className="flex gap-1">
                      {[...Array(Math.min(3, totalPages))].map((_, i) => {
                        const p = i + 1;
                        return (
                          <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 flex items-center justify-center text-[11px] font-light rounded-xl transition-all ${page === p ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                            {p}
                          </button>
                        )
                      })}
                  </div>

                  <button 
                    disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="h-9 px-5 text-[10px] font-light flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:opacity-95 disabled:opacity-30 transition-all uppercase tracking-widest shadow-lg shadow-zinc-900/10 dark:shadow-none"
                  >
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* Upgrade Payment Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[40px] border border-zinc-200 dark:border-zinc-800 p-10 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                 <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-2xl font-light">Solicitar Plan {pendingUpgradePlan}</h3>
                    <p className="text-sm text-zinc-500 font-light">Complete los detalles de su transferencia para activar el servicio.</p>
                 </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpgradeSubmit({
                  amount: e.target.amount.value,
                  type: e.target.type.value,
                  reference: e.target.reference.value
                });
              }} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1">Monto Transferido (USD)</label>
                    <input 
                      name="amount" type="text" required 
                      placeholder="Ej: 49.00"
                      className="w-full h-12 px-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-lg font-light focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1">Medio / Tipo</label>
                       <div className="relative">
                          <select 
                            name="type" required
                            className="appearance-none w-full h-12 pl-5 pr-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-light focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                          >
                             <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                             <option value="Depósito en Cuenta">Depósito en Cuenta</option>
                             <option value="PayPal / Otros">PayPal / Otros</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-light text-zinc-400 uppercase tracking-widest ml-1">N° Operación / Referencia</label>
                       <input 
                         name="reference" type="text" required 
                         placeholder="Ej: 123456789"
                         className="w-full h-12 px-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-light focus:outline-none focus:border-blue-500 transition-all"
                       />
                    </div>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowUpgradeModal(false)}
                      className="flex-1 h-14 rounded-2xl text-[11px] font-medium border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all uppercase tracking-widest"
                    >
                       Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-14 rounded-2xl text-[11px] font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all uppercase tracking-widest shadow-xl shadow-blue-600/20 disabled:opacity-50"
                    >
                       {loading ? 'Procesando...' : 'Confirmar Reporte'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  </main>
</div>
  );
}
