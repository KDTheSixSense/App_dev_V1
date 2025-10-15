-- AddForeignKey
ALTER TABLE "Submissions" ADD CONSTRAINT "Submissions_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
