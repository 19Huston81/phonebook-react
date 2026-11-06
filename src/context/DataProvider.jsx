import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { fetchAllData, saveDataToServer } from "../utils/api";

const DataContext = createContext();

/**
 * Провайдер данных справочника с автоматическим сохранением
 */
export const DataProvider = ({ children }) => {
  const [filials, setFilials] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState("server");

  // Состояние автосохранения
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const saveTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const serverData = await fetchAllData();

      if (serverData) {
        setFilials(serverData.filials);
        setDepartments(serverData.departments);
        setUsers(serverData.users);
        setDataSource("server");
        console.log("✓ Данные загружены с сервера");
      } else {
        await loadStaticData();
        setDataSource("static");
        console.log("✓ Данные загружены из статических файлов");
      }
    } catch (err) {
      console.error("Ошибка загрузки данных:", err);
      setError("Не удалось загрузить данные справочника");
    } finally {
      setLoading(false);
      // Отмечаем, что начальная загрузка завершена
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    }
  };

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

  // ===== Автосохранение с debounce =====
  const triggerAutoSave = useCallback(() => {
    // Не сохраняем при начальной загрузке
    if (isInitialLoadRef.current) return;

    // Сохраняем только если данные загружены с сервера
    if (dataSource !== "server") return;

    // Сбрасываем предыдущий таймер
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Устанавливаем новый таймер на 1.5 секунды
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");

      const result = await saveDataToServer({ filials, departments, users });

      if (result.success) {
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        console.log("✓ Данные автоматически сохранены");
      } else {
        setSaveStatus("error");
        console.error("✗ Ошибка автосохранения:", result.message);
      }

      // Сбрасываем статус через 3 секунды
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }, 1500);
  }, [filials, departments, users, dataSource]);

  // Следим за изменениями данных и запускаем автосохранение
  useEffect(() => {
    triggerAutoSave();
  }, [filials, departments, users]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Ручное сохранение (для кнопки "Резервная копия")
  const manualSave = async () => {
    setSaveStatus("saving");
    const result = await saveDataToServer({ filials, departments, users });

    if (result.success) {
      setSaveStatus("saved");
      setLastSavedAt(new Date());
    } else {
      setSaveStatus("error");
    }

    setTimeout(() => {
      setSaveStatus("idle");
    }, 3000);

    return result;
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

  // Массовое обновление всех данных
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
    saveStatus,
    lastSavedAt,
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
    manualSave,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
