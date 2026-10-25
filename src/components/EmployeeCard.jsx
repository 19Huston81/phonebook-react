import { useState } from "react";
import {
  Mail,
  Phone,
  Smartphone,
  Home,
  Building2,
  Check,
  User,
} from "lucide-react";

/**
 * Карточка сотрудника (компактный вариант, без внутреннего телефона)
 */
export const EmployeeCard = ({ user }) => {
  const [copied, setCopied] = useState(false);

  /**
   * Универсальное копирование в буфер обмена
   * Работает и по HTTPS (через navigator.clipboard),
   * и по HTTP (через фолбэк на execCommand)
   */
  const copyToClipboard = async (text) => {
    if (!text) return;

    try {
      // Вариант 1: современный API (работает по HTTPS и localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Вариант 2: фолбэк через временный textarea (работает везде)
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
          document.execCommand("copy");
        } finally {
          document.body.removeChild(textarea);
        }
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Ошибка копирования:", err);
    }
  };

  // Компонент для отображения одного поля контакта
  const ContactItem = ({ icon: Icon, label, value, isLink, isEmail }) => {
    if (!value) return null;

    return (
      <div className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1 text-xs text-gray-700 transition-colors">
        <Icon className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <span className="text-gray-500 font-medium">{label}:</span>
        {isLink ? (
          <a
            href={`tel:${value.replace(/[\s()-]/g, "")}`}
            className="text-blue-600 hover:underline font-medium"
          >
            {value}
          </a>
        ) : isEmail ? (
          <button
            onClick={() => copyToClipboard(value)}
            className="text-blue-600 hover:underline font-medium flex items-center gap-1"
            title="Нажмите, чтобы скопировать"
          >
            {value}
            {copied ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <span className="text-gray-400">📋</span>
            )}
          </button>
        ) : (
          <span className="font-medium">{value}</span>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-400 rounded-lg p-3 bg-gray-100 hover:shadow-md transition-all duration-200 hover:border-blue-300">
      {/* Заголовок: ФИО и должность */}
      <div className="mb-2 pb-2 border-b border-gray-100">
        {user.fio ? (
          <>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {user.fio}
            </h3>
            {user.position && (
              <p className="text-xs text-gray-500 mt-0.5">{user.position}</p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {user.position ? (
              <span className="text-sm font-medium text-gray-800">
                {user.position}
              </span>
            ) : (
              <span className="text-sm text-gray-400 italic">
                Должность не указана
              </span>
            )}
          </div>
        )}
      </div>

      {/* Контакты: flex-wrap для переноса на новую строку */}
      <div className="flex flex-wrap gap-1.5">
        <ContactItem
          icon={Building2}
          label="Местный"
          value={user.phone_local}
        />
        <ContactItem icon={Phone} label="Городской" value={user.phone_city} />
        <ContactItem
          icon={Smartphone}
          label="Мобильный"
          value={user.phone_mobile}
          isLink
        />
        <ContactItem icon={Home} label="Домашний" value={user.phone_home} />
        <ContactItem icon={Mail} label="Email" value={user.email} isEmail />
      </div>
    </div>
  );
};
