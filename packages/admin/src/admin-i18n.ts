import { createInstance } from "i18next";
import type { i18n, InitOptions } from "i18next";

export const adminLanguages = ["en", "cs", "ar"] as const;
export const adminTranslations = {
  ar: {
    beznyAdmin: {
      clearFilters: "مسح عوامل التصفية",
      clearSelection: "مسح التحديد",
      create: "إنشاء {{entity}}",
      deselect: "إلغاء تحديد {{record}}",
      edit: "تعديل {{record}}",
      entity: "كيان",
      error: "تعذر تحميل السجلات. حاول مرة أخرى.",
      filter: "تصفية حسب {{label}}",
      go: "الانتقال إلى صفحة",
      language: "تغيير اللغة إلى {{language}}",
      languages: { ar: "العربية", cs: "Čeština", en: "English" },
      list: "قائمة {{entity}}",
      loading: "جارٍ تحميل السجلات…",
      next: "الصفحة التالية",
      notifications: {
        dismiss: "إغلاق",
        label: "إشعار",
        viewport: "الإشعارات ({hotkey})",
      },
      pageNumber: "رقم الصفحة",
      pageSize: "تغيير حجم الصفحة",
      previous: "الصفحة السابقة",
      recordsPerPage: "سجلات لكل صفحة",
      refresh: "تحديث السجلات",
      retry: "إعادة محاولة التحميل",
      select: "تحديد {{record}}",
      unavailable: "الكيان غير متاح.",
      view: "عرض {{record}}",
    },
  },
  cs: {
    beznyAdmin: {
      clearFilters: "Zrušit filtry",
      clearSelection: "Zrušit výběr",
      create: "Vytvořit: {{entity}}",
      deselect: "Zrušit výběr {{record}}",
      edit: "Upravit {{record}}",
      entity: "Entita",
      error: "Záznamy se nepodařilo načíst. Zkuste to znovu.",
      filter: "Filtrovat podle: {{label}}",
      go: "Přejít na stránku",
      language: "Změnit jazyk na {{language}}",
      languages: { ar: "العربية", cs: "Čeština", en: "English" },
      list: "Seznam: {{entity}}",
      loading: "Načítání záznamů…",
      next: "Další stránka",
      notifications: {
        dismiss: "Zavřít",
        label: "Oznámení",
        viewport: "Oznámení ({hotkey})",
      },
      pageNumber: "Číslo stránky",
      pageSize: "Změnit velikost stránky",
      previous: "Předchozí stránka",
      recordsPerPage: "Záznamů na stránce",
      refresh: "Obnovit záznamy",
      retry: "Zkusit načíst znovu",
      select: "Vybrat {{record}}",
      unavailable: "Entita není dostupná.",
      view: "Zobrazit {{record}}",
    },
  },
  en: {
    beznyAdmin: {
      clearFilters: "Clear filters",
      clearSelection: "Clear selection",
      create: "Create {{entity}}",
      deselect: "Deselect {{record}}",
      edit: "Edit {{record}}",
      entity: "Entity",
      error: "Unable to load records. Please try again.",
      filter: "Filter by {{label}}",
      go: "Go to page",
      language: "Change language to {{language}}",
      languages: { ar: "العربية", cs: "Čeština", en: "English" },
      list: "List {{entity}}",
      loading: "Loading records…",
      next: "Next page",
      notifications: {
        dismiss: "Dismiss",
        label: "Notification",
        viewport: "Notifications ({hotkey})",
      },
      pageNumber: "Page number",
      pageSize: "Change page size",
      previous: "Previous page",
      recordsPerPage: "Records per page",
      refresh: "Refresh records",
      retry: "Retry loading records",
      select: "Select {{record}}",
      unavailable: "Entity unavailable.",
      view: "View {{record}}",
    },
  },
};

/** Standard i18next instance; callers can instead supply their own initialized instance. */
export const createAdminI18n = (options: InitOptions = {}): i18n => {
  const instance = createInstance(
    {
      defaultNS: "beznyAdmin",
      fallbackLng: "en",
      interpolation: { escapeValue: false },
      lng: "en",
      react: { useSuspense: false },
      resources: structuredClone(adminTranslations),
      supportedLngs: [...adminLanguages],
      ...options,
      initAsync: false,
    },
    // oxlint-disable-next-line promise/prefer-await-to-callbacks -- Inline resources initialize synchronously; the factory must return a ready instance, not a promise.
    (error) => {
      if (error) {
        throw new Error("Unable to initialize admin translations.", {
          cause: error,
        });
      }
    }
  );
  for (const language of adminLanguages) {
    instance.addResourceBundle(
      language,
      "beznyAdmin",
      structuredClone(adminTranslations[language].beznyAdmin),
      true,
      false
    );
  }
  return instance;
};
