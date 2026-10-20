import { useState, useEffect } from "react";

/**
 * Компактная форма редактирования/добавления филиала
 */
export const FilialEditor = ({ filial, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    sort: 0,
    intro: "",
  });

  useEffect(() => {
    if (filial) {
      setFormData({
        name: filial.name || "",
        sort: filial.sort || 0,
        intro: filial.intro || "",
      });
    }
  }, [filial]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Название филиала обязательно");
      return;
    }

    onSave({
      ...filial,
      ...formData,
      name: formData.name.trim(),
      sort: parseInt(formData.sort) || 0,
      intro: formData.intro.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Название */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Название филиала *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Например: АО 'Чукотэнерго'"
          required
        />
      </div>

      {/* Сортировка */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Порядок сортировки
        </label>
        <input
          type="number"
          value={formData.sort}
          onChange={(e) => setFormData({ ...formData, sort: e.target.value })}
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Вступительная информация */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Вступительная информация (HTML)
        </label>
        <textarea
          value={formData.intro}
          onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
          rows={4}
          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          placeholder="<b>Адрес:</b> г. Анадырь<br>тел: 2-05-49"
        />
      </div>

      {/* Кнопки */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button
          type="submit"
          className="flex-1 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        >
          {filial ? "Сохранить" : "Добавить"}
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
