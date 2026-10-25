/**
 * Нормализует строку для поиска:
 * - приводит к нижнему регистру
 * - удаляет все спецсимволы (оставляет только буквы, цифры и пробелы)
 */
export const normalizeForSearch = (text) => {
  if (!text) return "";
  const lower = text.toLowerCase();
  return lower.replace(/[^ a-zа-яё\d]/gi, "");
};

/**
 * Проверяет, соответствует ли сотрудник поисковому запросу
 * Ищет совпадения в: fio, position, phone_local, phone_mobile, email
 */
export const matchesSearch = (user, normalizedQuery) => {
  if (!normalizedQuery) return true;

  const fieldsToSearch = [
    user.fio, // ФИО
    user.position, // Должность
    user.phone_local, // Местный номер
    user.phone_mobile, // Мобильный номер
    user.email, // E-mail
  ];

  return fieldsToSearch.some((field) => {
    if (!field) return false;
    const normalizedField = normalizeForSearch(field);
    return normalizedField.includes(normalizedQuery);
  });
};

/**
 * Строит иерархию для отображения результатов поиска
 * Группирует сотрудников по: Филиал → Родительский отдел → Отдел
 */
export const buildSearchResults = (users, departments, filials, query) => {
  const normalizedQuery = normalizeForSearch(query);

  // Фильтруем сотрудников по поисковому запросу
  const matchedUsers = users.filter(
    (user) => user.active && matchesSearch(user, normalizedQuery),
  );

  if (matchedUsers.length === 0) return [];

  // Группируем по отделам
  const usersByDepartment = {};
  matchedUsers.forEach((user) => {
    const deptId = user.department_id;
    if (!usersByDepartment[deptId]) {
      usersByDepartment[deptId] = [];
    }
    usersByDepartment[deptId].push(user);
  });

  // Строим иерархию
  const results = [];

  filials
    .sort((a, b) => a.sort - b.sort)
    .forEach((filial) => {
      const filialDepartments = departments.filter(
        (d) => d.filial_id === filial.id,
      );

      filialDepartments
        .filter((d) => d.parent_id === 0) // только родительские отделы
        .sort((a, b) => a.sort - b.sort)
        .forEach((parentDept) => {
          // Собираем все отделы в этой группе (родительский + дочерние)
          const deptGroup = [parentDept];
          const childDepts = filialDepartments
            .filter((d) => d.parent_id === parentDept.id)
            .sort((a, b) => a.sort - b.sort);
          deptGroup.push(...childDepts);

          // Собираем сотрудников из всех отделов группы
          const groupUsers = [];
          deptGroup.forEach((dept) => {
            if (usersByDepartment[dept.id]) {
              usersByDepartment[dept.id].forEach((user) => {
                groupUsers.push({
                  ...user,
                  department: dept,
                  parentDepartment: dept.parent_id === 0 ? null : parentDept,
                });
              });
            }
          });

          if (groupUsers.length > 0) {
            results.push({
              filial,
              parentDepartment: parentDept,
              users: groupUsers.sort((a, b) => a.sort - b.sort),
            });
          }
        });
    });

  return results;
};
