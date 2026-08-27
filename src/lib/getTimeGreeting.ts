export type TimeGreetingKey = 'dashboard.greetingMorning' | 'dashboard.greetingAfternoon';

/**
 * Saludo según hora local del cliente:
 * - 06:00–11:59 → Buenos días
 * - 12:00–05:59 → Buenas tardes
 */
export function getTimeGreetingKey(date = new Date()): TimeGreetingKey {
  const hour = date.getHours();

  if (hour >= 6 && hour < 12) {
    return 'dashboard.greetingMorning';
  }

  return 'dashboard.greetingAfternoon';
}
