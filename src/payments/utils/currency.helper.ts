/**
 * Helper para manejo de monedas en MercadoPago
 * Mapea países a sus respectivas monedas soportadas
 */

export enum CountryCode {
  AR = "AR", // Argentina
  BR = "BR", // Brasil
  CL = "CL", // Chile
  CO = "CO", // Colombia
  MX = "MX", // México
  PE = "PE", // Perú
  UY = "UY", // Uruguay
  VE = "VE", // Venezuela
}

export enum CurrencyCode {
  ARS = "ARS", // Peso argentino
  BRL = "BRL", // Real brasileño
  CLP = "CLP", // Peso chileno
  COP = "COP", // Peso colombiano
  MXN = "MXN", // Peso mexicano
  PEN = "PEN", // Nuevo sol peruano
  UYU = "UYU", // Peso uruguayo
  VES = "VES", // Bolívar soberano venezolano
}

/**
 * Mapeo de países a monedas soportadas por MercadoPago
 */
const CURRENCY_MAP: Record<CountryCode, CurrencyCode> = {
  [CountryCode.AR]: CurrencyCode.ARS,
  [CountryCode.BR]: CurrencyCode.BRL,
  [CountryCode.CL]: CurrencyCode.CLP,
  [CountryCode.CO]: CurrencyCode.COP,
  [CountryCode.MX]: CurrencyCode.MXN,
  [CountryCode.PE]: CurrencyCode.PEN,
  [CountryCode.UY]: CurrencyCode.UYU,
  [CountryCode.VE]: CurrencyCode.VES,
};

/**
 * Símbolos de monedas para display en UI
 */
const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  [CurrencyCode.ARS]: "$",
  [CurrencyCode.BRL]: "R$",
  [CurrencyCode.CLP]: "$",
  [CurrencyCode.COP]: "$",
  [CurrencyCode.MXN]: "$",
  [CurrencyCode.PEN]: "S/",
  [CurrencyCode.UYU]: "$",
  [CurrencyCode.VES]: "Bs",
};

/**
 * Nombres de monedas para display
 */
const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  [CurrencyCode.ARS]: "Peso argentino",
  [CurrencyCode.BRL]: "Real brasileño",
  [CurrencyCode.CLP]: "Peso chileno",
  [CurrencyCode.COP]: "Peso colombiano",
  [CurrencyCode.MXN]: "Peso mexicano",
  [CurrencyCode.PEN]: "Nuevo sol",
  [CurrencyCode.UYU]: "Peso uruguayo",
  [CurrencyCode.VES]: "Bolívar",
};

/**
 * Obtiene el código de moneda para un país
 * @param countryCode Código del país (AR, BR, etc.)
 * @param fallback Moneda por defecto si el país no se encuentra (default: ARS)
 * @returns Código de moneda (ARS, BRL, etc.)
 */
export function getCurrencyByCountry(
  countryCode: string,
  fallback: CurrencyCode = CurrencyCode.ARS
): CurrencyCode {
  const upperCode = countryCode.toUpperCase() as CountryCode;
  return CURRENCY_MAP[upperCode] || fallback;
}

/**
 * Obtiene el símbolo de una moneda
 * @param currencyCode Código de moneda (ARS, BRL, etc.)
 * @returns Símbolo de la moneda ($, R$, etc.)
 */
export function getCurrencySymbol(currencyCode: CurrencyCode): string {
  return CURRENCY_SYMBOLS[currencyCode] || "$";
}

/**
 * Obtiene el nombre de una moneda
 * @param currencyCode Código de moneda (ARS, BRL, etc.)
 * @returns Nombre de la moneda
 */
export function getCurrencyName(currencyCode: CurrencyCode): string {
  return CURRENCY_NAMES[currencyCode] || "Peso";
}

/**
 * Formatea un monto con la moneda correspondiente
 * @param amount Monto a formatear
 * @param currencyCode Código de moneda
 * @param locale Locale para formateo (default: es-AR)
 * @returns String formateado con moneda
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode,
  locale: string = "es-AR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Valida si un código de país es soportado por MercadoPago
 * @param countryCode Código del país
 * @returns true si es soportado
 */
export function isSupportedCountry(countryCode: string): boolean {
  return Object.values(CountryCode).includes(
    countryCode.toUpperCase() as CountryCode
  );
}

/**
 * Valida si un código de moneda es soportado por MercadoPago
 * @param currencyCode Código de moneda
 * @returns true si es soportado
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return Object.values(CurrencyCode).includes(
    currencyCode.toUpperCase() as CurrencyCode
  );
}

/**
 * Obtiene información completa de una moneda
 * @param currencyCode Código de moneda
 * @returns Objeto con toda la info de la moneda
 */
export function getCurrencyInfo(currencyCode: CurrencyCode) {
  return {
    code: currencyCode,
    symbol: getCurrencySymbol(currencyCode),
    name: getCurrencyName(currencyCode),
  };
}

/**
 * Obtiene lista de todos los países soportados
 */
export function getSupportedCountries() {
  return Object.entries(CURRENCY_MAP).map(([country, currency]) => ({
    countryCode: country,
    currencyCode: currency,
    currencySymbol: getCurrencySymbol(currency),
    currencyName: getCurrencyName(currency),
  }));
}

/**
 * Ejemplo de uso en un servicio:
 *
 * ```typescript
 * import { getCurrencyByCountry, formatCurrency } from './utils/currency.helper';
 *
 * // Obtener currency por país del profesional
 * const currency = getCurrencyByCountry(professional.countryCode);
 *
 * // Formatear precio para display
 * const formattedPrice = formatCurrency(5000, currency);
 * // => "$5.000,00" (Argentina) o "R$ 5.000,00" (Brasil)
 *
 * // Validar antes de crear preferencia
 * if (!isSupportedCountry(professional.countryCode)) {
 *   throw new Error('País no soportado por MercadoPago');
 * }
 * ```
 */
