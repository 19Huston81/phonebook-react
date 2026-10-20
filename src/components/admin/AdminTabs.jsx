import { Building, Users, UserCog } from "lucide-react";

/**
 * Вкладки админ-панели
 */
export const AdminTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "filials", label: "Филиалы", icon: Building },
    { id: "departments", label: "Отделы", icon: Users },
    { id: "users", label: "Сотрудники", icon: UserCog },
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
