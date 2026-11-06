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
  const [showStickyHeader, setShowStickyHeader] = useState(false);

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

  // Автоматическое отображение/скрытие липкого заголовка с гистерезисом
  useEffect(() => {
    if (!openDeptId) {
      setShowStickyHeader(false);
      return;
    }

    const STICKY_HEIGHT = 60; // высота липкого блока
    const SHOW_OFFSET = 10; // дополнительный отступ для показа
    const HIDE_OFFSET = 30; // дополнительный отступ для скрытия (гистерезис)

    const handleScroll = () => {
      const deptElement = deptRefs.current[openDeptId];
      if (!deptElement) {
        setShowStickyHeader(false);
        return;
      }

      const rect = deptElement.getBoundingClientRect();

      setShowStickyHeader((prev) => {
        if (prev) {
          // Если блок уже показан — скрываем только когда заголовок
          // вернулся достаточно далеко вниз (гистерезис)
          const shouldHide =
            rect.top > STICKY_HEIGHT + HIDE_OFFSET ||
            rect.bottom < STICKY_HEIGHT;
          return !shouldHide;
        } else {
          // Если блок скрыт — показываем когда заголовок ушёл вверх
          // с небольшим запасом (чтобы не дребезжал на границе)
          const shouldShow =
            rect.top < STICKY_HEIGHT - SHOW_OFFSET &&
            rect.bottom > STICKY_HEIGHT + SHOW_OFFSET;
          return shouldShow;
        }
      });
    };

    const timer = setTimeout(() => {
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
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
        <div
          className={`sticky top-0 z-30 bg-blue-600 text-white px-4 py-3 shadow-lg flex items-center gap-2 rounded-b-lg mb-3 border-t border-blue-500 transition-all duration-300 ${
            showStickyHeader
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-full pointer-events-none"
          }`}
        >
          <Navigation className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span className="font-medium text-sm truncate">{stickyLabel}</span>

          <button
            onClick={() => {
              if (openDeptId) {
                setOpenDeptId(null);
              } else {
                setOpenFilialId(null);
              }
              setShowStickyHeader(false);
            }}
            className="ml-auto p-1 hover:bg-blue-700 rounded transition-colors"
            title={openDeptId ? "Свернуть отдел" : "Свернуть филиал"}
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
                          <span className="font-semibold text-sm flex-1">
                            {parentDept.name}
                          </span>
                        </button>

                        {isDeptOpen && (
                          <div className="p-4 bg-white border-t border-gray-100">
                            {/* Описание отдела (аналогично филиалам) */}
                            {parentDept.intro && (
                              <div
                                className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-sm text-gray-700 rounded"
                                dangerouslySetInnerHTML={{
                                  __html: parentDept.intro,
                                }}
                              />
                            )}

                            {/* Собираем сотрудников:
        - Прямые сотрудники родительского отдела
        - Сотрудники подотделов без имени (объединяются) */}
                            {(() => {
                              // 1. Прямые сотрудники родительского отдела
                              const directUsers = users.filter(
                                (u) =>
                                  u.department_id === parentDept.id && u.active,
                              );

                              // 2. Сотрудники подотделов без имени
                              const usersFromNamelessChildren = childDepartments
                                .filter((childDept) => !childDept.name)
                                .flatMap((childDept) =>
                                  users.filter(
                                    (u) =>
                                      u.department_id === childDept.id &&
                                      u.active,
                                  ),
                                );

                              // 3. Объединяем и сортируем по полю sort
                              const mergedUsers = [
                                ...directUsers,
                                ...usersFromNamelessChildren,
                              ].sort((a, b) => a.sort - b.sort);

                              return mergedUsers.map((user) => (
                                <div key={user.id} className="mb-2">
                                  <EmployeeCard user={user} />
                                </div>
                              ));
                            })()}

                            {/* Отображаем только подотделы С ИМЕНЕМ */}
                            {childDepartments.map((childDept) => {
                              // Пропускаем подотделы без имени (их сотрудники уже показаны выше)
                              if (!childDept.name) return null;

                              const childUsers = users
                                .filter(
                                  (u) =>
                                    u.department_id === childDept.id &&
                                    u.active,
                                )
                                .sort((a, b) => a.sort - b.sort);

                              // Пропускаем пустые подотделы
                              if (childUsers.length === 0) return null;

                              return (
                                <div
                                  key={childDept.id}
                                  className="mt-4 border-l-2 border-blue-300 pl-3"
                                >
                                  <h4 className="font-bold text-blue-600 mb-1.5 text-sm">
                                    {childDept.name}
                                  </h4>
                                  {childDept.intro && (
                                    <div
                                      className="text-xs text-gray-600 mb-2 leading-snug"
                                      dangerouslySetInnerHTML={{
                                        __html: childDept.intro,
                                      }}
                                    />
                                  )}
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
