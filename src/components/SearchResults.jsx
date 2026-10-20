import { UserCheck } from "lucide-react";
import { useData } from "../context/DataProvider";
import { buildSearchResults } from "../utils/search";
import { EmployeeCard } from "./EmployeeCard";

/**
 * Результаты поиска с группировкой по иерархии
 */
export const SearchResults = ({ query }) => {
  const { filials, departments, users } = useData();

  if (!query || query.trim().length < 2) {
    return null;
  }

  const results = buildSearchResults(users, departments, filials, query);
  const totalUsers = results.reduce(
    (sum, group) => sum + group.users.length,
    0,
  );

  if (totalUsers === 0) {
    return (
      <div className="text-center py-12">
        <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">
          По запросу не найдено результатов
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Попробуйте изменить поисковый запрос
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-900 font-medium">
          Найдено записей: <span className="text-2xl">{totalUsers}</span>
        </p>
      </div>

      {results.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          {/* Заголовок группы */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
            <h2 className="font-bold text-lg">{group.filial.name}</h2>
            {group.parentDepartment && (
              <p className="text-purple-100 text-sm mt-1">
                {group.parentDepartment.name}
              </p>
            )}
          </div>

          {/* Список сотрудников */}
          <div className="p-4 bg-white space-y-3">
            {group.users.map((user) => (
              <div key={user.id}>
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  {user.department.name}
                </div>
                <EmployeeCard user={user} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
