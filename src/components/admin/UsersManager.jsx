import { useState, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  Building,
  Users as UsersIcon,
  ToggleLeft,
  ToggleRight,
  FolderTree,
  User,
} from "lucide-react";
import { useData } from "../../context/DataProvider";
import { Modal } from "./Modal";
import { UserEditor } from "./UserEditor";

/**
 * Управление сотрудниками с двухуровневым аккордеоном:
 * Филиал → Отдел → Подотдел → Сотрудники
 */
export const UsersManager = () => {
  const { users, filials, departments, addUser, updateUser, deleteUser } =
    useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFilial, setFilterFilial] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [manualExpandedFilials, setManualExpandedFilials] = useState(new Set());
  const [manualExpandedDepts, setManualExpandedDepts] = useState(new Set());

  const isSearching = searchQuery.trim().length > 0;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Вспомогательные функции
  const getDepartmentName = (deptId) => {
    return (
      departments.find((d) => d.id === deptId)?.name || "(отдел не указан)"
    );
  };

  const getDepartmentFilialId = (deptId) => {
    return departments.find((d) => d.id === deptId)?.filial_id;
  };

  // Проверка соответствия пользователя поиску
  const matchesSearch = (user) => {
    if (!isSearching) return true;
    const searchFields = [
      user.fio,
      user.position,
      user.email,
      user.phone_local,
      user.phone_city,
      user.phone_mobile,
      user.phone_home,
    ].map((f) => (f || "").toLowerCase());

    return searchFields.some((field) => field.includes(normalizedQuery));
  };

  // Проверка соответствия фильтрам
  const matchesFilters = (user) => {
    if (filterActive === "active" && !user.active) return false;
    if (filterActive === "inactive" && user.active) return false;

    if (filterFilial) {
      const userFilialId = getDepartmentFilialId(user.department_id);
      if (userFilialId !== Number(filterFilial)) return false;
    }

    return true;
  };

  // Группируем пользователей по иерархии: Филиал → Родительский отдел → Подотдел
  const hierarchicalData = useMemo(() => {
    const result = {};

    // Шаг 1: Создаём структуру для всех филиалов
    filials.forEach((f) => {
      result[f.id] = {
        filial: f,
        parentDepts: {},
      };
    });

    // Шаг 2: Добавляем ВСЕ родительские отделы (даже пустые)
    departments.forEach((dept) => {
      const filialId = dept.filial_id;
      if (!result[filialId]) return;

      if (dept.parent_id === 0) {
        result[filialId].parentDepts[dept.id] = {
          parentDept: dept,
          directUsers: [],
          childDepts: {},
        };
      }
    });

    // Шаг 3: Добавляем ВСЕ подотделы к их родителям (даже пустые)
    departments.forEach((dept) => {
      const filialId = dept.filial_id;
      if (!result[filialId]) return;

      if (dept.parent_id !== 0) {
        const parentGroup = result[filialId].parentDepts[dept.parent_id];
        if (parentGroup) {
          parentGroup.childDepts[dept.id] = {
            dept,
            users: [],
          };
        }
      }
    });

    // Шаг 4: Распределяем сотрудников по отделам
    users.forEach((user) => {
      const dept = departments.find((d) => d.id === user.department_id);
      if (!dept) return;

      const filialId = dept.filial_id;
      if (!result[filialId]) return;

      if (dept.parent_id === 0) {
        const parentGroup = result[filialId].parentDepts[dept.id];
        if (parentGroup) {
          parentGroup.directUsers.push(user);
        }
      } else {
        const parentGroup = result[filialId].parentDepts[dept.parent_id];
        if (parentGroup && parentGroup.childDepts[dept.id]) {
          parentGroup.childDepts[dept.id].users.push(user);
        }
      }
    });

    // Шаг 5: Сортировка пользователей внутри отделов
    Object.values(result).forEach((filialData) => {
      Object.values(filialData.parentDepts).forEach((parentGroup) => {
        parentGroup.directUsers.sort((a, b) => a.sort - b.sort);
        Object.values(parentGroup.childDepts).forEach((childGroup) => {
          childGroup.users.sort((a, b) => a.sort - b.sort);
        });
      });
    });

    return result;
  }, [users, filials, departments]);

  // Определяем раскрытые элементы (автоматически при поиске)
  const { expandedFilials, expandedDepts } = useMemo(() => {
    const filialsSet = new Set(manualExpandedFilials);
    const deptsSet = new Set(manualExpandedDepts);

    if (isSearching || filterFilial || filterActive !== "all") {
      Object.values(hierarchicalData).forEach((filialData) => {
        Object.values(filialData.parentDepts).forEach((parentGroup) => {
          // Проверяем, есть ли совпадения в этой группе
          const hasMatchInDirect = parentGroup.directUsers.some(
            (u) => matchesSearch(u) && matchesFilters(u),
          );
          const hasMatchInChildren = Object.values(parentGroup.childDepts).some(
            (childGroup) =>
              childGroup.users.some(
                (u) => matchesSearch(u) && matchesFilters(u),
              ),
          );

          if (hasMatchInDirect || hasMatchInChildren) {
            filialsSet.add(filialData.filial.id);
            deptsSet.add(parentGroup.parentDept.id);
          }
        });
      });
    }

    return { expandedFilials: filialsSet, expandedDepts: deptsSet };
  }, [
    isSearching,
    normalizedQuery,
    filterFilial,
    filterActive,
    hierarchicalData,
    manualExpandedFilials,
    manualExpandedDepts,
  ]);

  // Подсчёт статистики
  const stats = useMemo(() => {
    const filtered = users.filter(matchesFilters);
    const matched = isSearching ? filtered.filter(matchesSearch) : filtered;

    return {
      total: users.length,
      filtered: filtered.length,
      matched: matched.length,
      active: users.filter((u) => u.active).length,
      inactive: users.filter((u) => !u.active).length,
    };
  }, [users, isSearching, normalizedQuery, filterFilial, filterActive]);

  // Переключение раскрытия
  const toggleFilial = (filialId) => {
    setManualExpandedFilials((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(filialId)) newSet.delete(filialId);
      else newSet.add(filialId);
      return newSet;
    });
  };

  const toggleDept = (deptId) => {
    setManualExpandedDepts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) newSet.delete(deptId);
      else newSet.add(deptId);
      return newSet;
    });
  };

  const expandAll = () => {
    setManualExpandedFilials(new Set(filials.map((f) => f.id)));
    setManualExpandedDepts(
      new Set(departments.filter((d) => d.parent_id === 0).map((d) => d.id)),
    );
  };

  const collapseAll = () => {
    setManualExpandedFilials(new Set());
    setManualExpandedDepts(new Set());
  };

  // CRUD handlers
  const handleAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    const displayName = user.fio || user.position || "(без имени)";
    if (window.confirm(`Удалить сотрудника "${displayName}"?`)) {
      deleteUser(user.id);
    }
  };

  const handleToggleActive = (user) => {
    updateUser(user.id, { active: !user.active });
  };

  const handleSave = (userData) => {
    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      addUser(userData);
    }
    setIsModalOpen(false);
  };

  // Подсветка совпадений
  const highlightMatch = (text) => {
    if (!isSearching || !text) return text;

    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(normalizedQuery);

    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + normalizedQuery.length);
    const after = text.slice(index + normalizedQuery.length);

    return (
      <>
        {before}
        <mark className="bg-yellow-200 text-gray-900 px-0.5 rounded">
          {match}
        </mark>
        {after}
      </>
    );
  };

  // Подсчёт совпадений в группе (для заголовков)
  const countMatchesInGroup = (parentGroup) => {
    let count = 0;
    parentGroup.directUsers.forEach((u) => {
      if (matchesSearch(u) && matchesFilters(u)) count++;
    });
    Object.values(parentGroup.childDepts).forEach((childGroup) => {
      childGroup.users.forEach((u) => {
        if (matchesSearch(u) && matchesFilters(u)) count++;
      });
    });
    return count;
  };

  const countMatchesInFilial = (filialId) => {
    const filialData = hierarchicalData[filialId];
    if (!filialData) return 0;
    let count = 0;
    Object.values(filialData.parentDepts).forEach((parentGroup) => {
      count += countMatchesInGroup(parentGroup);
    });
    return count;
  };

  const countTotalInFilial = (filialId) => {
    const filialData = hierarchicalData[filialId];
    if (!filialData) return 0;
    let count = 0;
    Object.values(filialData.parentDepts).forEach((parentGroup) => {
      count += parentGroup.directUsers.length;
      Object.values(parentGroup.childDepts).forEach((childGroup) => {
        count += childGroup.users.length;
      });
    });
    return count;
  };

  // Компонент строки сотрудника
  const UserRow = ({ user, index }) => (
    <tr
      className={`hover:bg-gray-50 border-b border-gray-100 ${
        !user.active ? "bg-gray-50/50 opacity-60" : ""
      }`}
    >
      <td className="px-3 py-2 text-xs text-gray-400 w-8">{index + 1}</td>
      <td className="px-3 py-2">
        {user.fio ? (
          <>
            <div className="text-sm font-medium text-gray-900">
              {highlightMatch(user.fio)}
            </div>
            {user.position && (
              <div className="text-xs text-gray-500">
                {highlightMatch(user.position)}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {user.position ? (
              <span className="text-sm font-medium text-gray-800">
                {highlightMatch(user.position)}
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic">
                Должность не указана
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="text-xs text-gray-600 space-y-0.5">
          {user.phone_local && (
            <div className="font-medium text-gray-800">
              <span className="text-gray-400 text-[10px] mr-1">м.</span>
              {highlightMatch(user.phone_local)}
            </div>
          )}
          {user.phone_mobile && (
            <div>
              <span className="text-gray-400 text-[10px] mr-1">моб.</span>
              {highlightMatch(user.phone_mobile)}
            </div>
          )}
          {user.email && (
            <div className="text-blue-600">
              <span className="text-blue-400 text-[10px] mr-1">✉</span>
              {highlightMatch(user.email)}
            </div>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={() => handleToggleActive(user)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
            user.active
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
          title={user.active ? "Деактивировать" : "Активировать"}
        >
          {user.active ? (
            <ToggleRight className="w-3.5 h-3.5" />
          ) : (
            <ToggleLeft className="w-3.5 h-3.5" />
          )}
          <span>{user.active ? "Акт." : "Неакт."}</span>
        </button>
      </td>
      <td className="px-3 py-2 text-right w-24">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleEdit(user)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Редактировать"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(user)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  const sortedFilials = [...filials].sort((a, b) => a.sort - b.sort);

  return (
    <div>
      {/* Заголовок и кнопка добавления */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Сотрудники ({stats.total})
        </h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить сотрудника
        </button>
      </div>

      {/* Панель фильтров */}
      <div className="flex gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по ФИО, должности, email, телефонам..."
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={filterFilial}
          onChange={(e) => setFilterFilial(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Все филиалы</option>
          {sortedFilials.map((filial) => (
            <option key={filial.id} value={filial.id}>
              {filial.name}
            </option>
          ))}
        </select>

        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">Все ({stats.total})</option>
          <option value="active">Активные ({stats.active})</option>
          <option value="inactive">Неактивные ({stats.inactive})</option>
        </select>
      </div>

      {/* Кнопки раскрытия */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={expandAll}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
        >
          <ChevronDown className="w-3 h-3" />
          Раскрыть все
        </button>
        <button
          onClick={collapseAll}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
          Свернуть все
        </button>
      </div>

      {/* Информация о поиске */}
      {(isSearching || filterFilial || filterActive !== "all") && (
        <div className="mb-3 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
          <span className="text-xs text-yellow-800">
            🔍 Показано: <strong>{stats.matched}</strong> из {stats.total}{" "}
            сотрудников
            {stats.matched === 0 && " — попробуйте изменить фильтры"}
          </span>
        </div>
      )}

      {/* Двухуровневый аккордеон */}
      <div className="space-y-3">
        {sortedFilials.map((filial) => {
          const filialData = hierarchicalData[filial.id];
          if (!filialData) return null;

          const isFilialExpanded = expandedFilials.has(filial.id);
          const totalInFilial = countTotalInFilial(filial.id);
          const matchedInFilial = countMatchesInFilial(filial.id);

          if (totalInFilial === 0) return null;
          if (
            (isSearching || filterFilial || filterActive !== "all") &&
            matchedInFilial === 0
          ) {
            return null;
          }

          // Сортируем родительские отделы по sort
          const sortedParentDepts = Object.values(filialData.parentDepts).sort(
            (a, b) => a.parentDept.sort - b.parentDept.sort,
          );

          return (
            <div
              key={filial.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              {/* Заголовок филиала */}
              <button
                onClick={() => toggleFilial(filial.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 transition-colors text-left ${
                  isFilialExpanded
                    ? "bg-blue-600 text-white"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-900"
                }`}
              >
                {isFilialExpanded ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                )}
                <Building className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold text-sm flex-1">
                  {filial.name}
                </span>
                <span className="text-xs opacity-80">
                  {isSearching || filterFilial || filterActive !== "all"
                    ? `${matchedInFilial} из ${totalInFilial}`
                    : `${totalInFilial} чел.`}
                </span>
              </button>

              {/* Содержимое филиала */}
              {isFilialExpanded && (
                <div className="p-3 bg-white space-y-2">
                  {sortedParentDepts.map((parentGroup) => {
                    const parentDept = parentGroup.parentDept;
                    const isDeptExpanded = expandedDepts.has(parentDept.id);

                    // Подотделы с сотрудниками
                    const sortedChildDepts = Object.values(
                      parentGroup.childDepts,
                    ).sort((a, b) => a.dept.sort - b.dept.sort);

                    // Все пользователи в группе (для подсчёта)
                    const allUsersInGroup = [
                      ...parentGroup.directUsers,
                      ...sortedChildDepts.flatMap((c) => c.users),
                    ];

                    const matchedInGroup = allUsersInGroup.filter(
                      (u) => matchesSearch(u) && matchesFilters(u),
                    ).length;

                    // При поиске/фильтрах скрываем пустые группы
                    if (
                      (isSearching || filterFilial || filterActive !== "all") &&
                      matchedInGroup === 0
                    ) {
                      return null;
                    }

                    return (
                      <div
                        key={parentDept.id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        {/* Заголовок отдела */}
                        <button
                          onClick={() => toggleDept(parentDept.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 transition-colors text-left ${
                            isDeptExpanded
                              ? "bg-blue-50 text-blue-900"
                              : "bg-gray-50 hover:bg-gray-100 text-gray-900"
                          }`}
                        >
                          {isDeptExpanded ? (
                            <ChevronDown className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 flex-shrink-0" />
                          )}
                          <UsersIcon className="w-4 h-4 flex-shrink-0 text-blue-600" />
                          <span className="font-semibold text-sm flex-1">
                            {highlightMatch(
                              parentDept.name || "(без названия)",
                            )}
                          </span>
                          {sortedChildDepts.length > 0 && (
                            <span className="text-xs text-gray-400 min-w-[80px]">
                              ({sortedChildDepts.length} подотдел.)
                            </span>
                          )}
                          <span className="text-xs opacity-70">
                            {isSearching ||
                            filterFilial ||
                            filterActive !== "all"
                              ? `${matchedInGroup} из ${allUsersInGroup.length}`
                              : `${allUsersInGroup.length} чел.`}
                          </span>
                        </button>

                        {/* Содержимое отдела */}
                        {isDeptExpanded && (
                          <div className="bg-white">
                            {/* Сотрудники родительского отдела */}
                            {parentGroup.directUsers.length > 0 && (
                              <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-8">
                                      #
                                    </th>
                                    <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                                      ФИО / Должность
                                    </th>
                                    <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-68">
                                      Контакты
                                    </th>
                                    <th className="px-3 py-1.5 text-center text-xs font-medium text-gray-500 uppercase w-16">
                                      Статус
                                    </th>
                                    <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-500 uppercase w-24">
                                      Действия
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {parentGroup.directUsers
                                    .filter(
                                      (u) =>
                                        matchesSearch(u) && matchesFilters(u),
                                    )
                                    .map((user, idx) => (
                                      <UserRow
                                        key={user.id}
                                        user={user}
                                        index={idx}
                                      />
                                    ))}
                                </tbody>
                              </table>
                            )}

                            {/* Подотделы */}
                            {sortedChildDepts.map((childGroup) => {
                              const matchedInChildren = childGroup.users.filter(
                                (u) => matchesSearch(u) && matchesFilters(u),
                              ).length;

                              if (
                                (isSearching ||
                                  filterFilial ||
                                  filterActive !== "all") &&
                                matchedInChildren === 0
                              ) {
                                return null;
                              }

                              return (
                                <div
                                  key={childGroup.dept.id}
                                  className="border-t border-blue-200"
                                >
                                  {/* Заголовок подотдела */}
                                  <div className="px-3 py-1.5 bg-blue-50/50 border-b border-blue-100">
                                    <div className="flex items-center gap-2">
                                      <FolderTree className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                      <h4 className="font-medium text-blue-600 text-sm">
                                        {highlightMatch(
                                          childGroup.dept.name ||
                                            "(без названия)",
                                        )}
                                      </h4>
                                      <span className="text-xs text-gray-500 ml-auto">
                                        {isSearching ||
                                        filterFilial ||
                                        filterActive !== "all"
                                          ? `${matchedInChildren} из ${childGroup.users.length}`
                                          : `${childGroup.users.length} чел.`}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Сотрудники подотдела */}
                                  <table className="w-full">
                                    <tbody>
                                      {childGroup.users
                                        .filter(
                                          (u) =>
                                            matchesSearch(u) &&
                                            matchesFilters(u),
                                        )
                                        .map((user, idx) => (
                                          <UserRow
                                            key={user.id}
                                            user={user}
                                            index={idx}
                                          />
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sortedFilials.filter((f) => {
        const filialData = hierarchicalData[f.id];
        if (!filialData) return false;
        const total = countTotalInFilial(f.id);
        if (total === 0) return false;
        if (isSearching || filterFilial || filterActive !== "all") {
          return countMatchesInFilial(f.id) > 0;
        }
        return true;
      }).length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
          {isSearching || filterFilial || filterActive !== "all"
            ? "Сотрудники не найдены. Попробуйте изменить фильтры."
            : "Сотрудники не найдены. Добавьте первого сотрудника."}
        </div>
      )}

      {/* Модальное окно */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Редактировать сотрудника" : "Добавить сотрудника"}
      >
        <UserEditor
          user={editingUser}
          filials={filials}
          departments={departments}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
