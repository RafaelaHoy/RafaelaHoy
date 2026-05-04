// Matriz exacta de farmacias (Ciclo de 10 días)
const rotationMatrix = [
  ['Bernini', 'Escobar', 'Longoni', 'Morbidoni'], // Día 0 (Ancla: 23/04/2026)
  ['Abrate', 'Cagnotti', 'Tomatis', 'Moreno', 'Zeballos'], // Día 1
  ['Dardati', 'Fogliatti', 'Caballero', 'Puig'], // Día 2
  ['Leiggener', 'Walter', 'Aboal', 'Pautasso'], // Día 3
  ['Blatter', 'Elsener', 'Morello', 'Operto'], // Día 4
  ['Dechiara', 'Serra', 'Tibaldi', 'Cornatosky', 'Sudano'], // Día 5
  ['Corach', 'Mainero', 'Modenesi', 'Tessio'], // Día 6
  ['Ingaramo', 'Guembarena', 'Turino', 'Simoncini'], // Día 7
  ['Delbino', 'Sello', 'Rossi', 'Bruera'], // Día 8
  ['Cecchi', 'Dagostino', 'Giorgis', 'Grimaldi']  // Día 9
];

// Fecha ancla (Día 0)
const anchorDate = new Date('2026-04-23T00:00:00-03:00'); // 23/04/2026 medianoche Hora Argentina

/**
 * Determina qué farmacias están de turno en este momento exacto
 * Basado en la hora de Argentina (America/Argentina/Buenos_Aires)
 * Turnos de 08:00 AM a 08:00 AM del día siguiente
 */
export function getCurrentDutyPharmacies(): string[] {
  // Obtener fecha y hora actual en zona horaria de Argentina
  const now = new Date();
  const argentinaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  
  // Extraer hora y fecha
  const currentHour = argentinaTime.getHours();
  
  // Si la hora es MENOR a las 08:00 AM, usar el día de AYER
  // Si la hora es MAYOR o IGUAL a las 08:00 AM, usar el día de HOY
  const referenceDate = currentHour < 8 
    ? new Date(argentinaTime.getTime() - 24 * 60 * 60 * 1000) // Ayer
    : argentinaTime; // Hoy
  
  // Calcular días desde la fecha ancla
  const daysSinceAnchor = Math.floor((referenceDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calcular posición en el ciclo (módulo 10)
  const cyclePosition = daysSinceAnchor % 10;
  
  // Retornar farmacias correspondientes a este día del ciclo
  return rotationMatrix[cyclePosition] || [];
}

/**
 * Normaliza un string para comparación (elimina acentos, convierte a minúsculas)
 */
export function normalizePharmacyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .trim();
}

/**
 * Verifica si una farmacia está de turno
 */
export function isPharmacyOnDuty(pharmacyName: string): boolean {
  const dutyPharmacies = getCurrentDutyPharmacies();
  const normalizedPharmacyName = normalizePharmacyName(pharmacyName);
  
  return dutyPharmacies.some(pharmacy => 
    normalizePharmacyName(pharmacy) === normalizedPharmacyName
  );
}

/**
 * Obtiene información del ciclo actual (para debugging)
 */
export function getRotationInfo() {
  const now = new Date();
  const argentinaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const currentHour = argentinaTime.getHours();
  
  const referenceDate = currentHour < 8 
    ? new Date(argentinaTime.getTime() - 24 * 60 * 60 * 1000)
    : argentinaTime;
  
  const daysSinceAnchor = Math.floor((referenceDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24));
  const cyclePosition = daysSinceAnchor % 10;
  
  return {
    currentHour: currentHour,
    referenceDate: referenceDate.toISOString(),
    daysSinceAnchor,
    cyclePosition,
    dutyPharmacies: getCurrentDutyPharmacies(),
    isBefore8AM: currentHour < 8
  };
}
