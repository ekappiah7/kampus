/**
 * Seeds the Aspire Royal Academy reference tenant with data shaped after the
 * design handoff prototypes (CHILD_DATA, ROSTER, ANNOUNCEMENTS, FEE_ROWS, ...).
 * Run with `pnpm db:seed`.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  const school = await prisma.school.upsert({
    where: { subdomain: "aspire-royal" },
    update: {},
    create: {
      name: "Aspire Royal Academy",
      subdomain: "aspire-royal",
      primaryColor: "#FFC629",
      accreditation: "Ghana Education Service Accredited",
      content: {
        create: {
          heroHeadline: "Where every child's aspiration takes root.",
          heroSubcopy:
            "A nurturing basic school in Ghana guiding pupils from Crèche through Primary 6 with a safe, structured, and joyful learning environment.",
          aboutText:
            "Aspire Royal Academy has served families for over a decade, combining the Ghana Education Service curriculum with strong pastoral care.",
          admissionsText: "Admissions are open year-round for Crèche through Primary 6.",
          safetyPickupPolicy:
            "Every pickup is verified against a one-time code generated in the Parent App and confirmed at the gate by school staff before a child is released.",
          statsStudents: 340,
          statsTeachers: 28,
          statsYears: 12,
          jhsComingSoon: true,
        },
      },
    },
  });

  const classNames = [
    "Crèche",
    "Nursery 1",
    "Nursery 2",
    "KG 1",
    "KG 2",
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
  ];
  const classes = await Promise.all(
    classNames.map((name, order) =>
      prisma.class.upsert({
        where: { schoolId_name: { schoolId: school.id, name } },
        update: {},
        create: { schoolId: school.id, name, order },
      }),
    ),
  );
  const kg2 = classes.find((c) => c.name === "KG 2")!;
  const nursery2 = classes.find((c) => c.name === "Nursery 2")!;

  const subjectNames = ["Mathematics", "English Language", "Integrated Science", "Social Studies", "ICT", "French"];
  const subjects = await Promise.all(
    subjectNames.map((name) =>
      prisma.subject.upsert({
        where: { classId_name: { classId: kg2.id, name } },
        update: {},
        create: { schoolId: school.id, classId: kg2.id, name },
      }),
    ),
  );

  const now = new Date();
  const term = await prisma.term.upsert({
    where: { schoolId_name_academicYear: { schoolId: school.id, name: "Term 2", academicYear: "2025/26" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "Term 2",
      academicYear: "2025/26",
      startDate: new Date("2026-01-12"),
      endDate: new Date("2026-04-03"),
      isCurrent: true,
    },
  });

  const teacher = await prisma.staff.upsert({
    where: { schoolId_email: { schoolId: school.id, email: "abigail.bentil@aspireroyal.edu.gh" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "Mrs. Abigail Bentil",
      email: "abigail.bentil@aspireroyal.edu.gh",
      passwordHash: await hash("changeme"),
      role: "TEACHER",
      title: "Class Teacher",
      classId: kg2.id,
      phone: "024 111 2222",
    },
  });

  const admin = await prisma.staff.upsert({
    where: { schoolId_email: { schoolId: school.id, email: "collins.owusu@aspireroyal.edu.gh" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "Mr. Collins Amofa Owusu",
      email: "collins.owusu@aspireroyal.edu.gh",
      passwordHash: await hash("changeme"),
      role: "ADMIN",
      title: "Head Teacher & Administrator",
      phone: "024 333 4444",
    },
  });

  await prisma.staff.upsert({
    where: { schoolId_email: { schoolId: school.id, email: "efua.boateng@aspireroyal.edu.gh" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "Ms. Efua Boateng",
      email: "efua.boateng@aspireroyal.edu.gh",
      passwordHash: await hash("changeme"),
      role: "ADMIN",
      title: "Primary Coordinator",
      phone: "024 555 6666",
    },
  });

  await prisma.staff.upsert({
    where: { schoolId_email: { schoolId: school.id, email: "yaw.asante@aspireroyal.edu.gh" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "Mr. Yaw Asante",
      email: "yaw.asante@aspireroyal.edu.gh",
      passwordHash: await hash("changeme"),
      role: "ADMIN",
      title: "Admissions Officer",
      phone: "024 777 8888",
      status: "ON_LEAVE",
    },
  });

  const parent = await prisma.parent.upsert({
    where: { schoolId_phone: { schoolId: school.id, phone: "024 883 4000" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "Ernest Konadu Appiah",
      phone: "024 883 4000",
      email: "ernestappiahkonadu@gmail.com",
      passwordHash: await hash("changeme"),
    },
  });

  const jasiel = await prisma.student.upsert({
    where: { id: "seed-jasiel" },
    update: {},
    create: {
      id: "seed-jasiel",
      schoolId: school.id,
      classId: kg2.id,
      name: "Jasiel Oti Appiah-Konadu",
      admissionNo: "ARA-8834-JA",
      avatarInitials: "JA",
      avatarColor: "#FFD9E8",
    },
  });

  const jayla = await prisma.student.upsert({
    where: { id: "seed-jayla" },
    update: {},
    create: {
      id: "seed-jayla",
      schoolId: school.id,
      classId: nursery2.id,
      name: "Jayla Dankwaa Appiah-Konadu",
      admissionNo: "ARA-8834-JD",
      avatarInitials: "JD",
      avatarColor: "#D6E8FF",
    },
  });

  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: jasiel.id } },
    update: {},
    create: { parentId: parent.id, studentId: jasiel.id, relation: "Father", isPrimary: true },
  });
  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: jayla.id } },
    update: {},
    create: { parentId: parent.id, studentId: jayla.id, relation: "Father", isPrimary: true },
  });

  const classmateNames = ["Kwesi Danso", "Nana Yaa Frimpong", "Kojo Antwi", "Efua Asare", "Yaw Owusu"];
  const classmateColors = ["#D6E8FF", "#FFF0BF", "#EAF3EA", "#F7EAF0", "#E7F0F7"];
  const classmates = [];
  for (let i = 0; i < classmateNames.length; i++) {
    const name = classmateNames[i]!;
    const s = await prisma.student.upsert({
      where: { id: `seed-classmate-${i}` },
      update: {},
      create: {
        id: `seed-classmate-${i}`,
        schoolId: school.id,
        classId: kg2.id,
        name,
        avatarInitials: name
          .split(" ")
          .map((p) => p[0])
          .join(""),
        avatarColor: classmateColors[i],
        active: i % 4 !== 0,
      },
    });
    classmates.push(s);
  }

  // Attendance for the past few days
  const days = [
    { offset: 0, status: "PRESENT" as const },
    { offset: 3, status: "PRESENT" as const },
    { offset: 4, status: "LATE" as const },
    { offset: 5, status: "PRESENT" as const },
    { offset: 6, status: "ABSENT" as const },
    { offset: 7, status: "PRESENT" as const },
  ];
  for (const d of days) {
    const date = new Date(now);
    date.setDate(date.getDate() - d.offset);
    date.setHours(0, 0, 0, 0);
    await prisma.attendanceRecord.upsert({
      where: { studentId_date: { studentId: jasiel.id, date } },
      update: {},
      create: { studentId: jasiel.id, date, status: d.status, markedByStaffId: teacher.id },
    });
  }

  // Continuous assessment entries feeding a computed final grade per subject
  const caComponents: { type: any; label: string; weightPct: number }[] = [
    { type: "CLASSWORK", label: "Classwork average", weightPct: 15 },
    { type: "QUIZ", label: "Quiz average", weightPct: 10 },
    { type: "GROUP_WORK", label: "Group project", weightPct: 10 },
    { type: "HOMEWORK_COMPLETION", label: "Homework completion", weightPct: 5 },
    { type: "MID_TERM_EXAM", label: "Mid-term exam", weightPct: 20 },
    { type: "END_OF_TERM_EXAM", label: "End-of-term exam", weightPct: 40 },
  ];
  for (const subject of subjects) {
    for (const c of caComponents) {
      await prisma.assessmentEntry.create({
        data: {
          studentId: jasiel.id,
          subjectId: subject.id,
          termId: term.id,
          type: c.type,
          label: c.label,
          date: now,
          score: 70 + Math.round(Math.random() * 25),
          maxScore: 100,
          weightPct: c.weightPct,
          enteredByStaffId: teacher.id,
        },
      });
    }
  }

  // Homework posts (one pending admin approval, two already approved)
  const mathSubject = subjects.find((s) => s.name === "Mathematics")!;
  const pendingPost = await prisma.post.create({
    data: {
      schoolId: school.id,
      kind: "ANNOUNCEMENT",
      classId: kg2.id,
      title: "Extra reading practice",
      body: "Please read one storybook at home with your child this week and note it in the reading log.",
      authorStaffId: teacher.id,
      status: "PENDING",
    },
  });
  const approvedHomework = await prisma.post.create({
    data: {
      schoolId: school.id,
      kind: "HOMEWORK",
      classId: kg2.id,
      subject: "MATHEMATICS",
      title: "Algebra worksheet — Ch. 5",
      body: "Complete questions 1-10 on page 42.",
      dueDate: new Date(now.getTime() + 86400000),
      authorStaffId: teacher.id,
      status: "APPROVED",
      approvedByStaffId: admin.id,
      publishedAt: now,
    },
  });
  await prisma.postStudentStatus.createMany({
    data: [
      { postId: pendingPost.id, studentId: jasiel.id, status: "PENDING" },
      { postId: approvedHomework.id, studentId: jasiel.id, status: "PENDING" },
    ],
    skipDuplicates: true,
  });

  // Fee line items + student charges, with one scholarship and one discount
  const feeItemsDef = [
    { label: "Tuition", amount: 900 },
    { label: "Feeding fee", amount: 200 },
    { label: "PTA dues", amount: 50 },
    { label: "Sports & excursion", amount: 400 },
  ];
  const feeItems = [];
  for (const f of feeItemsDef) {
    const fi = await prisma.feeLineItem.create({
      data: { schoolId: school.id, classId: kg2.id, label: f.label, amount: f.amount },
    });
    feeItems.push(fi);
  }

  const scholarship = await prisma.scholarship.create({
    data: {
      studentId: jasiel.id,
      name: "JAKBRAIN Founders Scholarship",
      sponsor: "JAKBRAIN Consult",
      validFrom: term.startDate,
      validTo: term.endDate,
      coverage: {
        create: [{ feeLineItemId: feeItems[0]!.id, subsidyType: "PERCENT", subsidyValue: 25 }],
      },
    },
  });

  const discount = await prisma.discount.create({
    data: {
      studentId: jasiel.id,
      feeLineItemId: null,
      amountType: "FIXED",
      value: 50,
      recurring: false,
      termId: term.id,
      reason: "Sibling discount",
      appliedByStaffId: admin.id,
    },
  });

  for (const fi of feeItems) {
    let net = fi.amount;
    if (fi.id === feeItems[0]!.id) net = fi.amount * 0.75; // scholarship applied
    const charge = await prisma.studentFeeCharge.create({
      data: {
        studentId: jasiel.id,
        feeLineItemId: fi.id,
        termId: term.id,
        originalAmount: fi.amount,
        netAmount: net,
        status: fi.label === "Tuition" || fi.label === "Feeding fee" ? "PAID" : "PENDING",
      },
    });
    await prisma.feeLedgerEntry.create({
      data: {
        studentId: jasiel.id,
        termId: term.id,
        type: "CHARGE",
        amount: charge.netAmount,
        feeLineItemId: fi.id,
        note: `Charged ${fi.label} for ${term.name}`,
      },
    });
  }
  await prisma.feeLedgerEntry.create({
    data: {
      studentId: jasiel.id,
      termId: term.id,
      type: "SCHOLARSHIP",
      amount: -feeItems[0]!.amount * 0.25,
      feeLineItemId: feeItems[0]!.id,
      note: `${scholarship.name} — 25% off Tuition`,
    },
  });
  await prisma.feeLedgerEntry.create({
    data: {
      studentId: jasiel.id,
      termId: term.id,
      type: "DISCOUNT",
      amount: -discount.value,
      note: "Sibling discount",
      createdByStaffId: admin.id,
    },
  });

  // Pickup notice example
  await prisma.pickupNotice.create({
    data: {
      studentId: jasiel.id,
      requestedByParentId: parent.id,
      pickupPersonName: "Auntie Akosua",
      relation: "Family member",
      code: "PK-7731",
      status: "PENDING",
    },
  });

  // Parent Voice
  await prisma.parentVoiceSubmission.create({
    data: {
      schoolId: school.id,
      parentId: parent.id,
      category: "HONOUR_A_TEACHER",
      aboutStaffName: teacher.name,
      message: "Mrs. Bentil has been wonderful with Jasiel — he talks about her class every day. Thank you!",
    },
  });

  // Events & cafeteria
  const events = [
    { title: "PTA General Meeting", date: "2026-08-22", time: "9:00am · Main Hall" },
    { title: "New Term Begins", date: "2026-09-03", time: "7:30am · All Levels" },
    { title: "Inter-House Sports", date: "2026-09-19", time: "8:00am · School Field" },
    { title: "Mid-Term Assessment", date: "2026-09-25", time: "All Day · Primary" },
    { title: "Career Day", date: "2026-10-02", time: "10:00am · Main Hall" },
  ];
  for (const e of events) {
    await prisma.event.create({
      data: { schoolId: school.id, title: e.title, date: new Date(e.date), time: e.time },
    });
  }

  const menu = [
    { dayOfWeek: "MONDAY", main: "Jollof Rice & Chicken", side: "Coleslaw · Water" },
    { dayOfWeek: "TUESDAY", main: "Banku & Tilapia", side: "Pepper sauce · Juice" },
    { dayOfWeek: "WEDNESDAY", main: "Waakye & Fish", side: "Boiled egg · Water" },
    { dayOfWeek: "THURSDAY", main: "Fried Rice & Beef", side: "Salad · Juice" },
    { dayOfWeek: "FRIDAY", main: "Yam & Palava Sauce", side: "Fruit · Water" },
  ];
  for (const m of menu) {
    await prisma.cafeteriaMenuItem.upsert({
      where: { schoolId_dayOfWeek: { schoolId: school.id, dayOfWeek: m.dayOfWeek } },
      update: {},
      create: { schoolId: school.id, ...m },
    });
  }

  console.log(`Seeded ${school.name} (${school.subdomain}) with ${classes.length} classes, ${classmates.length + 2} students.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
