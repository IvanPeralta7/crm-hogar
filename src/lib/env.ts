/**
 * Normaliza variables de entorno para uso en headers HTTP (solo ISO-8859-1).
 */
export function readEnv(name: string): string | undefined {
  const raw = import.meta.env[name];
  if (typeof raw !== 'string' || raw.length === 0) {
    return undefined;
  }

  const value = raw
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');

  for (const char of value) {
    if (char.charCodeAt(0) > 255) {
      console.error(
        `[config] ${name} contiene un caracter invalido (U+${char.charCodeAt(0).toString(16)}). Revisá la variable en Vercel o .env`,
      );
      return undefined;
    }
  }

  return value;
}

export function isValidSupabaseKey(key: string): boolean {
  return key.startsWith('eyJ') || key.startsWith('sb_publishable_');
}
