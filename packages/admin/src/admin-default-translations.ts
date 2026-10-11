import type { i18n } from "i18next";

const defaultPageTranslations = {
  ar: {
    actions: "إجراءات {{record}}",
    all: "الكل",
    apply: "تطبيق",
    cancel: "إلغاء",
    choose: "اختر…",
    confirmDelete: "حذف",
    controls: "عناصر التحكم في المجموعة",
    deleteDescription: "لا يمكن التراجع عن هذا: {{records}}",
    deleteError: "تعذر الحذف. حاول مرة أخرى.",
    deleteRecord: "حذف {{record}}",
    deleteSelection: "حذف المحدد ({{count}})",
    deleteTitle: "حذف السجلات؟",
    empty: "لم يتم العثور على سجلات.",
    item: "العنصر {{id}}",
    required: "هذا الحقل مطلوب.",
    save: "حفظ",
    saveError: "تعذر الحفظ. تحقق من القيم وحاول مرة أخرى.",
  },
  cs: {
    actions: "Akce pro {{record}}",
    all: "Vše",
    apply: "Použít",
    cancel: "Zrušit",
    choose: "Vyberte…",
    confirmDelete: "Smazat",
    controls: "Ovládání kolekce",
    deleteDescription: "Tuto akci nelze vrátit: {{records}}",
    deleteError: "Nepodařilo se smazat. Zkuste to znovu.",
    deleteRecord: "Smazat {{record}}",
    deleteSelection: "Smazat vybrané ({{count}})",
    deleteTitle: "Smazat záznamy?",
    empty: "Žádné záznamy nebyly nalezeny.",
    item: "Položka {{id}}",
    required: "Toto pole je povinné.",
    save: "Uložit",
    saveError: "Nepodařilo se uložit. Zkontrolujte hodnoty a zkuste to znovu.",
  },
  en: {
    actions: "Actions for {{record}}",
    all: "All",
    apply: "Apply",
    cancel: "Cancel",
    choose: "Choose…",
    confirmDelete: "Delete",
    controls: "Collection controls",
    deleteDescription: "This cannot be undone: {{records}}",
    deleteError: "Could not delete. Try again.",
    deleteRecord: "Delete {{record}}",
    deleteSelection: "Delete selected ({{count}})",
    deleteTitle: "Delete records?",
    empty: "No records found.",
    item: "Item {{id}}",
    required: "This field is required.",
    save: "Save",
    saveError: "Could not save. Check the values and try again.",
  },
};
/** Add defaults without replacing application translations or chrome resources. */
export const registerAdminDefaultTranslations = (translations: i18n) => {
  for (const [language, defaults] of Object.entries(defaultPageTranslations)) {
    translations.addResourceBundle(
      language,
      "beznyAdmin",
      { defaults },
      true,
      false
    );
  }
};
