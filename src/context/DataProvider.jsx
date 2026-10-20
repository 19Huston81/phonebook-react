import { createContext, useContext, useState, useEffect } from "react";
import { usePhonebookData } from "../hooks/usePhonebookData";

// Создаём контекст
const DataContext = createContext();

/**
 * Провайдер данных справочника
 */
export const DataProvider = ({ children }) => {
  const { data, loading, error, refetch } = usePhonebookData();

  // Рабочая копия данных (будет изменяться в админке)
  const [filials, setFilials] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  // Синхронизируем рабочую копию с загруженными данными
  useEffect(() => {
    if (data.filials.length > 0) {
      setFilials(data.filials);
      setDepartments(data.departments);
      setUsers(data.users);
    }
  }, [data]);

  // ===== CRUD для филиалов =====
  const addFilial = (filial) => {
    const newId = Math.max(...filials.map((f) => f.id), 0) + 1;
    setFilials([...filials, { ...filial, id: newId }]);
  };

  const updateFilial = (id, updates) => {
    setFilials(filials.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteFilial = (id) => {
    setFilials(filials.filter((f) => f.id !== id));
  };

  // ===== CRUD для отделов =====
  const addDepartment = (department) => {
    const newId = Math.max(...departments.map((d) => d.id), 0) + 1;
    setDepartments([...departments, { ...department, id: newId }]);
  };

  const updateDepartment = (id, updates) => {
    setDepartments(
      departments.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
  };

  const deleteDepartment = (id) => {
    setDepartments(departments.filter((d) => d.id !== id));
  };

  // ===== CRUD для сотрудников =====
  const addUser = (user) => {
    const newId = Math.max(...users.map((u) => u.id), 0) + 1;
    setUsers([...users, { ...user, id: newId }]);
  };

  const updateUser = (id, updates) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const deleteUser = (id) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  // Метод для получения всех данных (для экспорта в JSON)
  const getAllData = () => ({
    filials,
    departments,
    users,
  });

  // Метод для обновления всех данных (для импорта из JSON)
  const setAllData = (newData) => {
    if (newData.filials) setFilials(newData.filials);
    if (newData.departments) setDepartments(newData.departments);
    if (newData.users) setUsers(newData.users);
  };

  const value = {
    // Данные
    filials,
    departments,
    users,

    // Состояния загрузки
    loading,
    error,
    refetch,

    // CRUD для филиалов
    addFilial,
    updateFilial,
    deleteFilial,

    // CRUD для отделов
    addDepartment,
    updateDepartment,
    deleteDepartment,

    // CRUD для сотрудников
    addUser,
    updateUser,
    deleteUser,

    // Глобальные методы
    getAllData,
    setAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

/**
 * Хук для использования контекста данных
 */
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
};
