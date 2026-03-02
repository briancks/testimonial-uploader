-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "headshotDriveId" TEXT,
    "headshotDriveUrl" TEXT,
    "videoDriveId" TEXT,
    "videoDriveUrl" TEXT,
    "transcript" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
