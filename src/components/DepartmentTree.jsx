import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { EmployeeCard } from "./EmployeeCard";

/**
 * Компонент отдела с раскрытием списка сотрудников
 * Теперь управляется извне (props isOpen, onToggle)
 */
export const DepartmentTree = ({ department, users, isOpen, onToggle }) => {
  const activeUsers = users.filter((u) => u.active);

  if (activeUsers.length === 0) return null;

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 p-2.5 rounded-lg transition-colors text-left ${
          isOpen
            ? "bg-blue-50 text-blue-800"
            : "bg-gray-50 hover:bg-gray-100 text-gray-700"
        }`}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
        <Users className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium flex-1 text-sm">{department.name}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isOpen ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-600"
          }`}
        >
          {activeUsers.length}
        </span>
      </button>

      {isOpen && (
        <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
          {activeUsers
            .sort((a, b) => a.sort - b.sort)
            .map((user) => (
              <EmployeeCard key={user.id} user={user} />
            ))}
        </div>
      )}
    </div>
  );
};
