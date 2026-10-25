/**
 * Простой API-сервер для чтения и записи данных справочника
 * Работает с JSON-файлами в папке ../public/data/
 */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Папка с данными (относительно папки server/)
const DATA_DIR = path.join(__dirname, "..", "public", "data");

// Настройки файлов
const FILES = {
  filials: "filials.json",
  departments: "departments.json",
  users: "users.json",
};

// Middleware
app.use(cors()); // Разрешаем запросы с других доменов (для разработки)
app.use(express.json({ limit: "10mb" })); // Увеличиваем лимит для больших данных

// Вспомогательная функция чтения файла
const readJsonFile = (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error(`Ошибка чтения файла ${filename}:`, err.message);
    return null;
  }
};

// Вспомогательная функция записи файла
const writeJsonFile = (filename, data) => {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error(`Ошибка записи файла ${filename}:`, err.message);
    return false;
  }
};

// ============================================
// Эндпоинты
// ============================================

/**
 * Проверка работоспособности сервера
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    dataDir: DATA_DIR,
  });
});

/**
 * GET /api/data — получить все данные
 */
app.get("/api/data", (req, res) => {
  try {
    const filials = readJsonFile(FILES.filials);
    const departments = readJsonFile(FILES.departments);
    const users = readJsonFile(FILES.users);

    if (!filials || !departments || !users) {
      return res.status(500).json({
        error: "Ошибка чтения данных с сервера",
      });
    }

    res.json({ filials, departments, users });
  } catch (err) {
    console.error("Ошибка получения данных:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

/**
 * POST /api/data — сохранить все данные
 */
app.post("/api/data", (req, res) => {
  try {
    const { filials, departments, users } = req.body;

    // Валидация
    if (
      !Array.isArray(filials) ||
      !Array.isArray(departments) ||
      !Array.isArray(users)
    ) {
      return res.status(400).json({
        error:
          "Неверный формат данных. Ожидается: { filials: [], departments: [], users: [] }",
      });
    }

    // Создаём резервную копию перед записью
    createBackup();

    // Записываем файлы
    const success1 = writeJsonFile(FILES.filials, filials);
    const success2 = writeJsonFile(FILES.departments, departments);
    const success3 = writeJsonFile(FILES.users, users);

    if (!success1 || !success2 || !success3) {
      return res.status(500).json({ error: "Ошибка записи файлов" });
    }

    res.json({
      success: true,
      message: "Данные успешно сохранены",
      savedFiles: Object.values(FILES),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Ошибка сохранения данных:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

/**
 * Создание резервной копии перед записью
 */
function createBackup() {
  const backupDir = path.join(DATA_DIR, "..", "data_backup");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupSubDir = path.join(backupDir, timestamp);

  try {
    // Создаём папку резервных копий, если её нет
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Создаём подпапку с временной меткой
    fs.mkdirSync(backupSubDir, { recursive: true });

    // Копируем все файлы
    Object.values(FILES).forEach((filename) => {
      const source = path.join(DATA_DIR, filename);
      const target = path.join(backupSubDir, filename);
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, target);
      }
    });

    console.log(`✓ Резервная копия создана: ${backupSubDir}`);
  } catch (err) {
    console.error("Ошибка создания резервной копии:", err.message);
  }
}

// Запуск сервера
app.listen(PORT, () => {
  console.log("========================================");
  console.log("📞 Сервер справочника запущен");
  console.log(`🔗 Порт: http://localhost:${PORT}`);
  console.log(`📁 Папка с данными: ${DATA_DIR}`);
  console.log("========================================");
  console.log("Доступные эндпоинты:");
  console.log(`  GET  /api/health — проверка работы`);
  console.log(`  GET  /api/data   — получить все данные`);
  console.log(`  POST /api/data   — сохранить данные`);
  console.log("========================================");
});
