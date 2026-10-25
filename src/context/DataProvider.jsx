import { createContext, useContext, useState, useEffect } from "react";
import { fetchAllData } from "../utils/api";

const DataContext = createContext();

/**
 * Провайдер данных справочника
 * Пытается загрузить данные с сервера, при недоступности — из статических файлов
 */
export const DataProvider = ({ children }) => {
  const [filials, setFilials] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState("server"); // 'server' | 'static'

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Загрузка данных: сначала с сервера, затем из статических файлов
   */
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Пытаемся загрузить с сервера
      const serverData = await fetchAllData();

      if (serverData) {
        setFilials(serverData.filials);
        setDepartments(serverData.departments);
        setUsers(serverData.users);
        setDataSource("server");
        console.log("✓ Данные загружены с сервера");
      } else {
        // Сервер недоступен — падаем на статические файлы
        await loadStaticData();
        setDataSource("static");
        console.log("✓ Данные загружены из статических файлов");
      }
    } catch (err) {
      console.error("Ошибка загрузки данных:", err);
      setError("Не удалось загрузить данные справочника");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Загрузка из статических файлов (фоллбэк)
   */
  const loadStaticData = async () => {
    const [filialsRes, departmentsRes, usersRes] = await Promise.all([
      fetch("/data/filials.json"),
      fetch("/data/departments.json"),
      fetch("/data/users.json"),
    ]);

    if (!filialsRes.ok || !departmentsRes.ok || !usersRes.ok) {
      throw new Error("Ошибка загрузки статических данных");
    }

    const [filialsData, departmentsData, usersData] = await Promise.all([
      filialsRes.json(),
      departmentsRes.json(),
      usersRes.json(),
    ]);

    setFilials(filialsData);
    setDepartments(departmentsData);
    setUsers(usersData);
  };

  // CRUD для филиалов
  const addFilial = (filial) => {
    const newId =
      filials.length > 0 ? Math.max(...filials.map((f) => f.id)) + 1 : 1;
    const newFilial = { ...filial, id: newId };
    setFilials([...filials, newFilial]);
    return newFilial;
  };

  const updateFilial = (id, updatedData) => {
    setFilials(
      filials.map((f) => (f.id === id ? { ...f, ...updatedData } : f)),
    );
  };

  const deleteFilial = (id) => {
    setFilials(filials.filter((f) => f.id !== id));
  };

  // CRUD для отделов
  const addDepartment = (department) => {
    const newId =
      departments.length > 0
        ? Math.max(...departments.map((d) => d.id)) + 1
        : 1;
    const newDepartment = { ...department, id: newId };
    setDepartments([...departments, newDepartment]);
    return newDepartment;
  };

  const updateDepartment = (id, updatedData) => {
    setDepartments(
      departments.map((d) => (d.id === id ? { ...d, ...updatedData } : d)),
    );
  };

  const deleteDepartment = (id) => {
    setDepartments(departments.filter((d) => d.id !== id));
  };

  // CRUD для пользователей
  const addUser = (user) => {
    const newId =
      users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
    const newUser = { ...user, id: newId };
    setUsers([...users, newUser]);
    return newUser;
  };

  const updateUser = (id, updatedData) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, ...updatedData } : u)));
  };

  const deleteUser = (id) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  // Массовое обновление всех данных (используется при загрузке с сервера)
  const setAllData = (data) => {
    setFilials(data.filials);
    setDepartments(data.departments);
    setUsers(data.users);
  };

  const value = {
    filials,
    departments,
    users,
    loading,
    error,
    dataSource,
    setAllData,
    addFilial,
    updateFilial,
    deleteFilial,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addUser,
    updateUser,
    deleteUser,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
