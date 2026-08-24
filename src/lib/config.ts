import { db } from "@/lib/db";

export async function getAppConfig() {
  return db.appConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", forceMarketOpen: false },
  });
}

export async function setForceMarketOpen(value: boolean) {
  return db.appConfig.upsert({
    where: { id: "singleton" },
    update: { forceMarketOpen: value },
    create: { id: "singleton", forceMarketOpen: value },
  });
}
