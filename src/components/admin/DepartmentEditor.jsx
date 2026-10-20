import { useState, useEffect } from "react";

/**
 * Компактная форма редактирования/добавления отдела
 */
export const DepartmentEditor = ({
  department,
  filials,
  departments,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    filial_id: "",
    parent_id: 0,
    sort: 0,
    name: "",
    intro: "",
  });

  useEffect(() => {
    if (department) {
      setFormData({
        filial_id: department.filial_id || "",
        parent_id: department.parent_id || 0,
        sort: department.sort || 0,
        name: department.name || "",
        intro: department.intro || "",
      });
    }
  }, [department]);

  const sortedFilials = [...filials].sort((a, b) => a.sort - b.sort);

  const parentOptions = departments
    .filter(
      (d) => d.filial_id === Number(formData.filial_id) && d.parent_id === 0,
    )
    .filter((d) => !department || d.id !== department.id)
    .sort((a, b) => a.sort - b.sort);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.filial_id) {
      alert("Выберите филиал");
      return;
    }

    const finalName = formData.name.trim();

    onSave({
      ...department,
      filial_id: Number(formData.filial_id),
      parent_id: Number(formData.parent_id),
      sort: parseInt(formData.sort) || 0,
      name: finalName || null,
      intro: formData.intro?.trim() || null,
    });
  };

  const parentDeptName =
    departments.find((d) => d.id === Number(formData.parent_id))?.name ||
    "(без названия)";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Филиал и родительский отдел в две колонки */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Филиал *
          </label>
          <select
            value={formData.filial_id}
            onChange={(e) =>
              setFormData({
                ...formData,
                filial_id: e.target.value,
                parent_id: 0,
              })
            }
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">— Выберите —</option>
            {sortedFilials.map((filial) => (
              <option key={filial.id} value={filial.id}>
                {filial.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Родительский отдел
          </label>
          <select
            value={formData.parent_id}
            onChange={(e) =>
              setFormData({ ...formData, parent_id: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>— Нет —</option>
            {parentOptions.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name || "(без названия)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Название и сортировка в две колонки */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Название отдела
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Оставьте пустым для якорного отдела"
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

      {/* Вступительная информация */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Контакт / описание отдела
        </label>
        <textarea
          value={formData.intro}
          onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
          rows={2}
          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Например: тел. +7 (924) 665-10-55"
        />
      </div>

      {/* Предупреждение для подотделов */}
      {Number(formData.parent_id) > 0 && (
        <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          ℹ️ Будет отображаться как подотдел внутри «{parentDeptName}»
        </div>
      )}

      {/* Кнопки */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button
          type="submit"
          className="flex-1 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        >
          {department ? "Сохранить" : "Добавить"}
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
