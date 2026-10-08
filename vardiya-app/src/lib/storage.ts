import type { AppData, Employee } from "./types";
import { DEFAULT_SHIFTS } from "./shifts";
import { getWeekDates, toISODate } from "./dates";
import { nextColor } from "./colors";

const STORAGE_KEY = "vardiya-app-data-v1";

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** İlk açılışta ürünün "canlı" görünmesi için örnek veri */
export function seedData(): AppData {
  const week = getWeekDates(0);

  const employees: Employee[] = [
    { id: uid("emp"), name: "Ayşe Yılmaz", phone: "0532 111 22 33", role: "Barista", color: nextColor(0) },
    { id: uid("emp"), name: "Mehmet Kaya", phone: "0533 222 33 44", role: "Garson", color: nextColor(1) },
    { id: uid("emp"), name: "Zeynep Demir", phone: "0534 333 44 55", role: "Şef", color: nextColor(2) },
    { id: uid("emp"), name: "Can Arslan", phone: "0535 444 55 66", role: "Garson", color: nextColor(3) },
  ];

  const assignments: Record<string, string> = {};
  const set = (empIdx: number, dayIdx: number, shiftId: string) => {
    const emp = employees[empIdx];
    const date = toISODate(week[dayIdx]);
    assignments[`${emp.id}__${date}`] = shiftId;
  };

  // Örnek bir haftalık plan
  set(0, 0, "sabah");
  set(0, 1, "sabah");
  set(0, 3, "sabah");
  set(1, 0, "aksam");
  set(1, 1, "aksam");
  set(1, 2, "aksam");
  set(2, 2, "tamgun");
  set(2, 4, "sabah");
  set(3, 4, "aksam");
  set(3, 5, "aksam");

  return {
    businessName: "Örnek Kafe",
    employees,
    shiftTemplates: DEFAULT_SHIFTS,
    assignments,
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return seedData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as AppData;
    // Eksik alanlara karşı güvenlik
    return {
      businessName: parsed.businessName ?? "İşletmem",
      employees: parsed.employees ?? [],
      shiftTemplates: parsed.shiftTemplates?.length ? parsed.shiftTemplates : DEFAULT_SHIFTS,
      assignments: parsed.assignments ?? {},
    };
  } catch {
    return seedData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessizce yut (depolama dolu olabilir)
  }
}

export function clearData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export { uid };
