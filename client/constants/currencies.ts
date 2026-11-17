// NBP exchange rate table A plus PLN.
export const CURRENCIES = [
  { code: "PLN", name: "złoty polski" },
  { code: "EUR", name: "euro" },
  { code: "USD", name: "dolar amerykański" },
  { code: "GBP", name: "funt szterling" },
  { code: "CHF", name: "frank szwajcarski" },
  { code: "CZK", name: "korona czeska" },
  { code: "NOK", name: "korona norweska" },
  { code: "SEK", name: "korona szwedzka" },
  { code: "DKK", name: "korona duńska" },
  { code: "ISK", name: "korona islandzka" },
  { code: "HUF", name: "forint (Węgry)" },
  { code: "RON", name: "lej rumuński" },
  { code: "BGN", name: "lew (Bułgaria)" },
  { code: "UAH", name: "hrywna (Ukraina)" },
  { code: "TRY", name: "lira turecka" },
  { code: "ILS", name: "nowy izraelski szekel" },
  { code: "JPY", name: "jen (Japonia)" },
  { code: "CNY", name: "yuan renminbi (Chiny)" },
  { code: "HKD", name: "dolar hongkoński" },
  { code: "SGD", name: "dolar singapurski" },
  { code: "AUD", name: "dolar australijski" },
  { code: "NZD", name: "dolar nowozelandzki" },
  { code: "CAD", name: "dolar kanadyjski" },
  { code: "CLP", name: "peso chilijskie" },
  { code: "MXN", name: "peso meksykańskie" },
  { code: "PHP", name: "peso filipińskie" },
  { code: "BRL", name: "real (Brazylia)" },
  { code: "ZAR", name: "rand (RPA)" },
  { code: "THB", name: "bat (Tajlandia)" },
  { code: "MYR", name: "ringgit (Malezja)" },
  { code: "IDR", name: "rupia indonezyjska" },
  { code: "INR", name: "rupia indyjska" },
  { code: "KRW", name: "won południowokoreański" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const CURRENCY_CODES = CURRENCIES.map(
  (currency) => currency.code,
) as [CurrencyCode, ...CurrencyCode[]];

export const ENABLED_CURRENCY_CODES: readonly CurrencyCode[] = CURRENCY_CODES;
