import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useData } from "../context/DataProvider";
import { SearchBar } from "../components/SearchBar";
import { FilialAccordion } from "../components/FilialAccordion";
import { SearchResults } from "../components/SearchResults";

/**
 * Форматирование даты на русском языке
 */
const formatRussianDate = (date) => {
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const days = [
    "воскресенье",
    "понедельник",
    "вторник",
    "среда",
    "четверг",
    "пятница",
    "суббота",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const dayOfWeek = days[date.getDay()];

  return `${day} ${month} ${year} г., ${dayOfWeek}`;
};

/**
 * Форматирование времени
 */
const formatTime = (date) => {
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Публичная страница справочника
 */
export default function PublicPage() {
  const { loading, error, refetch } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Обновляем время каждую секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Ошибка загрузки
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  const isSearching = searchQuery.trim().length >= 2;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Левая часть: логотип и название */}
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="Логотип"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <h1 className="text-2xl font-bold text-blue-600">
                Телефонный справочник
              </h1>
            </div>

            {/* Правая часть: дата/время и ссылка на админку */}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">
                {formatRussianDate(currentTime)}
              </div>
              <div className="text-lg font-semibold text-blue-600">
                {formatTime(currentTime)}
              </div>
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors mt-1"
              >
                <Settings className="w-3 h-3" />
                Админ-панель
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Поиск */}
        <div className="mb-6">
          <SearchBar onSearch={setSearchQuery} />
        </div>

        {/* Результаты поиска или аккордеон */}
        {isSearching ? (
          <SearchResults query={searchQuery} />
        ) : (
          <FilialAccordion />
        )}
      </main>

      {/* Подвал */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            Телефонный справочник © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
