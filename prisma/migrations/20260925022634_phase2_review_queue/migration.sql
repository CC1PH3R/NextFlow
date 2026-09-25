-- CreateEnum
CREATE TYPE "ReviewKind" AS ENUM ('content', 'maintenance');

-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('dependabot', 'github_action');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'merged', 'rejected');

-- CreateTable
CREATE TABLE "review_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_id" UUID NOT NULL,
    "kind" "ReviewKind" NOT NULL,
    "source" "ReviewSource" NOT NULL,
    "path" VARCHAR(500),
    "github_pr_number" INTEGER,
    "branch" VARCHAR(200),
    "submitted_by" UUID,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewer_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_workflows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_id" UUID NOT NULL,
    "workflow_file" VARCHAR(200) NOT NULL DEFAULT '.github/workflows/NextFlow-maintenance.yml',
    "last_dispatched_at" TIMESTAMPTZ(6),
    "last_dispatched_by" UUID,

    CONSTRAINT "maintenance_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_requests_site_id_github_pr_number_key" ON "review_requests"("site_id", "github_pr_number");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_workflows_site_id_key" ON "maintenance_workflows"("site_id");

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_workflows" ADD CONSTRAINT "maintenance_workflows_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_workflows" ADD CONSTRAINT "maintenance_workflows_last_dispatched_by_fkey" FOREIGN KEY ("last_dispatched_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
