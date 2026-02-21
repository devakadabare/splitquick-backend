-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "isDirect" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Group_isDirect_idx" ON "Group"("isDirect");
