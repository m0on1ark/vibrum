export const BANK_TYPES = ["PKO_BP", "MBANK", "REVOLUT", "MINIBANK"] as const;

export type BankType = (typeof BANK_TYPES)[number];

export type BankAccount = {
  id: number;
  accountName: string;
  bankType: BankType;
  baseCurrency: string;
};

export type ImportResult = {
  importedCount: number;
  skippedDuplicatesCount: number;
};

export const BANK_TYPE_LABELS: Record<BankType, string> = {
  PKO_BP: "PKO BP",
  MBANK: "mBank",
  REVOLUT: "Revolut",
  MINIBANK: "miniBank",
};

export const IMPORT_FORMAT_META: Partial<
  Record<BankType, { label: string; accept: string; hint?: string }>
> = {
  PKO_BP: { label: "CSV (PKO BP)", accept: ".csv,text/csv" },
  MBANK: { label: "CSV (mBank)", accept: ".csv,text/csv" },
  REVOLUT: {
    label: "Revolut CSV / JSON",
    accept: ".csv,.json,text/csv,application/json",
    hint: "Plik .csv lub .json z eksportem transakcji Revolut",
  },
};
