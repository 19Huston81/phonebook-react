/**
 * Утилита для работы с API-сервером справочника
 */

// Базовый адрес сервера
// Пустая строка означает относительный путь (для работы через IIS reverse proxy)
// Для разработки с отдельным сервером можно указать: 'http://localhost:3001'
const API_BASE_URL = "";

/**
 * Проверяет доступность сервера
 * @returns {Promise<boolean>}
 */
export const checkServerAvailable = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2000), // Таймаут 2 секунды
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Загружает данные с сервера
 * @returns {Promise<{filials: Array, departments: Array, users: Array} | null>}
 */
export const fetchAllData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Валидация структуры
    if (
      !Array.isArray(data.filials) ||
      !Array.isArray(data.departments) ||
      !Array.isArray(data.users)
    ) {
      throw new Error("Неверный формат данных");
    }

    return data;
  } catch (err) {
    console.warn("Не удалось загрузить данные с сервера:", err.message);
    return null;
  }
};

/**
 * Сохраняет данные на сервере
 * @param {Object} data - { filials: [], departments: [], users: [] }
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const saveDataToServer = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.error || "Ошибка сохранения данных",
      };
    }

    return {
      success: true,
      message: result.message || "Данные успешно сохранены",
    };
  } catch (err) {
    console.error("Ошибка сохранения на сервере:", err);
    return {
      success: false,
      message: `Ошибка соединения с сервером: ${err.message}`,
    };
  }
};
