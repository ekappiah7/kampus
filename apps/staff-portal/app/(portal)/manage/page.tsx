"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

interface StudentRow {
  id: string;
  name: string;
  className: string;
  active: boolean;
}
interface StaffRow {
  id: string;
  name: string;
  title: string | null;
  status: string;
}

export default function ManagePage() {
  const [tab, setTab] = useState<"students" | "staff">("students");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);

  useEffect(() => {
    api.staff.manageStudents().then((r) => setStudents(r as StudentRow[]));
    api.staff.manageStaff().then((r) => setStaff(r as StaffRow[]));
  }, []);

  async function toggleActive(row: StudentRow) {
    await api.staff.setStudentActive(row.id, !row.active);
    setStudents((prev) => prev.map((s) => (s.id === row.id ? { ...s, active: !s.active } : s)));
  }

  return (
    <>
      <PageHeader title="Manage Staff & Students" subtitle="Add, edit, and review records" />

      <div className="mb-4 inline-flex rounded-pill border border-border-alt bg-white p-1">
        {(["students", "staff"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-pill px-4 py-1.5 text-sm font-medium capitalize"
            style={{ background: tab === t ? "#2A2C30" : "transparent", color: tab === t ? "#FFC629" : "#565A62" }}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-text-muted">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">{tab === "students" ? "Class" : "Role"}</th>
              <th className="px-6 py-3">Status</th>
              {tab === "students" && <th className="px-6 py-3" />}
            </tr>
          </thead>
          <tbody>
            {tab === "students"
              ? students.map((s) => (
                  <tr key={s.id} className="border-t border-border-alt">
                    <td className="px-6 py-3">{s.name}</td>
                    <td className="px-6 py-3 text-text-secondary">{s.className}</td>
                    <td className="px-6 py-3">
                      <span
                        className="rounded-pill px-3 py-1 text-xs font-semibold"
                        style={{ background: s.active ? "#E9F7EE" : "#FCEAEA", color: s.active ? "#2E8B52" : "#C74747" }}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => toggleActive(s)} className="text-xs font-semibold text-brand-link">
                        {s.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))
              : staff.map((s) => (
                  <tr key={s.id} className="border-t border-border-alt">
                    <td className="px-6 py-3">{s.name}</td>
                    <td className="px-6 py-3 text-text-secondary">{s.title}</td>
                    <td className="px-6 py-3">
                      <span
                        className="rounded-pill px-3 py-1 text-xs font-semibold"
                        style={{
                          background: s.status === "ACTIVE" ? "#E9F7EE" : "#FFF3D6",
                          color: s.status === "ACTIVE" ? "#2E8B52" : "#B07A00",
                        }}
                      >
                        {s.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
