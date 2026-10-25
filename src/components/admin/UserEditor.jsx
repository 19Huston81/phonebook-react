import { useState, useEffect } from "react";

/**
 * Компактная форма редактирования/добавления сотрудника
 * с каскадным выбором: Филиал → Отдел → Подотдел
 */
export const UserEditor = ({
  user,
  filials,
  departments,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    filial_id: "",
    parent_id: "",
    department_id: "",
    sort: 0,
    fio: "",
    position: "",
    phone_local: "",
    phone_city: "",
    phone_mobile: "",
    phone_home: "",
    email: "",
    active: true,
  });

  // Заполняем форму при редактировании существующего сотрудника
  useEffect(() => {
    if (user) {
      // Определяем филиал и родительский отдел из текущего отдела
      const currentDept = departments.find((d) => d.id === user.department_id);
      const filialId = currentDept?.filial_id || "";
      const parentId =
        currentDept?.parent_id === 0
          ? currentDept?.id || ""
          : currentDept?.parent_id || "";

      setFormData({
        filial_id: filialId,
        parent_id: parentId,
        department_id: user.department_id || "",
        sort: user.sort || 0,
        fio: user.fio || "",
        position: user.position || "",
        phone_local: user.phone_local || "",
        phone_city: user.phone_city || "",
        phone_mobile: user.phone_mobile || "",
        phone_home: user.phone_home || "",
        email: user.email || "",
        active: user.active !== false,
      });
    }
  }, [user, departments]);

  // Отсортированные филиалы
  const sortedFilials = [...filials].sort((a, b) => a.sort - b.sort);

  // Родительские отделы выбранного филиала
  const parentDepartments = departments
    .filter(
      (d) => d.filial_id === Number(formData.filial_id) && d.parent_id === 0,
    )
    .sort((a, b) => a.sort - b.sort);

  // Подотделы выбранного родительского отдела
  const childDepartments = formData.parent_id
    ? departments
        .filter((d) => d.parent_id === Number(formData.parent_id))
        .sort((a, b) => a.sort - b.sort)
    : [];

  // Проверка: является ли текущий отдел подотделом
  const selectedDept = departments.find(
    (d) => d.id === Number(formData.department_id),
  );
  const isChildSelected = selectedDept && selectedDept.parent_id !== 0;

  // Обработчик выбора филиала
  const handleFilialChange = (filialId) => {
    setFormData({
      ...formData,
      filial_id: filialId,
      parent_id: "", // сбрасываем отдел
      department_id: "", // сбрасываем итоговый отдел
    });
  };

  // Обработчик выбора родительского отдела
  const handleParentChange = (parentId) => {
    if (!parentId) {
      setFormData({
        ...formData,
        parent_id: "",
        department_id: "",
      });
      return;
    }

    const pid = Number(parentId);
    const children = departments.filter((d) => d.parent_id === pid);

    if (children.length === 0) {
      // Если нет подотделов — выбираем сам родительский отдел
      setFormData({
        ...formData,
        parent_id: parentId,
        department_id: parentId,
      });
    } else {
      // Если есть подотделы — ждём выбора подотдела
      setFormData({
        ...formData,
        parent_id: parentId,
        department_id: "",
      });
    }
  };

  // Обработчик выбора подотдела
  const handleChildChange = (childId) => {
    setFormData({
      ...formData,
      department_id: childId,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.department_id) {
      alert("Выберите отдел сотрудника");
      return;
    }

    if (!formData.position.trim()) {
      alert("Должность обязательна для заполнения");
      return;
    }

    onSave({
      ...user,
      department_id: Number(formData.department_id),
      sort: parseInt(formData.sort) || 0,
      fio: formData.fio.trim() || null,
      position: formData.position.trim() || null,
      phone_local: formData.phone_local.trim() || null,
      phone_city: formData.phone_city.trim() || null,
      phone_mobile: formData.phone_mobile.trim() || null,
      phone_home: formData.phone_home.trim() || null,
      email: formData.email.trim() || null,
      active: formData.active,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Активность */}
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
        <label className="text-xs font-medium text-gray-700">
          Статус сотрудника
        </label>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, active: !formData.active })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            formData.active ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              formData.active ? "translate-x-4.5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Каскадный выбор отдела */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Отдел сотрудника *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {/* Филиал */}
          <select
            value={formData.filial_id}
            onChange={(e) => handleFilialChange(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Филиал —</option>
            {sortedFilials.map((filial) => (
              <option key={filial.id} value={filial.id}>
                {filial.name}
              </option>
            ))}
          </select>

          {/* Родительский отдел */}
          <select
            value={formData.parent_id}
            onChange={(e) => handleParentChange(e.target.value)}
            disabled={!formData.filial_id}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">— Отдел —</option>
            {parentDepartments.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name || "(без названия)"}
              </option>
            ))}
          </select>

          {/* Подотдел */}
          <select
            value={isChildSelected ? formData.department_id : ""}
            onChange={(e) => handleChildChange(e.target.value)}
            disabled={!formData.parent_id || childDepartments.length === 0}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">— Подотдел —</option>
            {childDepartments.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name || "(без названия)"}
              </option>
            ))}
          </select>
        </div>

        {/* Подсказка о выбранном отделе */}
        {selectedDept && (
          <p className="text-xs text-green-700 mt-1">
            ✓ Выбран отдел:{" "}
            <strong>{selectedDept.name || "(без названия)"}</strong>
          </p>
        )}
      </div>

      {/* ФИО и должность */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            ФИО
          </label>
          <input
            type="text"
            value={formData.fio}
            onChange={(e) => setFormData({ ...formData, fio: e.target.value })}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Иванов Иван Иванович"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Должность *
          </label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Например: Инженер"
            required
          />
        </div>
      </div>

      {/* Телефоны (2x2) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Местный
          </label>
          <input
            type="text"
            value={formData.phone_local}
            onChange={(e) =>
              setFormData({ ...formData, phone_local: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="3-51"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Городской
          </label>
          <input
            type="text"
            value={formData.phone_city}
            onChange={(e) =>
              setFormData({ ...formData, phone_city: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="4-20-42"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Мобильный
          </label>
          <input
            type="text"
            value={formData.phone_mobile}
            onChange={(e) =>
              setFormData({ ...formData, phone_mobile: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+7 (924) 665-55-25"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Домашний
          </label>
          <input
            type="text"
            value={formData.phone_home}
            onChange={(e) =>
              setFormData({ ...formData, phone_home: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="4-10-26"
          />
        </div>
      </div>

      {/* Email и сортировка */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ivanov@company.ru"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Порядок
          </label>
          <input
            type="number"
            value={formData.sort}
            onChange={(e) => setFormData({ ...formData, sort: e.target.value })}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button
          type="submit"
          className="flex-1 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        >
          {user ? "Сохранить" : "Добавить"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  );
};
