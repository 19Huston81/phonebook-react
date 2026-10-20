import { useState, useEffect } from "react";

/**
 * Хук для загрузки данных справочника из JSON-файлов
 * @returns {Object} { data, loading, error, refetch }
 */
export const usePhonebookData = () => {
  const [data, setData] = useState({
    filials: [],
    departments: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Загружаем все три файла параллельно
      const [filialsRes, departmentsRes, usersRes] = await Promise.all([
        fetch("/data/filials.json"),
        fetch("/data/departments.json"),
        fetch("/data/users.json"),
      ]);

      // Проверяем успешность запросов
      if (!filialsRes.ok || !departmentsRes.ok || !usersRes.ok) {
        throw new Error("Ошибка загрузки данных справочника");
      }

      // Парсим JSON
      const [filials, departments, users] = await Promise.all([
        filialsRes.json(),
        departmentsRes.json(),
        usersRes.json(),
      ]);

      setData({ filials, departments, users });
    } catch (err) {
      console.error("Ошибка загрузки данных:", err);
      setError(err.message || "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при первом рендере
  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};
