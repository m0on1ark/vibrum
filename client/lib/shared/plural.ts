export function pluralPl(count: number, one: string, few: string, many: string) {
  if (count === 1) return one;
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
    return few;
  }
  return many;
}
