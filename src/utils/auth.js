/**
 * Утилита для аутентификации администратора
 * Упрощённая версия без зависимости от crypto.subtle
 */

// Пароль хранится в закодированном виде (Base64)
// Это не криптографическая защита, но достаточно для внутреннего справочника
// Для смены пароля: закодируйте новый пароль в Base64
// Пример: "admin" → "YWRtaW4=" (можно получить через btoa("admin") в консоли)
const ADMIN_PASSWORD_ENCODED = "YWRtaW4=";

const AUTH_STORAGE_KEY = "phonebook_admin_auth";

/**
 * Проверяет пароль
 */
export const checkPassword = async (password) => {
  try {
    // Кодируем введённый пароль в Base64 и сравниваем
    const encoded = btoa(password);
    return encoded === ADMIN_PASSWORD_ENCODED;
  } catch (err) {
    console.error("Ошибка проверки пароля:", err);
    return false;
  }
};

/**
 * Сохраняет факт авторизации в localStorage
 */
export const setAuthenticated = (value) => {
  if (value) {
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ authenticated: true, expires }),
    );
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

/**
 * Проверяет, авторизован ли пользователь
 */
export const isAuthenticated = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw);
    if (data.expires && Date.now() > data.expires) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }

    return data.authenticated === true;
  } catch {
    return false;
  }
};
