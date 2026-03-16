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
  Zap,
  Users,
  AlertCircle,
  Settings,
  ShieldCheck,
  Edit3,
  CreditCard,
  ShieldAlert
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
      if (user?.role === 'superadmin') {
        fetchAdminUsers();
        fetchData(); // Admins load data automatically
        fetchPlanes();
      } else {
        fetchPlanes();
        if (query || hasSearched) {
          // Regular users only load if searching/requested
          fetchData();
        } else {
          setData([]); 
        }
      }
    }
  }, [isLoggedIn, page, activeTab, hasSearched]);

  const fetchAdminUsers = async () => {
    try {
      const res = await axios.get("/api/v1/admin/users");
      if (res.data.success) setAdminUsers(res.data.users);
    } catch (err) { console.error(err); }
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
    
    setLoading(true);
    try {
      const res = await axios.post("/api/v1/user/upgrade", { plan: planKey });
      if (res.data.success) {
        await fetchUsage();
        await checkSession();
        setActiveTab("dashboard");
      }
    } catch (err) {
      console.error(err);
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
      if (res.data.success) fetchAdminUsers();
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    await axios.post("/api/v1/auth/logout");
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setHasSearched(true);
    fetchData();
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
                      <option value="PROFESSIONAL">PRO - 10,000 Consultas</option>
                      <option value="ENTERPRISE">ENTERPRISE - 1,000,000 Consultas</option>
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

  return (
    <div className="flex h-screen bg-[#fcfdfe] dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 overflow-hidden font-sans selection:bg-zinc-900 selection:text-white">
      {/* Sidebar Interface */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 hidden lg:flex flex-col shrink-0 bg-white dark:bg-zinc-950">
        <div className="h-20 flex items-center px-8 shrink-0">
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
        <header className="h-20 flex items-center justify-between px-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
          <div className="flex-1 max-w-xl">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" />
              <input 
                type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar por RUC o Titular..."
                className="w-full h-11 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-11 py-1 text-sm rounded-2xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-3 ml-6">
            <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
            
            <div className="relative user-menu-container">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-3 h-11 px-4 border transition-all outline-none rounded-2xl ${showUserMenu ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm' : 'border-transparent hover:bg-white dark:hover:bg-zinc-900'}`}
              >
                <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-[10px] font-light text-white dark:text-zinc-900 uppercase">
                  {user?.email[0]}
                </div>
                <div className="text-left hidden xl:block">
                   <p className="text-xs font-light leading-none">{user?.email.split('@')[0]}</p>
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
                        {user?.email?.[0].toUpperCase() || 'U'}
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
                    Cerrar Sesión Corporativa
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8 custom-scrollbar">
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
                <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] font-light text-zinc-400 uppercase tracking-widest mr-2">Total Clientes:</span>
                  <span className="text-sm font-light">{adminUsers.length}</span>
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
                    {adminUsers.map(u => (
                      <tr key={u.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-light text-zinc-900 dark:text-zinc-100">{u.email || u.username}</p>
                          <p className="text-[10px] text-zinc-400 font-mono italic">Acceso Verificado</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${u.plan === 'ENTERPRISE' ? 'bg-zinc-800 text-zinc-100' : u.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
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
                             <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black w-fit ${u.payment_status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                {u.payment_status === 'active' ? 'PAGO VERIFICADO' : 'PAGO PENDIENTE'}
                             </span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center gap-1.5 text-[10px] font-light ${u.active ? 'text-blue-600' : 'text-zinc-400'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`} />
                              {u.active ? 'OPERATIVO' : 'SUSPENDIDO'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-3">
                              <div className="flex flex-col gap-1 items-end">
                                <label className="text-[9px] font-light text-zinc-400">PLAN</label>
                                <select 
                                  value={u.plan}
                                  onChange={(e) => handleUpdateUser(u.id, { 
                                    plan: e.target.value, 
                                    quota_limit: e.target.value === 'ENTERPRISE' ? 1000000 : e.target.value === 'PROFESSIONAL' ? 10000 : 5, 
                                    active: u.active, 
                                    role: u.role,
                                    payment_status: u.payment_status 
                                  })}
                                  className="text-[11px] font-light bg-zinc-50 dark:bg-zinc-800 border-none rounded-lg h-8 px-2 focus:ring-0"
                                >
                                  <option value="FREE">FREE</option>
                                  <option value="PROFESSIONAL">PRO</option>
                                  <option value="ENTERPRISE">ENT</option>
                                </select>
                              </div>

                              <button 
                                onClick={() => handleUpdateUser(u.id, { 
                                  ...u, 
                                  active: !u.active,
                                  subscription_end: u.subscription_end,
                                  quota_limit: u.quota_limit,
                                  payment_status: u.payment_status
                                })}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-light transition-all border ${u.active ? 'hover:bg-red-50 hover:text-red-600 border-transparent' : 'bg-blue-50 text-blue-600 border-blue-100'}`}
                              >
                                {u.active ? 'SUSPENDER' : 'ACTIVAR'}
                              </button>

                              <button 
                                onClick={() => handleUpdateUser(u.id, { 
                                  ...u, 
                                  payment_status: u.payment_status === 'active' ? 'pending' : 'active',
                                  subscription_end: u.subscription_end,
                                  quota_limit: u.quota_limit
                                })}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-light transition-all border ${u.payment_status === 'active' ? 'bg-zinc-50 text-zinc-400 border-transparent italic' : 'bg-zinc-800 text-zinc-100 shadow-lg shadow-zinc-900/10'}`}
                              >
                                {u.payment_status === 'active' ? 'ANULAR PAGO' : 'APROBAR PAGO'}
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  <h2 className="text-3xl font-light tracking-normal">Documentación Técnica API</h2>
                  <p className="text-zinc-500 font-light">Guía integral para desarrolladores e integradores del ecosistema REINFO Pro.</p>
               </div>

               <div className="grid grid-cols-1 gap-8">
                  {/* Auth Section */}
                  <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                           <Zap className="w-5 h-5 text-white dark:text-zinc-900" />
                        </div>
                        <h3 className="text-xl font-light">Autenticación</h3>
                     </div>
                     <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Nuestra API utiliza llaves secretas para autenticar las peticiones. Puedes encontrar tu API Key en tu perfil. Todas las peticiones deben incluirla en los headers.
                     </p>
                     <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl font-mono text-[11px] border border-zinc-100 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
                        x-api-key: sk_reinfo_xxxxxxxxxxxx
                     </div>
                  </section>

                  {/* Endpoints & Status Section */}
                  <section className="space-y-6">
                     <h3 className="text-lg font-light px-2">Endpoint: Consulta REINFO</h3>
                     <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30">
                           <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">GET</span>
                              <code className="text-sm font-light opacity-80">/api/v1/registros?ruc=12345678901</code>
                           </div>
                        </div>
                        <div className="p-0">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                                    <th className="px-6 py-4 text-[10px] font-light text-zinc-400 uppercase tracking-widest">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-light text-zinc-400 uppercase tracking-widest">Significado</th>
                                    <th className="px-6 py-4 text-[10px] font-light text-zinc-400 uppercase tracking-widest">Respuesta Típica</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-light">
                                 <tr>
                                    <td className="px-6 py-4 text-sm font-light text-blue-600">200 OK</td>
                                    <td className="px-6 py-4 text-xs text-zinc-500">Consulta exitosa. Devuelve los datos del minero.</td>
                                    <td className="px-6 py-4"><code className="text-[10px] bg-zinc-50 dark:bg-zinc-950 p-1 rounded font-light">{"{ success: true, data: [...] }"}</code></td>
                                 </tr>
                                 <tr>
                                    <td className="px-6 py-4 text-sm font-light text-orange-600">401 Unauthorized</td>
                                    <td className="px-6 py-4 text-xs text-zinc-500">API Key faltante, inválida o expirada.</td>
                                    <td className="px-6 py-4"><code className="text-[10px] bg-zinc-50 dark:bg-zinc-950 p-1 rounded font-light">{"{ success: false, message: 'No autorizado' }"}</code></td>
                                 </tr>
                                 <tr>
                                    <td className="px-6 py-4 text-sm font-light text-red-600">403 Forbidden</td>
                                    <td className="px-6 py-4 text-xs text-zinc-500">Suscripción vencida o cuota de consultas agotada.</td>
                                    <td className="px-6 py-4"><code className="text-[10px] bg-zinc-50 dark:bg-zinc-950 p-1 rounded font-light">{"{ success: false, message: 'Cuota excedida' }"}</code></td>
                                 </tr>
                                 <tr>
                                    <td className="px-6 py-4 text-sm font-light text-zinc-400">500 Server Error</td>
                                    <td className="px-6 py-4 text-xs text-zinc-500">Error interno en el servidor o caída de la base de datos.</td>
                                    <td className="px-6 py-4"><code className="text-[10px] bg-zinc-50 dark:bg-zinc-950 p-1 rounded font-light">{"{ success: false, message: 'Error interno' }"}</code></td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </section>

                  {/* Code Example */}
                  <section className="space-y-4">
                     <h3 className="text-lg font-light px-2">Ejemplo de Integración (cURL)</h3>
                     <div className="bg-zinc-900 text-zinc-400 p-6 rounded-3xl font-mono text-[12px] leading-relaxed relative group overflow-hidden border border-zinc-800">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-50" />
                        <span className="text-zinc-500"># Consultar por RUC</span><br/>
                         curl -X GET <span className="text-blue-400">"{process.env.NEXT_PUBLIC_API_URL}/registros?ruc=20100100101"</span> \<br/>
                         &nbsp;&nbsp;&nbsp;&nbsp; -H <span className="text-blue-400">"x-api-key: TU_API_KEY_AQUI"</span>
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
                    { name: 'Professional', price: '49', limit: '10,000', features: ['10k Consultas RUC', 'Exportación Excel/CSV', 'API Key dedicada', 'Soporte prioritario'] },
                    { name: 'Enterprise', price: '199', limit: '1,000,000', features: ['Consultas Ilimitadas*', 'Conexión Directa DB', 'Analítica avanzada', 'SLA 99.9%', 'Manager dedicado'] },
                  ]).map((plan, i) => (
                    <div key={i} className={`bg-white dark:bg-zinc-900 border ${plan.name === 'Professional' ? 'border-zinc-200 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-none' : 'border-zinc-100 dark:border-zinc-800 shadow-sm'} rounded-[32px] p-10 flex flex-col relative transition-all duration-500 hover:scale-[1.02] ${usage?.user?.plan === plan.name.toUpperCase() ? 'ring-2 ring-blue-600 dark:ring-blue-400 ring-offset-4 dark:ring-offset-zinc-950' : ''}`}>
                       {usage?.user?.plan === plan.name.toUpperCase() && (
                         <div className="absolute -top-3 left-10 bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-600/20 animate-in fade-in zoom-in">
                           Suscripción Activa
                         </div>
                       )}
                       {plan.name === 'Professional' && plan.name.toUpperCase() !== usage?.user?.plan && (
                         <div className="absolute top-6 right-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-zinc-900/10">
                           Recomendado
                         </div>
                       )}
                       
                       <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-3">{plan.name}</h4>
                       
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
                             className="text-[10px] text-blue-600 font-bold uppercase tracking-widest"
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
                          {plan.features.map((f, j) => (
                            <li key={j} className="flex items-center gap-3 text-[12px] text-zinc-600 dark:text-zinc-400 font-light">
                               <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 opacity-80" />
                               {f}
                            </li>
                          ))}
                       </ul>

                        <button 
                          onClick={() => handlePlanSelect(plan.name)}
                          disabled={loading || usage?.user?.plan === plan.name.toUpperCase() || user?.role === 'superadmin'}
                          className={`w-full py-4 rounded-2xl text-[10px] font-bold transition-all uppercase tracking-[0.2em] shadow-md ${
                            usage?.user?.plan === plan.name.toUpperCase() 
                              ? 'bg-zinc-50 text-zinc-300 cursor-not-allowed border border-zinc-100' 
                              : user?.role === 'superadmin'
                                ? 'bg-zinc-100 text-zinc-400 cursor-default'
                                : plan.name === 'Professional' 
                                  ? 'bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 hover:shadow-xl hover:shadow-zinc-900/20 dark:hover:shadow-white/5 active:scale-95' 
                                  : 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 active:scale-95'
                          }`}
                        >
                           {user?.role === 'superadmin' ? 'Modo Administración' : usage?.user?.plan === plan.name.toUpperCase() ? 'Tu Plan Actual' : loading ? 'Procesando...' : 'Obtener Acceso'}
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
              <h1 className="text-2xl font-light tracking-normal">
                {user?.role === 'superadmin' ? 'Panel de Control de Sistema' : 'Mi Consumo REINFO'}
              </h1>
              <p className="text-sm text-zinc-400 font-light mt-1">
                {user?.role === 'superadmin' 
                  ? 'Gestión integral de la base de datos nacional REINFO.' 
                  : 'Monitoreo de créditos y consultas corporativas.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  fetchUsage();
                  if (user?.role === 'superadmin') fetchStats();
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
                <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm transition-card hover:shadow-md flex items-center justify-between">
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
                { label: "Consultas Realizadas", value: usage?.quota_used || 0, color: "text-zinc-900 dark:text-white", icon: RefreshCw, unit: "Búsquedas" },
                { label: "Créditos Disponibles", value: Math.max(0, (usage?.quota_limit || 0) - (usage?.quota_used || 0)), color: "text-blue-600 dark:text-blue-400", icon: Zap, unit: "Saldo" },
                { label: "Créditos del Plan", value: usage?.quota_limit || usage?.plan || "FREE", color: "text-zinc-500 dark:text-zinc-400", icon: ShieldCheck, unit: usage?.plan || "Nivel" },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm transition-card hover:shadow-md flex items-center justify-between">
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

          {/* Master Table - Hidden for regular users until they search */}
          {(user?.role === 'superadmin' || hasSearched) && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40">
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
                        <td colSpan="5" className="py-32 text-center">
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
    </div>
  </main>
</div>
  );
}
