import type { StatePayload } from "./types";

async function jsonRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `İstek başarısız (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function fetchState(): Promise<StatePayload> {
  return jsonRequest<StatePayload>("/api/state");
}

export function updateBusiness(name: string) {
  return jsonRequest<{ id: string; name: string }>("/api/business", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function addEmployee(input: {
  name: string;
  phone: string;
  role: string;
  hourlyWage?: number;
}) {
  return jsonRequest<{ id: string }>("/api/employees", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEmployee(
  id: string,
  input: {
    name?: string;
    phone?: string;
    role?: string;
    hourlyWage?: number;
    annualLeaveDays?: number;
  }
) {
  return jsonRequest<{ id: string }>(`/api/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteEmployee(id: string) {
  return jsonRequest<{ ok: boolean }>(`/api/employees/${id}`, { method: "DELETE" });
}

export function addEmployeesBulk(
  employees: { name: string; role: string; phone: string }[]
) {
  return jsonRequest<{ ok: boolean; created: number }>("/api/employees/bulk", {
    method: "POST",
    body: JSON.stringify({ employees }),
  });
}

export function setAssignment(
  employeeId: string,
  date: string,
  shiftTemplateId: string
) {
  return jsonRequest<{ ok: boolean }>("/api/assignments", {
    method: "POST",
    body: JSON.stringify({ employeeId, date, shiftTemplateId }),
  });
}

export function copyWeek(from: string, to: string) {
  return jsonRequest<{ ok: boolean; copied: number }>("/api/assignments/copy", {
    method: "POST",
    body: JSON.stringify({ from, to }),
  });
}

export function clearWeek(week: string) {
  return jsonRequest<{ ok: boolean; deleted: number }>("/api/assignments/clear", {
    method: "POST",
    body: JSON.stringify({ week }),
  });
}

export function createRequest(input: {
  employeeId: string;
  date: string;
  type: string;
  note: string;
  targetEmployeeId?: string;
}) {
  return jsonRequest<{ id: string }>("/api/requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createAnnouncement(message: string) {
  return jsonRequest<{ id: string }>("/api/announcements", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function deleteAnnouncement(id: string) {
  return jsonRequest<{ ok: boolean }>(`/api/announcements/${id}`, { method: "DELETE" });
}

export function setAvailability(input: {
  employeeId: string;
  date: string;
  note?: string;
  remove?: boolean;
}) {
  return jsonRequest<{ ok: boolean }>("/api/availability", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function setDayNote(date: string, note: string) {
  return jsonRequest<{ ok: boolean }>("/api/day-notes", {
    method: "POST",
    body: JSON.stringify({ date, note }),
  });
}

export function updateRequest(id: string, status: string) {
  return jsonRequest<{ ok: boolean }>(`/api/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function addTemplate(input: {
  name: string;
  start: string;
  end: string;
  color: string;
  minStaff?: number;
}) {
  return jsonRequest<{ id: string }>("/api/templates", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTemplate(
  id: string,
  input: { name?: string; start?: string; end?: string; color?: string; minStaff?: number }
) {
  return jsonRequest<{ id: string }>(`/api/templates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTemplate(id: string) {
  return jsonRequest<{ ok: boolean }>(`/api/templates/${id}`, { method: "DELETE" });
}

export function addOpenShift(input: { date: string; shiftTemplateId: string; note?: string }) {
  return jsonRequest<{ id: string }>("/api/open-shifts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteOpenShift(id: string) {
  return jsonRequest<{ ok: boolean }>(`/api/open-shifts/${id}`, { method: "DELETE" });
}

export function claimOpenShift(id: string, employeeId: string) {
  return jsonRequest<{ ok: boolean }>(`/api/open-shifts/${id}/claim`, {
    method: "POST",
    body: JSON.stringify({ employeeId }),
  });
}

export function resetData(mode: "demo" | "empty") {
  return jsonRequest<{ ok: boolean; mode: string }>("/api/reset", {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}
