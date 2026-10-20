import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Компактное модальное окно
 */
export const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Затемнение */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Контент */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[85vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
};
