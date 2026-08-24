import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const db = new PrismaClient({ adapter });

const sar = (n: number) => BigInt(Math.round(n * 100));

const STOCKS = [
  // Prices below reflect a recent real snapshot for authenticity (public market data).
  { ticker: "2222", nameEn: "Saudi Aramco", nameAr: "أرامكو السعودية", sector: "Energy", shariah: true, price: 26.48, pe: 14.2, div: 380 },
  { ticker: "1120", nameEn: "Al Rajhi Bank", nameAr: "مصرف الراجحي", sector: "Banks", shariah: true, price: 66.75, pe: 16.8, div: 210 },
  { ticker: "2010", nameEn: "SABIC", nameAr: "سابك", sector: "Materials", shariah: true, price: 50.55, pe: 22.1, div: 150 },
  { ticker: "1180", nameEn: "Saudi National Bank", nameAr: "البنك الأهلي السعودي", sector: "Banks", shariah: false, price: 34.10, pe: 11.4, div: 260 },
  { ticker: "7010", nameEn: "stc", nameAr: "الاتصالات السعودية", sector: "Telecommunication Services", shariah: true, price: 44.48, pe: 15.9, div: 340 },
  { ticker: "2280", nameEn: "Almarai", nameAr: "المراعي", sector: "Food & Beverages", shariah: true, price: 58.40, pe: 24.5, div: 120 },
  { ticker: "1211", nameEn: "Ma'aden", nameAr: "معادن", sector: "Materials", shariah: true, price: 52.60, pe: 28.3, div: 60 },
  { ticker: "4030", nameEn: "Bahri", nameAr: "البحري", sector: "Transportation", shariah: true, price: 30.20, pe: 12.7, div: 300 },
  { ticker: "4300", nameEn: "Dar Al Arkan", nameAr: "دار الأركان", sector: "Real Estate", shariah: false, price: 16.80, pe: 9.8, div: 0 },
  { ticker: "1050", nameEn: "Banque Saudi Fransi", nameAr: "البنك السعودي الفرنسي", sector: "Banks", shariah: false, price: 33.90, pe: 10.6, div: 290 },
  { ticker: "2350", nameEn: "Saudi Kayan", nameAr: "كيان السعودية", sector: "Materials", shariah: true, price: 12.40, pe: 0, div: 0 },
  { ticker: "2380", nameEn: "Petro Rabigh", nameAr: "بترورابغ", sector: "Energy", shariah: true, price: 14.90, pe: 0, div: 0 },
  { ticker: "4002", nameEn: "Mouwasat Medical Services", nameAr: "مواساة للخدمات الطبية", sector: "Healthcare", shariah: true, price: 110.00, pe: 26.4, div: 180 },
  { ticker: "2050", nameEn: "Savola Group", nameAr: "مجموعة صافولا", sector: "Food & Beverages", shariah: true, price: 38.70, pe: 19.2, div: 140 },
  { ticker: "4061", nameEn: "Anaam International Holding", nameAr: "مجموعة أناعم الدولية القابضة", sector: "Consumer Discretionary", shariah: true, price: 22.10, pe: 17.5, div: 90 },
  { ticker: "3030", nameEn: "Saudi Ceramics", nameAr: "السيراميك السعودية", sector: "Materials", shariah: true, price: 28.74, pe: 15.1, div: 100 },
  { ticker: "5110", nameEn: "Saudi Electricity Company", nameAr: "الشركة السعودية للكهرباء", sector: "Utilities", shariah: true, price: 17.03, pe: 19.4, div: 130 },
  { ticker: "2330", nameEn: "Advanced Petrochemical Company", nameAr: "المتقدمة للبتروكيماويات", sector: "Materials", shariah: true, price: 25.28, pe: 20.6, div: 170 },
  { ticker: "4190", nameEn: "Jarir Marketing Company", nameAr: "شركة جرير للتسويق", sector: "Consumer Discretionary", shariah: true, price: 17.03, pe: 18.9, div: 220 },
];

async function main() {
  for (const s of STOCKS) {
    const basePrice = sar(s.price);
    const fields = {
      nameEn: s.nameEn,
      nameAr: s.nameAr,
      sector: s.sector,
      shariahCompliant: s.shariah,
      basePriceHalalas: basePrice,
      previousCloseHalalas: basePrice,
      peRatio: s.pe || null,
      marketCapHalalas: basePrice * BigInt(1_000_000_000),
      dividendYieldBps: s.div,
      week52LowHalalas: sar(s.price * 0.72),
      week52HighHalalas: sar(s.price * 1.28),
    };
    await db.stock.upsert({
      where: { ticker: s.ticker },
      update: fields,
      create: { ticker: s.ticker, ...fields },
    });
  }

  const NEWS: Record<string, string[]> = {
    "2222": [
      "Saudi Aramco reports quarterly results in line with analyst expectations",
      "Aramco announces continued investment in downstream capacity",
    ],
    "2010": [
      "SABIC outlines cost-efficiency program amid softer petrochemical margins",
      "SABIC signs new feedstock supply agreement",
    ],
    "7010": [
      "stc Group reports growth in data and digital services revenue",
      "stc expands 5G network coverage across the Kingdom",
    ],
    "1120": [
      "Al Rajhi Bank reports higher net income on financing growth",
      "Al Rajhi Bank expands digital banking services",
    ],
  };
  for (const [ticker, headlines] of Object.entries(NEWS)) {
    const stock = await db.stock.findUnique({ where: { ticker } });
    if (!stock) continue;
    const existingNews = await db.newsItem.count({ where: { stockId: stock.id } });
    if (existingNews > 0) continue;
    await db.newsItem.createMany({
      data: headlines.map((headline, i) => ({
        stockId: stock.id,
        headline,
        source: i === 0 ? "Argaam" : "Al Eqtisadiah",
        publishedAt: new Date(Date.now() - i * 86400000),
      })),
    });
  }

  const existingIpo = await db.ipo.findFirst({ where: { companyNameEn: "Nusuk Retail Holding" } });
  if (!existingIpo) {
    await db.ipo.create({
      data: {
        companyNameEn: "Nusuk Retail Holding",
        companyNameAr: "مجموعة نسك للتجزئة",
        offerPriceHalalas: sar(20),
        subscriptionStart: new Date(Date.now() - 2 * 86400000),
        subscriptionEnd: new Date(Date.now() + 3 * 86400000),
        perInvestorCapHalalas: sar(500_000),
        status: "OPEN",
      },
    });
  }

  await db.appConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", forceMarketOpen: false },
  });

  console.log(`Seeded ${STOCKS.length} stocks, sample news, 1 IPO, and app config.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
