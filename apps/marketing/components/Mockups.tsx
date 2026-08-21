/**
 * Product mockups drawn in markup rather than dropped in as screenshots.
 *
 * A screenshot goes stale the week after it's taken, needs retaking at every
 * resolution, and — on a site whose whole argument is "we built this properly" —
 * arrives as a blurry JPEG. These render sharp at any size, restyle with the design
 * tokens, and stay honest because they're built from the same numbers the real
 * screens show.
 *
 * They are illustrations, not live components. Anything shown here must be
 * something the product genuinely does.
 */

const shell =
  "rounded-[18px] border border-border bg-white shadow-[0_18px_50px_-24px_rgba(42,44,48,0.35)] overflow-hidden";

function BrowserChrome({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-[#F7F6F3] px-3.5 py-2.5">
      <span className="flex gap-1.5">
        {["#E5E2DA", "#E5E2DA", "#E5E2DA"].map((c, i) => (
          <span key={i} className="block h-2 w-2 rounded-full" style={{ background: c }} />
        ))}
      </span>
      <span className="ml-1 truncate rounded-md bg-white px-2.5 py-1 text-[10.5px] font-semibold text-text-muted">{label}</span>
    </div>
  );
}

/** The fee overview — the screen a proprietor cares about most. */
export function FeesMockup() {
  const rows = [
    { name: "Ama Osei", cls: "Basic 3", billed: "1,090", paid: "1,090", balance: "0", tone: "green", status: "Paid" },
    { name: "Kofi Antwi", cls: "Basic 3", billed: "1,090", paid: "600", balance: "490", tone: "amber", status: "Part-paid" },
    { name: "Yaa Mensah", cls: "Basic 3", billed: "1,030", paid: "1,090", balance: "+60", tone: "green", status: "In credit" },
    { name: "Kwame Boadi", cls: "Basic 3", billed: "1,090", paid: "0", balance: "1,090", tone: "red", status: "Outstanding" },
  ];
  const tones: Record<string, { bg: string; fg: string }> = {
    green: { bg: "#E9F7EE", fg: "#2E8B52" },
    amber: { bg: "#FFF3D6", fg: "#B07A00" },
    red: { bg: "#FCEAEA", fg: "#C74747" },
  };

  return (
    <div className={shell}>
      <BrowserChrome label="Staff Portal — Fees" />
      <div className="p-4">
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { l: "EXPECTED", v: "₵ 43,600", c: "#22242A" },
            { l: "COLLECTED", v: "₵ 31,180", c: "#2E8B52" },
            { l: "OUTSTANDING", v: "₵ 12,420", c: "#C74747" },
          ].map((s) => (
            <div key={s.l} className="rounded-[12px] bg-bg px-3 py-2.5">
              <p className="text-[8.5px] font-bold tracking-wide text-text-muted">{s.l}</p>
              <p className="font-display text-[15px] font-bold" style={{ color: s.c }}>
                {s.v}
              </p>
            </div>
          ))}
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-bg">
              {["PUPIL", "BILLED", "PAID", "BALANCE", ""].map((h) => (
                <th key={h} className="px-2.5 py-2 text-[8.5px] font-bold text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-[#F0F0EE] last:border-0">
                <td className="px-2.5 py-2">
                  <span className="block text-[10.5px] font-bold">{r.name}</span>
                  <span className="block text-[8.5px] text-text-muted">{r.cls}</span>
                </td>
                <td className="px-2.5 py-2 text-[10px] text-text-secondary">{r.billed}</td>
                <td className="px-2.5 py-2 text-[10px] text-[#2E8B52]">{r.paid}</td>
                <td className="px-2.5 py-2 text-[10.5px] font-bold" style={{ color: r.balance.startsWith("+") ? "#2E8B52" : undefined }}>
                  {r.balance}
                </td>
                <td className="px-2.5 py-2">
                  <span
                    className="rounded-pill px-2 py-0.5 text-[8.5px] font-bold"
                    style={{ background: tones[r.tone]!.bg, color: tones[r.tone]!.fg }}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The Excel mark sheet, shown as the spreadsheet a teacher actually opens. */
export function MarkSheetMockup() {
  const pupils = [
    ["1", "Ama Osei", "18", "76"],
    ["2", "Kofi Antwi", "14", "91"],
    ["3", "Yaa Mensah", "17", "68"],
    ["4", "Kwame Boadi", "", ""],
  ];
  return (
    <div className={shell}>
      <div className="flex items-center gap-2 border-b border-border bg-[#217346] px-3.5 py-2.5">
        <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white">X</span>
        <span className="truncate text-[10.5px] font-semibold text-white/90">Basic-3-Mathematics-First-Term-marks.xlsx</span>
      </div>
      <div className="bg-white p-3">
        <p className="text-center font-display text-[12px] font-bold">Aspire Royal Academy</p>
        <p className="mb-2.5 text-center text-[9px] font-semibold text-text-secondary">
          Basic 3 · Mathematics · First Term 2025/2026
        </p>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {[
                { l: "#", w: "8%" },
                { l: "Pupil name", w: "42%" },
                { l: "Class Exercise 1", s: "out of 20 · 30%", w: "25%" },
                { l: "End of Term Exam", s: "out of 100 · 70%", w: "25%" },
              ].map((h) => (
                <th
                  key={h.l}
                  style={{ width: h.w, background: "#FFC629" }}
                  className="border border-[#E5E2DA] px-1.5 py-1.5 align-middle text-[8.5px] font-bold leading-tight text-text-primary"
                >
                  {h.l}
                  {h.s && <span className="block text-[7px] font-semibold opacity-70">{h.s}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pupils.map((r, i) => (
              <tr key={r[1]} style={{ background: i % 2 ? "#F7F6F3" : "#fff" }}>
                <td className="border border-[#EEEBE3] px-1.5 py-1.5 text-center text-[9px] text-text-muted">{r[0]}</td>
                <td className="border border-[#EEEBE3] px-1.5 py-1.5 text-[9.5px] font-bold">{r[1]}</td>
                {[r[2], r[3]].map((v, j) => (
                  <td key={j} className="border border-[#EEEBE3] bg-[#FFFBEC] px-1.5 py-1.5 text-center text-[9.5px] font-semibold">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[8px] italic text-text-muted">
          Type a score above 20 in that column and Excel refuses it.
        </p>
      </div>
    </div>
  );
}

/** The parent app, in a phone frame. */
export function ParentMockup() {
  return (
    <div className="mx-auto w-full max-w-[210px] rounded-[26px] border-[6px] border-[#2A2C30] bg-[#2A2C30] shadow-[0_22px_50px_-20px_rgba(42,44,48,0.5)]">
      <div className="overflow-hidden rounded-[20px] bg-bg">
        <div className="flex items-center justify-between bg-white px-3 py-2">
          <span className="font-display text-[11px] font-bold">Fees</span>
          <span className="h-4 w-4 rounded-full bg-brand" />
        </div>
        <div className="p-2.5">
          <div className="mb-2 rounded-[13px] bg-dark-pill p-3 text-white">
            <p className="text-[7.5px] font-semibold text-[#C9CCD1]">OUTSTANDING BALANCE</p>
            <p className="font-display text-[19px] font-bold leading-none">₵ 490.00</p>
            <p className="mt-1 text-[7.5px] text-[#9EA2A9]">First Term 2025/2026</p>
            <div className="mt-2 rounded-[8px] bg-brand py-1.5 text-center text-[9px] font-bold text-text-primary">Pay Now</div>
          </div>
          <p className="mb-1.5 text-[8.5px] font-bold">Itemised fees</p>
          {[
            { l: "Tuition", v: "₵ 850.00", s: "Paid", t: "#E9F7EE", c: "#2E8B52" },
            { l: "Feeding fee", v: "₵ 240.00", s: "Pending", t: "#FFF3D6", c: "#B07A00" },
            { l: "PTA dues", v: "₵ 50.00", s: "Pending", t: "#FFF3D6", c: "#B07A00" },
          ].map((f) => (
            <div key={f.l} className="mb-1 flex items-center gap-2 rounded-[9px] bg-white px-2.5 py-2">
              <span className="flex-1">
                <span className="block text-[9px] font-bold">{f.l}</span>
                <span className="block text-[8px] text-text-muted">{f.v}</span>
              </span>
              <span className="rounded-pill px-1.5 py-0.5 text-[7px] font-bold" style={{ background: f.t, color: f.c }}>
                {f.s}
              </span>
            </div>
          ))}
          <div className="mt-2 rounded-[9px] bg-[#FFF7DF] px-2.5 py-2">
            <p className="text-[8px] font-semibold leading-snug text-[#8A6200]">
              ₵60 in credit — carried to your next bill
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The import preview — the screen that makes the Excel round trip trustworthy. */
export function ImportPreviewMockup() {
  return (
    <div className={shell}>
      <BrowserChrome label="Staff Portal — Grades" />
      <div className="p-4">
        <p className="mb-2 text-[9px] font-bold tracking-wide text-text-muted">3 · CHECK, THEN SAVE</p>
        <div className="mb-2.5 grid grid-cols-3 gap-1.5">
          {[
            { l: "To change", v: "37", c: "#22242A" },
            { l: "Unchanged", v: "11", c: "#6B6F76" },
            { l: "Problems", v: "2", c: "#C74747" },
          ].map((s) => (
            <div key={s.l} className="rounded-[10px] bg-bg py-2 text-center">
              <p className="font-display text-[15px] font-bold" style={{ color: s.c }}>
                {s.v}
              </p>
              <p className="text-[8px] font-semibold text-text-muted">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="mb-2 rounded-[9px] bg-danger-tint px-2.5 py-2">
          <p className="text-[8.5px] font-bold text-danger">Fix these in the file first:</p>
          <p className="text-[8px] leading-snug text-danger">Kwame Boadi — Class Exercise 1: 25 is above the maximum of 20</p>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-border">
          <table className="w-full text-left">
            <thead className="bg-bg">
              <tr>
                {["PUPIL", "ASSESSMENT", "FROM", "TO"].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[8px] font-bold text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Ama Osei", "End of Term Exam", "—", "76"],
                ["Kofi Antwi", "End of Term Exam", "88", "91"],
                ["Yaa Mensah", "Class Exercise 1", "—", "17"],
              ].map((r) => (
                <tr key={r[0]} className="border-t border-[#F0F0EE]">
                  <td className="px-2 py-1.5 text-[9px] font-semibold">{r[0]}</td>
                  <td className="px-2 py-1.5 text-[9px] text-text-secondary">{r[1]}</td>
                  <td className="px-2 py-1.5 text-[9px] text-text-muted">{r[2]}</td>
                  <td className="px-2 py-1.5 text-[9px] font-bold">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2.5 rounded-[9px] bg-brand py-2 text-center text-[9.5px] font-bold text-text-primary">
          Save 37 scores
        </div>
      </div>
    </div>
  );
}
