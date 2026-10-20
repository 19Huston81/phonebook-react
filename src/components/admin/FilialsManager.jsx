import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useData } from "../../context/DataProvider";
import { Modal } from "./Modal";
import { FilialEditor } from "./FilialEditor";

/**
 * Управление филиалами
 */
export const FilialsManager = () => {
  const { filials, addFilial, updateFilial, deleteFilial } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilial, setEditingFilial] = useState(null);

  const sortedFilials = [...filials].sort((a, b) => a.sort - b.sort);

  const handleAdd = () => {
    setEditingFilial(null);
    setIsModalOpen(true);
  };

  const handleEdit = (filial) => {
    setEditingFilial(filial);
    setIsModalOpen(true);
  };

  const handleDelete = (filial) => {
    if (
      window.confirm(
        `Удалить филиал "${filial.name}"?\n\nВсе отделы и сотрудники этого филиала останутся в базе, но не будут отображаться.`,
      )
    ) {
      deleteFilial(filial.id);
    }
  };

  const handleSave = (filialData) => {
    if (editingFilial) {
      updateFilial(editingFilial.id, filialData);
    } else {
      addFilial(filialData);
    }
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Заголовок и кнопка добавления */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900">
          Филиалы ({filials.length})
        </h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить филиал
        </button>
      </div>

      {/* Таблица филиалов */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Порядок
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Название
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedFilials.map((filial) => (
              <tr key={filial.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">
                  {filial.sort}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {filial.name}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(filial)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Редактировать"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(filial)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedFilials.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Нет филиалов. Добавьте первый филиал.
          </div>
        )}
      </div>

      {/* Модальное окно редактирования */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFilial ? "Редактировать филиал" : "Добавить филиал"}
      >
        <FilialEditor
          filial={editingFilial}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
