import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut, Shield } from "lucide-react";
import { isAuthenticated, setAuthenticated } from "../utils/auth";
import { LoginForm } from "../components/LoginForm";
import { AdminTabs } from "../components/admin/AdminTabs";
import { FilialsManager } from "../components/admin/FilialsManager";
import { DepartmentsManager } from "../components/admin/DepartmentsManager";
import { UsersManager } from "../components/admin/UsersManager";
import { JsonExporter } from "../components/admin/JsonExporter";

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("filials");

  useEffect(() => {
    setAuthorized(isAuthenticated());
    setChecking(false);
  }, []);

  const handleLogout = () => {
    setAuthenticated(false);
    setAuthorized(false);
  };

  const handleLoginSuccess = () => {
    setAuthorized(true);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authorized) {
    return <LoginForm onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>К справочнику</span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Авторизован</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-[13px]">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Админ-панель</h1>

        {/* Экспорт JSON */}
        <div className="mb-6">
          <JsonExporter />
        </div>

        {/* Вкладки */}
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Контент вкладок */}
        {activeTab === "filials" && <FilialsManager />}
        {activeTab === "departments" && <DepartmentsManager />}
        {activeTab === "users" && <UsersManager />}
      </main>
    </div>
  );
}
