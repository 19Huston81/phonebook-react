import { useState } from "react";
import {
  Save,
  FolderOpen,
  Download,
  CheckCircle,
  AlertCircle,
  Loader,
  Info,
} from "lucide-react";
import { useData } from "../../context/DataProvider";

/**
 * Компонент экспорта данных в JSON
 * - File System Access API (только в безопасном контексте: HTTPS или localhost)
 * - Скачивание через Blob (работает везде)
 */
export const JsonExporter = () => {
  const { filials, departments, users } = useData();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [directoryHandle, setDirectoryHandle] = useState(null);

  // Проверяем, доступен ли File System Access API
  // Он работает ТОЛЬКО в безопасном контексте (HTTPS или localhost)
  const isSecureContext = window.isSecureContext;
  const hasFileSystemAPI = "showDirectoryPicker" in window;
  const canWriteToFolder = isSecureContext && hasFileSystemAPI;

  // ===== File System Access API =====
  const handleSelectDirectory = async () => {
    if (!canWriteToFolder) {
      setStatus("error");
      setMessage(
        'Прямая запись недоступна. Откройте сайт по HTTPS или используйте кнопку "Скачать JSON".',
      );
      return;
    }

    try {
      setStatus("selecting");
      const handle = await window.showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents",
      });

      setDirectoryHandle(handle);
      setStatus("idle");
      setMessage(`✓ Папка выбрана: ${handle.name}`);
    } catch (err) {
      if (err.name !== "AbortError") {
        setStatus("error");
        setMessage(`Ошибка выбора папки: ${err.message}`);
      } else {
        setStatus("idle");
      }
    }
  };

  const handleExportToFileSystem = async () => {
    if (!directoryHandle) {
      setStatus("error");
      setMessage("Сначала выберите папку для сохранения");
      return;
    }

    try {
      setStatus("saving");
      setMessage("Сохранение файлов...");

      const filesData = [
        { name: "filials.json", data: filials },
        { name: "departments.json", data: departments },
        { name: "users.json", data: users },
      ];

      for (const file of filesData) {
        const fileHandle = await directoryHandle.getFileHandle(file.name, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(file.data, null, 2));
        await writable.close();
      }

      setStatus("success");
      setMessage(`✓ Успешно сохранено ${filesData.length} файла(ов) в папку`);

      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } catch (err) {
      setStatus("error");
      setMessage(`Ошибка сохранения: ${err.message}`);
      console.error("Export error:", err);
    }
  };

  // ===== Скачивание через Blob (работает везде) =====
  const downloadFile = (filename, data) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleDownload = () => {
    try {
      setStatus("saving");
      setMessage("Скачивание файлов...");

      downloadFile("filials.json", filials);

      setTimeout(() => {
        downloadFile("departments.json", departments);
      }, 200);

      setTimeout(() => {
        downloadFile("users.json", users);

        setStatus("success");
        setMessage(
          "✓ Файлы скачаны. Замените ими файлы в папке public/data/ на сервере.",
        );

        setTimeout(() => {
          setStatus("idle");
        }, 5000);
      }, 400);
    } catch (err) {
      setStatus("error");
      setMessage(`Ошибка скачивания: ${err.message}`);
      console.error("Download error:", err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-4">
        {/* Иконка */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Save className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1">
            Экспорт данных в JSON
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Сохраните изменения в файлы для публикации на сайте.
          </p>

          {/* Основная кнопка — скачивание (работает везде) */}
          <div className="flex gap-2 flex-wrap mb-2">
            <button
              onClick={handleDownload}
              disabled={status === "saving"}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              title="Скачать все три JSON-файла"
            >
              {status === "saving" ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Скачивание...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  📥 Скачать JSON
                </>
              )}
            </button>
          </div>

          {/* Кнопки прямой записи (только если доступно) */}
          {canWriteToFolder && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleSelectDirectory}
                disabled={status === "saving"}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                {directoryHandle ? "Сменить папку" : "Выбрать папку"}
              </button>

              <button
                onClick={handleExportToFileSystem}
                disabled={!directoryHandle || status === "saving"}
                className="inline-flex items-center gap-2 px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {status === "saving" ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    💾 Сохранить в папку
                  </>
                )}
              </button>
            </div>
          )}

          {/* Информация о доступности */}
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            {!canWriteToFolder && (
              <div className="flex items-start gap-1.5 p-2 bg-blue-50 border border-blue-200 rounded">
                <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium mb-0.5">
                    Прямая запись в папку недоступна
                  </p>
                  <p className="text-blue-700">
                    Функция «Сохранить в папку» работает только по{" "}
                    <strong>HTTPS</strong> или на <strong>localhost</strong>.
                    <br />
                    Текущий адрес:{" "}
                    <code className="bg-blue-100 px-1 rounded">
                      {window.location.origin}
                    </code>
                    <br />
                    Используйте кнопку <strong>«Скачать JSON»</strong> — она
                    работает всегда.
                  </p>
                </div>
              </div>
            )}
            {canWriteToFolder && !directoryHandle && (
              <p>
                💡 Нажмите «Выбрать папку», чтобы сохранять изменения напрямую в
                файлы проекта.
              </p>
            )}
            {canWriteToFolder && directoryHandle && (
              <p className="text-green-700">
                ✓ Папка выбрана: <strong>{directoryHandle.name}</strong>
              </p>
            )}
          </div>

          {/* Статус */}
          {message && (
            <div
              className={`mt-3 flex items-start gap-2 text-xs ${
                status === "success"
                  ? "text-green-700"
                  : status === "error"
                    ? "text-red-700"
                    : "text-gray-600"
              }`}
            >
              {status === "success" && (
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              {status === "error" && (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
