import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Building,
  Users,
  Navigation,
  X,
} from "lucide-react";
import { useData } from "../context/DataProvider";
import { EmployeeCard } from "./EmployeeCard";

export const FilialAccordion = () => {
  const { filials, departments, users } = useData();

  const [openFilialId, setOpenFilialId] = useState(null);
  const [openDeptId, setOpenDeptId] = useState(null);

  const filialRefs = useRef({});
  const deptRefs = useRef({});

  const toggleFilial = (filialId) => {
    setOpenFilialId((prevId) => (prevId === filialId ? null : filialId));
    setOpenDeptId(null);
  };

  const toggleDepartment = (deptId) => {
    setOpenDeptId((prevId) => (prevId === deptId ? null : deptId));
  };

  useEffect(() => {
    if (openFilialId && filialRefs.current[openFilialId]) {
      filialRefs.current[openFilialId].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [openFilialId]);

  useEffect(() => {
    if (openDeptId && deptRefs.current[openDeptId]) {
      deptRefs.current[openDeptId].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [openDeptId]);

  // 🎯 Вычисляем текст для липкого заголовка
  const activeFilial = filials.find((f) => f.id === openFilialId);
  const activeDept = openDeptId
    ? departments.find((d) => d.id === openDeptId)
    : null;

  const stickyLabel =
    activeFilial && activeDept
      ? `${activeFilial.name} → ${activeDept.name}`
      : activeFilial?.name || "";

  const sortedFilials = [...filials].sort((a, b) => a.sort - b.sort);

  return (
    <div className="space-y-3">
      {/* 📌 ЛИПКИЙ ЗАГОЛОВОК КОНТЕКСТА */}
      {stickyLabel && (
        <div className="sticky top-0 z-30 bg-blue-600 text-white px-4 py-3 shadow-lg flex items-center gap-2 rounded-b-lg mb-3 border-t border-blue-500">
          <Navigation className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span className="font-medium text-sm truncate">{stickyLabel}</span>

          {/* Кнопка быстрого закрытия */}
          <button
            onClick={() => {
              setOpenFilialId(null);
              setOpenDeptId(null);
            }}
            className="ml-auto p-1 hover:bg-blue-700 rounded transition-colors"
            title="Свернуть все"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Основной список филиалов */}
      {sortedFilials.map((filial) => {
        const isFilialOpen = openFilialId === filial.id;
        const filialDepartments = departments.filter(
          (d) => d.filial_id === filial.id,
        );
        const parentDepartments = filialDepartments
          .filter((d) => d.parent_id === 0)
          .sort((a, b) => a.sort - b.sort);

        return (
          <div
            key={filial.id}
            ref={(el) => (filialRefs.current[filial.id] = el)}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            <button
              onClick={() => toggleFilial(filial.id)}
              className={`w-full flex items-center gap-3 p-3 transition-colors text-left ${
                isFilialOpen
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-900"
              }`}
            >
              {isFilialOpen ? (
                <ChevronDown className="w-5 h-5 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-5 h-5 flex-shrink-0" />
              )}
              <Building className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold text-sm flex-1">
                {filial.name}
              </span>
            </button>

            {isFilialOpen && (
              <div className="p-4 bg-white border-t border-gray-100">
                {filial.intro && (
                  <div
                    className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-sm text-gray-700 rounded"
                    dangerouslySetInnerHTML={{ __html: filial.intro }}
                  />
                )}

                <div className="space-y-2">
                  {parentDepartments.map((parentDept) => {
                    const isDeptOpen = openDeptId === parentDept.id;
                    const childDepartments = filialDepartments
                      .filter((d) => d.parent_id === parentDept.id)
                      .sort((a, b) => a.sort - b.sort);

                    const allDepartmentsInGroup = [
                      parentDept,
                      ...childDepartments,
                    ];
                    const hasUsers = allDepartmentsInGroup.some((dept) =>
                      users.some(
                        (u) => u.department_id === dept.id && u.active,
                      ),
                    );

                    if (!hasUsers) return null;

                    return (
                      <div
                        key={parentDept.id}
                        ref={(el) => (deptRefs.current[parentDept.id] = el)}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleDepartment(parentDept.id)}
                          className={`w-full flex items-center gap-2 px-4 py-3 transition-colors text-left ${
                            isDeptOpen
                              ? "bg-blue-50 text-blue-900"
                              : "bg-gray-50 hover:bg-gray-100 text-gray-900"
                          }`}
                        >
                          {isDeptOpen ? (
                            <ChevronDown className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 flex-shrink-0" />
                          )}
                          <Users className="w-4 h-4 flex-shrink-0 text-blue-600" />
                          <span className="font-semibold flex-1 text-sm">
                            {parentDept.name}
                          </span>
                        </button>

                        {isDeptOpen && (
                          <div className="p-4 bg-white border-t border-gray-100">
                            {users
                              .filter(
                                (u) =>
                                  u.department_id === parentDept.id && u.active,
                              )
                              .sort((a, b) => a.sort - b.sort)
                              .map((user) => (
                                <div key={user.id} className="mb-2">
                                  <EmployeeCard user={user} />
                                </div>
                              ))}

                            {childDepartments.map((childDept) => {
                              const childUsers = users
                                .filter(
                                  (u) =>
                                    u.department_id === childDept.id &&
                                    u.active,
                                )
                                .sort((a, b) => a.sort - b.sort);

                              if (!childDept.name || childUsers.length === 0)
                                return null;

                              return (
                                <div
                                  key={childDept.id}
                                  className="mt-4 border-l-2 border-blue-300 pl-3"
                                >
                                  <h4 className="font-bold text-blue-600 mb-1.5 text-sm">
                                    {childDept.name}
                                  </h4>
                                  <div className="space-y-2">
                                    {childUsers.map((user) => (
                                      <EmployeeCard key={user.id} user={user} />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
