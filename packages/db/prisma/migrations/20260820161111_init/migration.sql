-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'ENROLLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('TEACHER', 'ADMIN', 'GATE_STAFF');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('CLASSWORK', 'QUIZ', 'GROUP_WORK', 'PROJECT', 'HOMEWORK_COMPLETION', 'MID_TERM_EXAM', 'END_OF_TERM_EXAM');

-- CreateEnum
CREATE TYPE "PostKind" AS ENUM ('HOMEWORK', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "PostAudience" AS ENUM ('WHOLE_SCHOOL', 'BY_LEVEL');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('PENDING', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "FeeChargeStatus" AS ENUM ('PAID', 'PENDING', 'OVERDUE');

-- CreateEnum
CREATE TYPE "SubsidyType" AS ENUM ('FIXED', 'PERCENT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MOMO_MTN', 'MOMO_VODAFONE', 'MOMO_AIRTELTIGO', 'CARD', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CHARGE', 'PAYMENT', 'SCHOLARSHIP', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "VoiceCategory" AS ENUM ('SUGGESTION', 'COMPLAINT', 'HONOUR_A_TEACHER', 'GENERAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ANNOUNCEMENT', 'HOMEWORK', 'GRADE_POSTED', 'FEE_REMINDER', 'PICKUP_CONFIRMED', 'POST_APPROVED', 'VOICE_RESPONSE');

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "subdomain" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#FFC629',
    "logoUrl" TEXT,
    "whatsappPhone" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "officeHours" TEXT,
    "accreditation" TEXT,
    "gesRegNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_content" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "heroEyebrow" TEXT,
    "heroHeadline" TEXT,
    "heroSubcopy" TEXT,
    "aboutEyebrow" TEXT,
    "aboutHeading" TEXT,
    "aboutText" TEXT,
    "aboutTextSecondary" TEXT,
    "missionText" TEXT,
    "visionText" TEXT,
    "academicsHeading" TEXT,
    "academicsSubcopy" TEXT,
    "admissionsHeading" TEXT,
    "admissionsText" TEXT,
    "safetyHeading" TEXT,
    "safetySubcopy" TEXT,
    "feesNote" TEXT,
    "voiceText" TEXT,
    "footerBlurb" TEXT,
    "statsStudents" INTEGER,
    "statsTeachers" INTEGER,
    "statsYears" INTEGER,
    "teacherRatio" TEXT,
    "maxClassSize" TEXT,

    CONSTRAINT "school_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programmes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ageRange" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "tint" TEXT,
    "comingSoon" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_policies" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "safety_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_badges" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "trust_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_steps" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "admission_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_inquiries" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "childAge" TEXT,
    "interestedLevel" TEXT,
    "message" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "accessCode" TEXT,
    "mustSetPassword" BOOLEAN NOT NULL DEFAULT true,
    "role" "StaffRole" NOT NULL,
    "title" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "classId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT,
    "accessCode" TEXT,
    "mustSetPassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_students" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "parent_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "admissionNo" TEXT,
    "avatarInitials" TEXT,
    "avatarColor" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "monitored" BOOLEAN NOT NULL DEFAULT false,
    "dateOfBirth" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "markedByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "teacherRemark" TEXT,
    "headTeacherRemark" TEXT,
    "conduct" TEXT,
    "attitude" TEXT,
    "interest" TEXT,
    "classPosition" INTEGER,
    "classSize" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "nextTermBegins" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_entries" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "label" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "weightPct" DOUBLE PRECISION NOT NULL,
    "enteredByStaffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" "PostKind" NOT NULL,
    "audience" "PostAudience" NOT NULL DEFAULT 'BY_LEVEL',
    "classId" TEXT,
    "subject" TEXT,
    "tag" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "dueDate" DATE,
    "authorStaffId" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'PENDING',
    "approvedByStaffId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_student_statuses" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "HomeworkStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "post_student_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_line_items" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "fee_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_fee_charges" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeLineItemId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "status" "FeeChargeStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "student_fee_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarships" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sponsor" TEXT,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_coverage" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "feeLineItemId" TEXT NOT NULL,
    "subsidyType" "SubsidyType" NOT NULL,
    "subsidyValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "scholarship_coverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeLineItemId" TEXT,
    "amountType" "SubsidyType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "termId" TEXT,
    "reason" TEXT NOT NULL,
    "appliedByStaffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "confirmedByStaffId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_ledger_entries" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "feeLineItemId" TEXT,
    "paymentId" TEXT,
    "note" TEXT,
    "createdByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_notices" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "requestedByParentId" TEXT NOT NULL,
    "pickupPersonName" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "pickupTime" TEXT,
    "code" TEXT NOT NULL,
    "status" "PickupStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedByStaffId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickup_notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_voice_submissions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorName" TEXT,
    "category" "VoiceCategory" NOT NULL,
    "aboutStaffName" TEXT,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "adminResponse" TEXT,
    "respondedByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_voice_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "parentId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT,
    "location" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cafeteria_menu_items" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "main" TEXT NOT NULL,
    "side" TEXT,

    CONSTRAINT "cafeteria_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "relation" TEXT,
    "quote" TEXT NOT NULL,
    "photoUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderStaffId" TEXT,
    "senderParentId" TEXT,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_subdomain_key" ON "schools"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "school_content_schoolId_key" ON "school_content"("schoolId");

-- CreateIndex
CREATE INDEX "programmes_schoolId_idx" ON "programmes"("schoolId");

-- CreateIndex
CREATE INDEX "safety_policies_schoolId_idx" ON "safety_policies"("schoolId");

-- CreateIndex
CREATE INDEX "trust_badges_schoolId_idx" ON "trust_badges"("schoolId");

-- CreateIndex
CREATE INDEX "admission_steps_schoolId_idx" ON "admission_steps"("schoolId");

-- CreateIndex
CREATE INDEX "admission_inquiries_schoolId_status_idx" ON "admission_inquiries"("schoolId", "status");

-- CreateIndex
CREATE INDEX "gallery_images_schoolId_idx" ON "gallery_images"("schoolId");

-- CreateIndex
CREATE INDEX "audit_logs_schoolId_createdAt_idx" ON "audit_logs"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "staff_accessCode_key" ON "staff"("accessCode");

-- CreateIndex
CREATE INDEX "staff_schoolId_idx" ON "staff"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_schoolId_email_key" ON "staff"("schoolId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "parents_accessCode_key" ON "parents"("accessCode");

-- CreateIndex
CREATE INDEX "parents_schoolId_idx" ON "parents"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "parents_schoolId_phone_key" ON "parents"("schoolId", "phone");

-- CreateIndex
CREATE INDEX "parent_students_studentId_idx" ON "parent_students"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "parent_students_parentId_studentId_key" ON "parent_students"("parentId", "studentId");

-- CreateIndex
CREATE INDEX "classes_schoolId_idx" ON "classes"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "classes_schoolId_name_key" ON "classes"("schoolId", "name");

-- CreateIndex
CREATE INDEX "subjects_schoolId_idx" ON "subjects"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_classId_name_key" ON "subjects"("classId", "name");

-- CreateIndex
CREATE INDEX "terms_schoolId_idx" ON "terms"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "terms_schoolId_name_academicYear_key" ON "terms"("schoolId", "name", "academicYear");

-- CreateIndex
CREATE INDEX "students_schoolId_classId_idx" ON "students"("schoolId", "classId");

-- CreateIndex
CREATE INDEX "attendance_records_studentId_idx" ON "attendance_records"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_studentId_date_key" ON "attendance_records"("studentId", "date");

-- CreateIndex
CREATE INDEX "report_cards_termId_idx" ON "report_cards"("termId");

-- CreateIndex
CREATE UNIQUE INDEX "report_cards_studentId_termId_key" ON "report_cards"("studentId", "termId");

-- CreateIndex
CREATE INDEX "assessment_entries_studentId_subjectId_termId_idx" ON "assessment_entries"("studentId", "subjectId", "termId");

-- CreateIndex
CREATE INDEX "posts_schoolId_classId_idx" ON "posts"("schoolId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "post_student_statuses_postId_studentId_key" ON "post_student_statuses"("postId", "studentId");

-- CreateIndex
CREATE INDEX "fee_line_items_schoolId_classId_idx" ON "fee_line_items"("schoolId", "classId");

-- CreateIndex
CREATE INDEX "student_fee_charges_studentId_termId_idx" ON "student_fee_charges"("studentId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "student_fee_charges_studentId_feeLineItemId_termId_key" ON "student_fee_charges"("studentId", "feeLineItemId", "termId");

-- CreateIndex
CREATE INDEX "scholarships_studentId_idx" ON "scholarships"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "scholarship_coverage_scholarshipId_feeLineItemId_key" ON "scholarship_coverage"("scholarshipId", "feeLineItemId");

-- CreateIndex
CREATE INDEX "discounts_studentId_idx" ON "discounts"("studentId");

-- CreateIndex
CREATE INDEX "payments_studentId_idx" ON "payments"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_ledger_entries_paymentId_key" ON "fee_ledger_entries"("paymentId");

-- CreateIndex
CREATE INDEX "fee_ledger_entries_studentId_termId_idx" ON "fee_ledger_entries"("studentId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_notices_code_key" ON "pickup_notices"("code");

-- CreateIndex
CREATE INDEX "pickup_notices_studentId_idx" ON "pickup_notices"("studentId");

-- CreateIndex
CREATE INDEX "pickup_notices_code_idx" ON "pickup_notices"("code");

-- CreateIndex
CREATE INDEX "parent_voice_submissions_schoolId_idx" ON "parent_voice_submissions"("schoolId");

-- CreateIndex
CREATE INDEX "notifications_schoolId_parentId_idx" ON "notifications"("schoolId", "parentId");

-- CreateIndex
CREATE INDEX "events_schoolId_idx" ON "events"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "cafeteria_menu_items_schoolId_dayOfWeek_key" ON "cafeteria_menu_items"("schoolId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "message_threads_schoolId_idx" ON "message_threads"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "message_threads_staffId_parentId_key" ON "message_threads"("staffId", "parentId");

-- CreateIndex
CREATE INDEX "messages_threadId_idx" ON "messages"("threadId");

-- AddForeignKey
ALTER TABLE "school_content" ADD CONSTRAINT "school_content_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_policies" ADD CONSTRAINT "safety_policies_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_badges" ADD CONSTRAINT "trust_badges_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_steps" ADD CONSTRAINT "admission_steps_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiries" ADD CONSTRAINT "admission_inquiries_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_markedByStaffId_fkey" FOREIGN KEY ("markedByStaffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_entries" ADD CONSTRAINT "assessment_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_entries" ADD CONSTRAINT "assessment_entries_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_entries" ADD CONSTRAINT "assessment_entries_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_entries" ADD CONSTRAINT "assessment_entries_enteredByStaffId_fkey" FOREIGN KEY ("enteredByStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorStaffId_fkey" FOREIGN KEY ("authorStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_approvedByStaffId_fkey" FOREIGN KEY ("approvedByStaffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_student_statuses" ADD CONSTRAINT "post_student_statuses_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_student_statuses" ADD CONSTRAINT "post_student_statuses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_line_items" ADD CONSTRAINT "fee_line_items_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_line_items" ADD CONSTRAINT "fee_line_items_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_charges" ADD CONSTRAINT "student_fee_charges_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_charges" ADD CONSTRAINT "student_fee_charges_feeLineItemId_fkey" FOREIGN KEY ("feeLineItemId") REFERENCES "fee_line_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_charges" ADD CONSTRAINT "student_fee_charges_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_coverage" ADD CONSTRAINT "scholarship_coverage_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "scholarships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_coverage" ADD CONSTRAINT "scholarship_coverage_feeLineItemId_fkey" FOREIGN KEY ("feeLineItemId") REFERENCES "fee_line_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_feeLineItemId_fkey" FOREIGN KEY ("feeLineItemId") REFERENCES "fee_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_appliedByStaffId_fkey" FOREIGN KEY ("appliedByStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_ledger_entries" ADD CONSTRAINT "fee_ledger_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_ledger_entries" ADD CONSTRAINT "fee_ledger_entries_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_ledger_entries" ADD CONSTRAINT "fee_ledger_entries_feeLineItemId_fkey" FOREIGN KEY ("feeLineItemId") REFERENCES "fee_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_ledger_entries" ADD CONSTRAINT "fee_ledger_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_ledger_entries" ADD CONSTRAINT "fee_ledger_entries_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_notices" ADD CONSTRAINT "pickup_notices_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_notices" ADD CONSTRAINT "pickup_notices_requestedByParentId_fkey" FOREIGN KEY ("requestedByParentId") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_notices" ADD CONSTRAINT "pickup_notices_confirmedByStaffId_fkey" FOREIGN KEY ("confirmedByStaffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_voice_submissions" ADD CONSTRAINT "parent_voice_submissions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_voice_submissions" ADD CONSTRAINT "parent_voice_submissions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_voice_submissions" ADD CONSTRAINT "parent_voice_submissions_respondedByStaffId_fkey" FOREIGN KEY ("respondedByStaffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cafeteria_menu_items" ADD CONSTRAINT "cafeteria_menu_items_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderStaffId_fkey" FOREIGN KEY ("senderStaffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderParentId_fkey" FOREIGN KEY ("senderParentId") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
