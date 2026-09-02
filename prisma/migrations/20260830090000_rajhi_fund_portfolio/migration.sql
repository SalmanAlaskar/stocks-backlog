-- CreateTable
CREATE TABLE "RajhiFundAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalValueHalalas" BIGINT NOT NULL,
    "marketValueHalalas" BIGINT NOT NULL,
    "totalCashHalalas" BIGINT NOT NULL,
    "totalGainHalalas" BIGINT NOT NULL,
    "todayGainHalalas" BIGINT NOT NULL,
    "todayGainBps" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RajhiFundAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RajhiFundHolding" (
    "id" TEXT NOT NULL,
    "rajhiFundAccountId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "lastPriceHalalas" BIGINT NOT NULL,
    "avgCostHalalas" BIGINT NOT NULL,
    "marketValueHalalas" BIGINT NOT NULL,
    "gainHalalas" BIGINT NOT NULL,
    "gainBps" INTEGER NOT NULL,

    CONSTRAINT "RajhiFundHolding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RajhiFundAccount_userId_key" ON "RajhiFundAccount"("userId");

-- AddForeignKey
ALTER TABLE "RajhiFundAccount" ADD CONSTRAINT "RajhiFundAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RajhiFundHolding" ADD CONSTRAINT "RajhiFundHolding_rajhiFundAccountId_fkey" FOREIGN KEY ("rajhiFundAccountId") REFERENCES "RajhiFundAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
