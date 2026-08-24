# Financial statement summaries

Research notes on the real financial statements of the TASI-listed companies backing this demo's
seeded portfolio. Each file was compiled by searching company investor-relations pages, Tadawul/
Saudi Exchange disclosures, and reputable aggregators (Argaam, Mubasher, StockAnalysis.com) —
figures are cited to source URLs, and anything that couldn't be verified is marked "Not found"
rather than estimated. **Informational/demo purposes only — not investment advice.**

| Ticker | Company | File |
|---|---|---|
| 2010 | SABIC | [2010-SABIC.md](2010-SABIC.md) |
| 2222 | Saudi Aramco | [2222-Saudi-Aramco.md](2222-Saudi-Aramco.md) |
| 7010 | stc | [7010-stc.md](7010-stc.md) |
| 3030 | Saudi Cement Company | [3030-Saudi-Cement.md](3030-Saudi-Cement.md) |
| 5110 | Saudi Electricity Company (now "Saudi Energy") | [5110-Saudi-Electricity.md](5110-Saudi-Electricity.md) |
| 1120 | Al Rajhi Bank | [1120-Al-Rajhi-Bank.md](1120-Al-Rajhi-Bank.md) |
| 2330 | Advanced Petrochemical Company | [2330-Advanced-Petrochemical.md](2330-Advanced-Petrochemical.md) |
| 4190 | Jarir Marketing Company | [4190-Jarir-Marketing.md](4190-Jarir-Marketing.md) |

## Ticker correction

The app's original seed data mislabeled ticker **3030** as "Saudi Ceramics." Research confirmed
that **3030 is actually Saudi Cement Company** — Saudi Ceramic Company's real Tadawul ticker is
**2040**. `prisma/seed.ts` has been corrected accordingly. Saudi Ceramic Company's own financials
(ticker 2040, researched before the mix-up was caught) are kept for reference at
[2040-Saudi-Ceramics.md](2040-Saudi-Ceramics.md) even though it isn't part of the app's seeded list.
