-- CreateTable
CREATE TABLE "AbianAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketValueHalalas" BIGINT NOT NULL,
    "returnsSinceInceptionHalalas" BIGINT NOT NULL,
    "currentReturnHalalas" BIGINT NOT NULL,
    "currentReturnBps" INTEGER NOT NULL,
    "savingsHalalas" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbianAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbianFund" (
    "id" TEXT NOT NULL,
    "abianAccountId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "valueHalalas" BIGINT NOT NULL,

    CONSTRAINT "AbianFund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbianAccount_userId_key" ON "AbianAccount"("userId");

-- AddForeignKey
ALTER TABLE "AbianAccount" ADD CONSTRAINT "AbianAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbianFund" ADD CONSTRAINT "AbianFund_abianAccountId_fkey" FOREIGN KEY ("abianAccountId") REFERENCES "AbianAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
