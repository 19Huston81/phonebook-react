import { useState, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Building,
} from "lucide-react";
import { useData } from "../../context/DataProvider";
import { Modal } from "./Modal";
import { DepartmentEditor } from "./DepartmentEditor";

/**
 * Управление отделами с двухуровневым аккордеоном и умным поиском
 */
export const DepartmentsManager = () => {
  const {
    departments,
    filials,
    users,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFilial, setFilterFilial] = useState("");
  const [manualExpandedFilials, setManualExpandedFilials] = useState(new Set());
  const [manualExpandedParents, setManualExpandedParents] = useState(new Set());

  const isSearching = searchQuery.trim().length > 0;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Проверка соответствия отдела поисковому запросу
  const matchesSearch = (dept) => {
    if (!isSearching) return true;
    const name = (dept.name || "").toLowerCase();
    return name.includes(normalizedQuery);
  };

  const getFilialName = (filialId) => {
    return filials.find((f) => f.id === filialId)?.name || "Не указан";
  };

  const getUsersCount = (deptId) => {
    return users.filter((u) => u.department_id === deptId && u.active).length;
  };

  // Группируем отделы по филиалам и родителям
  const groupedData = useMemo(() => {
    const result = {};

    filials.forEach((f) => {
      result[f.id] = {
        filial: f,
        parentDepts: [],
        childDeptsByParent: {},
      };
    });

    departments.forEach((dept) => {
      const filialId = dept.filial_id;
      if (!result[filialId]) return;

      if (dept.parent_id === 0) {
        result[filialId].parentDepts.push(dept);
      } else {
        if (!result[filialId].childDeptsByParent[dept.parent_id]) {
          result[filialId].childDeptsByParent[dept.parent_id] = [];
        }
        result[filialId].childDeptsByParent[dept.parent_id].push(dept);
      }
    });

    // Сортируем
    Object.values(result).forEach((data) => {
      data.parentDepts.sort((a, b) => a.sort - b.sort);
      Object.values(data.childDeptsByParent).forEach((list) => {
        list.sort((a, b) => a.sort - b.sort);
      });
    });

    return result;
  }, [filials, departments]);

  // Определяем, какие филиалы и родительские отделы должны быть раскрыты
  const { expandedFilials, expandedParents } = useMemo(() => {
    const filialsSet = new Set(manualExpandedFilials);
    const parentsSet = new Set(manualExpandedParents);

    if (isSearching) {
      // При поиске автоматически раскрываем всё, что содержит совпадения
      Object.values(groupedData).forEach((data) => {
        const hasMatchInFilial = data.parentDepts.some((parent) => {
          // Родительский отдел сам подходит под поиск
          if (matchesSearch(parent)) return true;
          // Или у него есть подотделы, подходящие под поиск
          const children = data.childDeptsByParent[parent.id] || [];
          return children.some((child) => matchesSearch(child));
        });

        if (hasMatchInFilial) {
          filialsSet.add(data.filial.id);

          // Раскрываем родительские отделы с совпадениями
          data.parentDepts.forEach((parent) => {
            const children = data.childDeptsByParent[parent.id] || [];
            const hasMatchInParent =
              matchesSearch(parent) ||
              children.some((child) => matchesSearch(child));

            if (hasMatchInParent && children.length > 0) {
              parentsSet.add(parent.id);
            }
          });
        }
      });
    }

    return { expandedFilials: filialsSet, expandedParents: parentsSet };
  }, [
    isSearching,
    normalizedQuery,
    groupedData,
    manualExpandedFilials,
    manualExpandedParents,
  ]);

  // Фильтрация по выбранному филиалу
  const sortedFilials = [...filials].sort((a, b) => a.sort - b.sort);
  const filteredFilials = filterFilial
    ? sortedFilials.filter((f) => f.id === Number(filterFilial))
    : sortedFilials;

  // Переключение раскрытия (ручное)
  const toggleFilial = (filialId) => {
    setManualExpandedFilials((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(filialId)) {
        newSet.delete(filialId);
      } else {
        newSet.add(filialId);
      }
      return newSet;
    });
  };

  const toggleParent = (parentId) => {
    setManualExpandedParents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setManualExpandedFilials(new Set(sortedFilials.map((f) => f.id)));
    setManualExpandedParents(
      new Set(departments.filter((d) => d.parent_id === 0).map((d) => d.id)),
    );
  };

  const collapseAll = () => {
    setManualExpandedFilials(new Set());
    setManualExpandedParents(new Set());
    setSearchQuery(""); // Сбрасываем поиск тоже
  };

  // CRUD handlers
  const handleAdd = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  const handleDelete = (department) => {
    const hasChildren = departments.some((d) => d.parent_id === department.id);

    if (hasChildren) {
      alert(
        `Нельзя удалить отдел "${department.name || "(без названия)"}", так как у него есть подотделы.\n\nСначала удалите или переместите подотделы.`,
      );
      return;
    }

    const usersCount = getUsersCount(department.id);
    const confirmMsg =
      usersCount > 0
        ? `Удалить отдел "${department.name || "(без названия)"}"?\n\nВ этом отделе ${usersCount} сотрудник(ов). Они останутся в базе, но не будут отображаться в справочнике.`
        : `Удалить отдел "${department.name || "(без названия)"}"?`;

    if (window.confirm(confirmMsg)) {
      deleteDepartment(department.id);
    }
  };

  const handleSave = (departmentData) => {
    if (editingDepartment) {
      updateDepartment(editingDepartment.id, departmentData);
    } else {
      addDepartment(departmentData);
    }
    setIsModalOpen(false);
  };

  // Подсчёт совпадений в филиале (для отображения в заголовке при поиске)
  const countMatchesInFilial = (filialId) => {
    if (!isSearching) return 0;
    const data = groupedData[filialId];
    if (!data) return 0;

    let count = 0;
    data.parentDepts.forEach((parent) => {
      if (matchesSearch(parent)) count++;
      const children = data.childDeptsByParent[parent.id] || [];
      children.forEach((child) => {
        if (matchesSearch(child)) count++;
      });
    });
    return count;
  };

  // Компонент строки отдела (рекурсивный для подотделов)
  const DepartmentRow = ({ dept, level = 0, filialId }) => {
    const usersCount = getUsersCount(dept.id);
    const data = groupedData[filialId];
    const children = data?.childDeptsByParent[dept.id] || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedParents.has(dept.id);

    // При поиске фильтруем: показываем только подходящие отделы
    if (isSearching && level === 0) {
      // Родительский отдел показываем, если он сам подходит или у него есть подходящие подотделы
      const selfMatch = matchesSearch(dept);
      const childrenMatch = children.some((child) => matchesSearch(child));
      if (!selfMatch && !childrenMatch) return null;
    }

    const paddingLeft = level === 0 ? "pl-3" : "pl-6";

    return (
      <>
        <tr
          className={`hover:bg-gray-50 border-b border-gray-100 ${
            level === 1 ? "bg-blue-50/30" : ""
          }`}
        >
          <td
            className={`px-3 py-2.5 text-xs text-gray-400 w-12 ${paddingLeft}`}
          >
            {dept.id}
          </td>
          <td className="px-3 py-2.5">
            <div className="flex items-center gap-2">
              {level > 0 && (
                <span className="text-blue-400 text-xs flex-shrink-0">└</span>
              )}
              {hasChildren && level === 0 ? (
                <button
                  onClick={() => toggleParent(dept.id)}
                  className="p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              ) : level === 0 ? (
                <FolderTree className="w-4 h-4 text-gray-300 flex-shrink-0" />
              ) : null}
              <span
                className={`text-sm ${
                  level === 0
                    ? "font-semibold text-gray-900"
                    : "font-medium text-blue-700"
                }`}
              >
                {highlightMatch(dept.name || "(без названия)")}
              </span>
              {usersCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    level === 0
                      ? "bg-gray-100 text-gray-600"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  👤 {usersCount}
                </span>
              )}
              {hasChildren && level === 0 && (
                <span className="text-xs text-gray-400 min-w-[80px]">
                  ({children.length} подотдел.)
                </span>
              )}
            </div>
          </td>
          <td className="px-3 py-2.5 text-center text-xs text-gray-500 w-16">
            {dept.sort}
          </td>
          <td className="px-3 py-2.5 text-right w-24">
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => handleEdit(dept)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Редактировать"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(dept)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>

        {/* Подотделы (если раскрыто) */}
        {isExpanded &&
          hasChildren &&
          level === 0 &&
          children.map((child) => {
            // При поиске показываем только подходящие подотделы
            if (isSearching && !matchesSearch(child)) return null;
            return (
              <DepartmentRow
                key={child.id}
                dept={child}
                level={level + 1}
                filialId={filialId}
              />
            );
          })}
      </>
    );
  };

  // Подсветка совпадений в названии
  const highlightMatch = (text) => {
    if (!isSearching || !text || text === "(без названия)") return text;

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

  // Общее количество найденных отделов
  const totalMatches = useMemo(() => {
    if (!isSearching) return departments.length;
    return departments.filter((d) => matchesSearch(d)).length;
  }, [isSearching, normalizedQuery, departments]);

  return (
    <div>
      {/* Заголовок и кнопка добавления */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900">
          Отделы ({departments.length})
        </h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить отдел
        </button>
      </div>

      {/* Панель фильтров */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию отдела..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
      </div>

      {/* Кнопки раскрытия/свертывания */}
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
      {isSearching && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-yellow-800">
            🔍 Найдено: <strong>{totalMatches}</strong> из {departments.length}{" "}
            отделов
            {totalMatches === 0 && " — попробуйте изменить запрос"}
          </span>
        </div>
      )}

      {/* Таблица отделов с аккордеоном по филиалам */}
      <div className="space-y-3">
        {filteredFilials.map((filial) => {
          const data = groupedData[filial.id];
          if (!data || data.parentDepts.length === 0) return null;

          const isFilialExpanded = expandedFilials.has(filial.id);
          const totalDepts =
            data.parentDepts.length +
            Object.values(data.childDeptsByParent).reduce(
              (sum, arr) => sum + arr.length,
              0,
            );

          // При поиске скрываем филиалы без совпадений
          if (isSearching) {
            const matchesCount = countMatchesInFilial(filial.id);
            if (matchesCount === 0) return null;
          }

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
                  {highlightMatch(filial.name)}
                </span>
                <span className="text-xs opacity-80">
                  {isSearching
                    ? `${countMatchesInFilial(filial.id)} совпад.`
                    : `${totalDepts} отдел.`}
                </span>
              </button>

              {/* Содержимое филиала */}
              {isFilialExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                          ID
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Название отдела
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">
                          Порядок
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase w-24">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.parentDepts.map((parentDept) => (
                        <DepartmentRow
                          key={parentDept.id}
                          dept={parentDept}
                          level={0}
                          filialId={filial.id}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredFilials.filter((f) => {
        if (!isSearching) return true;
        return countMatchesInFilial(f.id) > 0;
      }).length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
          {isSearching
            ? "Отделы не найдены. Попробуйте изменить поисковый запрос."
            : "Отделы не найдены. Добавьте новый отдел."}
        </div>
      )}

      {/* Модальное окно */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDepartment ? "Редактировать отдел" : "Добавить отдел"}
      >
        <DepartmentEditor
          department={editingDepartment}
          filials={filials}
          departments={departments}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
