import { useState, useEffect } from "react";
import {
  Save,
  FolderOpen,
  Download,
  CheckCircle,
  AlertCircle,
  Loader,
  Info,
  Server,
  Database,
  Archive,
} from "lucide-react";
import { useData } from "../../context/DataProvider";
import { checkServerAvailable } from "../../utils/api";

/**
 * Панель управления данными с автосохранением и резервным копированием
 */
export const JsonExporter = () => {
  const {
    filials,
    departments,
    users,
    dataSource,
    saveStatus,
    lastSavedAt,
    manualSave,
  } = useData();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [serverAvailable, setServerAvailable] = useState(false);

  useEffect(() => {
    const check = async () => {
      const available = await checkServerAvailable();
      setServerAvailable(available);
    };
    check();
  }, []);

  const isSecureContext = window.isSecureContext;
  const hasFileSystemAPI = "showDirectoryPicker" in window;
  const canWriteToFolder = isSecureContext && hasFileSystemAPI;

  // Ручное создание резервной копии
  const handleManualBackup = async () => {
    setStatus("saving");
    setMessage("Создание резервной копии...");

    const result = await manualSave();

    if (result.success) {
      setStatus("success");
      setMessage("✓ Резервная копия создана");
    } else {
      setStatus("error");
      setMessage(`✗ ${result.message}`);
    }

    setTimeout(() => setStatus("idle"), 5000);
  };

  // Скачивание файлов (запасной вариант)
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
      downloadFile("filials.json", filials);
      setTimeout(() => downloadFile("departments.json", departments), 200);
      setTimeout(() => {
        downloadFile("users.json", users);
        setStatus("success");
        setMessage("✓ Файлы скачаны");
        setTimeout(() => setStatus("idle"), 5000);
      }, 400);
    } catch (err) {
      setStatus("error");
      setMessage(`Ошибка: ${err.message}`);
    }
  };

  // Форматирование времени последнего сохранения
  const formatLastSaved = () => {
    if (!lastSavedAt) return null;
    return lastSavedAt.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900">Управление данными</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                dataSource === "server"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {dataSource === "server" ? "📡 Сервер" : "📄 Файлы"}
            </span>
          </div>

          <p className="text-xs text-gray-600 mb-3">
            Изменения сохраняются автоматически.
          </p>

          {/* Индикатор автосохранения */}
          <div className="mb-3 flex items-center gap-2">
            {saveStatus === "saving" && (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600">
                <Loader className="w-3.5 h-3.5 animate-spin" />
                Сохранение...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle className="w-3.5 h-3.5" />
                Сохранено
                {lastSavedAt && ` в ${formatLastSaved()}`}
              </span>
            )}
            {saveStatus === "error" && (
              <span className="inline-flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5" />
                Ошибка сохранения
              </span>
            )}
            {saveStatus === "idle" && lastSavedAt && (
              <span className="text-xs text-gray-500">
                Последнее сохранение: {formatLastSaved()}
              </span>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex gap-2 flex-wrap">
            {/* Резервная копия */}
            {serverAvailable && (
              <button
                onClick={handleManualBackup}
                disabled={status === "saving"}
                className="inline-flex items-center gap-2 px-4 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                title="Создать резервную копию данных на сервере"
              >
                {status === "saving" ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
                Резервная копия
              </button>
            )}

            {/* Скачивание JSON */}
            <button
              onClick={handleDownload}
              disabled={status === "saving"}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              title="Скачать все три JSON-файла"
            >
              <Download className="w-4 h-4" />
              Скачать JSON
            </button>
          </div>

          {/* Информация */}
          {!serverAvailable && (
            <div className="mt-2 flex items-start gap-1.5 p-2 bg-orange-50 border border-orange-200 rounded">
              <Info className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                Сервер недоступен. Автосохранение не работает. Используйте
                "Скачать JSON".
              </p>
            </div>
          )}

          {/* Статус */}
          {message && (
            <div
              className={`mt-2 flex items-start gap-2 text-xs ${
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
