import * as XLSX from 'xlsx';
import { 
  InsuranceRecord, 
  ProcessedInsuranceRecord, 
  ExcelUploadResult, 
  InsuranceStatus,
  VALIDATION_RULES,
  SYSTEM_CONSTANTS 
} from '@/types/insurance';

/**
 * Convierte fecha serial de Excel a objeto Date
 */
export function excelDateToJSDate(excelDate: number): Date {
  // Excel usa 1900-01-01 como día 1, pero tiene un bug con años bisiestos
  const excelEpoch = new Date(1900, 0, 1);
  const days = excelDate - 1; // Excel cuenta desde 1, no 0
  const jsDate = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Ajuste para el bug de Excel con 1900 como año bisiesto
  if (excelDate > 59) {
    jsDate.setTime(jsDate.getTime() - 24 * 60 * 60 * 1000);
  }
  
  return jsDate;
}

/**
 * Calcula los días hasta el vencimiento
 */
export function calculateDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determina el estatus basado en días hasta vencimiento
 */
export function determineStatus(daysUntilExpiry: number): InsuranceStatus {
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= SYSTEM_CONSTANTS.CRITICAL_DAYS_THRESHOLD) return 'critical';
  if (daysUntilExpiry <= SYSTEM_CONSTANTS.DUE_SOON_DAYS_THRESHOLD) return 'due_soon';
  return 'pending';
}

/**
 * Limpia y normaliza strings
 */
export function cleanString(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Convierte valor a número, manejando diferentes formatos
 */
export function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remover caracteres no numéricos excepto punto y coma
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Valida un registro individual
 */
export function validateRecord(record: any, rowIndex: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  VALIDATION_RULES.forEach(rule => {
    const value = record[rule.field];
    
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push(`Fila ${rowIndex}: Campo "${rule.field}" es requerido`);
      return;
    }

    if (value !== null && value !== undefined && value !== '') {
      switch (rule.type) {
        case 'string':
          const strValue = cleanString(value);
          if (rule.minLength && strValue.length < rule.minLength) {
            errors.push(`Fila ${rowIndex}: "${rule.field}" debe tener al menos ${rule.minLength} caracteres`);
          }
          if (rule.maxLength && strValue.length > rule.maxLength) {
            errors.push(`Fila ${rowIndex}: "${rule.field}" no puede tener más de ${rule.maxLength} caracteres`);
          }
          break;

        case 'number':
          const numValue = parseNumber(value);
          if (isNaN(numValue)) {
            errors.push(`Fila ${rowIndex}: "${rule.field}" debe ser un número válido`);
          }
          break;

        case 'date':
          let dateValue: Date;
          if (typeof value === 'number') {
            dateValue = excelDateToJSDate(value);
          } else {
            dateValue = new Date(value);
          }
          if (isNaN(dateValue.getTime())) {
            errors.push(`Fila ${rowIndex}: "${rule.field}" debe ser una fecha válida`);
          }
          break;

        case 'email':
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(cleanString(value))) {
            errors.push(`Fila ${rowIndex}: "${rule.field}" debe ser un email válido`);
          }
          break;
      }
    }
  });

  return { isValid: errors.length === 0, errors };
}

/**
 * Mapea las columnas del Excel a nuestro tipo InsuranceRecord
 */
export function mapExcelRowToRecord(row: any): InsuranceRecord {
  return {
    nro: parseNumber(row['NRO.']),
    finDeVigencia: row['FIN DE VIGENCIA'],
    compania: cleanString(row['COMPAÑÍA']),
    ramo: cleanString(row['RAMO']),
    noPoliza: cleanString(row['NO. PÓLIZA']),
    telefono: cleanString(row['TELEFONO']),
    correoODireccion: cleanString(row['CORREO/DIRECCION']),
    asegurado: cleanString(row['ASEGURADO']),
    cartera: cleanString(row['CARTERA']),
    materiaAsegurada: cleanString(row['MATERIA ASEGURADA']),
    valorAsegurado: parseNumber(row[' VALOR ASEGURADO '] || row['VALOR ASEGURADO']),
    prima: parseNumber(row[' PRIMA '] || row['PRIMA']),
    ejecutivo: cleanString(row['EJECUTIVO']),
    responsable: cleanString(row['RESPONSABLE']),
    cartaAvisoVto: cleanString(row['CARTA AVISO VTO.']),
    seguimiento: cleanString(row['SEGUIMIENTO']),
    cartaDeNoRenov: cleanString(row['CARTA DE NO RENOV.']),
    renueva: cleanString(row['RENUEVA']),
    pendiente: cleanString(row['PENDIENTE']),
    noRenueva: cleanString(row['NO RENUEVA']),
    avance: parseNumber(row['Avance']),
    cantidad: parseNumber(row['Cantidad']),
    observaciones: cleanString(row['Observaciones2'] || row['Observaciones']),
  };
}

/**
 * Procesa un registro para agregar campos calculados
 */
export function processRecord(record: InsuranceRecord, index: number): ProcessedInsuranceRecord {
  // Convertir fecha si es necesario
  let expiryDate: Date;
  if (typeof record.finDeVigencia === 'number') {
    expiryDate = excelDateToJSDate(record.finDeVigencia);
  } else {
    expiryDate = new Date(record.finDeVigencia);
  }

  const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);
  const status = determineStatus(daysUntilExpiry);

  return {
    ...record,
    id: `record_${index}_${Date.now()}`,
    finDeVigencia: expiryDate,
    daysUntilExpiry,
    status,
    selected: false,
  };
}

/**
 * Función principal para procesar archivo Excel
 */
export async function processExcelFile(file: File): Promise<ExcelUploadResult> {
  try {
    // Validar tamaño del archivo
    if (file.size > SYSTEM_CONSTANTS.MAX_UPLOAD_SIZE) {
      return {
        success: false,
        errors: [`El archivo es demasiado grande. Tamaño máximo: ${SYSTEM_CONSTANTS.MAX_UPLOAD_SIZE / 1024 / 1024}MB`]
      };
    }

    // Validar tipo de archivo
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!SYSTEM_CONSTANTS.SUPPORTED_FILE_TYPES.includes(fileExtension)) {
      return {
        success: false,
        errors: [`Tipo de archivo no soportado. Tipos permitidos: ${SYSTEM_CONSTANTS.SUPPORTED_FILE_TYPES.join(', ')}`]
      };
    }

    // Leer archivo
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      cellStyles: true,
      cellFormulas: true,
      cellDates: true,
      cellNF: true,
      sheetStubs: true
    });

    // Verificar que el archivo tenga hojas
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        errors: ['El archivo Excel no contiene hojas válidas']
      };
    }

    // Usar la primera hoja (usualmente el mes actual)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });

    if (rawData.length < 2) {
      return {
        success: false,
        errors: ['El archivo no contiene datos suficientes (mínimo: headers + 1 fila de datos)']
      };
    }

    // Extraer headers y datos
    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1);

    // Verificar headers requeridos
    const requiredHeaders = [
      'FIN DE VIGENCIA',
      'COMPAÑÍA',
      'NO. PÓLIZA',
      'ASEGURADO',
      'EJECUTIVO'
    ];

    const missingHeaders = requiredHeaders.filter(
      header => !headers.some(h => 
        h && h.toString().toUpperCase().includes(header.toUpperCase())
      )
    );

    if (missingHeaders.length > 0) {
      return {
        success: false,
        errors: [`Headers faltantes: ${missingHeaders.join(', ')}`]
      };
    }

    // Procesar cada fila
    const processedRecords: ProcessedInsuranceRecord[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowIndex = i + 2; // +2 porque Excel empieza en 1 y saltamos headers

      // Crear objeto con headers como keys
      const rowObject: any = {};
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          rowObject[header.toString().trim()] = row[index];
        }
      });

      // Saltar filas completamente vacías
      const hasData = Object.values(rowObject).some(value => 
        value !== null && value !== undefined && value !== ''
      );

      if (!hasData) {
        warnings.push(`Fila ${rowIndex}: Fila vacía, se omitirá`);
        continue;
      }

      try {
        // Mapear a nuestro tipo
        const insuranceRecord = mapExcelRowToRecord(rowObject);

        // Validar registro
        const validation = validateRecord(insuranceRecord, rowIndex);
        if (!validation.isValid) {
          errors.push(...validation.errors);
          continue;
        }

        // Procesar y agregar campos calculados
        const processedRecord = processRecord(insuranceRecord, i);
        processedRecords.push(processedRecord);

      } catch (error) {
        errors.push(`Fila ${rowIndex}: Error al procesar - ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    // Validaciones adicionales
    if (processedRecords.length === 0) {
      return {
        success: false,
        errors: ['No se pudieron procesar registros válidos', ...errors]
      };
    }

    // Verificar duplicados por número de póliza
    const policyNumbers = new Set<string>();
    const duplicates: string[] = [];

    processedRecords.forEach((record, index) => {
      if (policyNumbers.has(record.noPoliza)) {
        duplicates.push(`Póliza duplicada: ${record.noPoliza} (fila ${index + 2})`);
      } else {
        policyNumbers.add(record.noPoliza);
      }
    });

    if (duplicates.length > 0) {
      warnings.push(...duplicates);
    }

    return {
      success: true,
      data: processedRecords,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      totalRecords: dataRows.length,
      validRecords: processedRecords.length
    };

  } catch (error) {
    console.error('Error procesando archivo Excel:', error);
    return {
      success: false,
      errors: [
        'Error al procesar el archivo Excel',
        error instanceof Error ? error.message : 'Error desconocido'
      ]
    };
  }
}

/**
 * Filtra registros que necesitan carta de vencimiento (30 días antes)
 */
export function getRecordsNeedingNotification(records: ProcessedInsuranceRecord[]): ProcessedInsuranceRecord[] {
  return records.filter(record => {
    const daysUntil = record.daysUntilExpiry;
    return daysUntil <= SYSTEM_CONSTANTS.DAYS_BEFORE_EXPIRY_TO_SEND && daysUntil > 0;
  });
}

/**
 * Filtra registros críticos (5 días o menos)
 */
export function getCriticalRecords(records: ProcessedInsuranceRecord[]): ProcessedInsuranceRecord[] {
  return records.filter(record => record.status === 'critical');
}

/**
 * Obtiene valores únicos de una propiedad para filtros
 */
export function getUniqueValues<T extends keyof ProcessedInsuranceRecord>(
  records: ProcessedInsuranceRecord[],
  property: T
): string[] {
  const values = records
    .map(record => record[property])
    .filter((value): value is string => 
      typeof value === 'string' && value.trim() !== ''
    )
    .map(value => value.trim());

  return [...new Set(values)].sort();
}

/**
 * Formatea número como moneda boliviana
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Formatea fecha para mostrar
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Genera nombre de archivo para carta PDF
 */
export function generateLetterFileName(record: ProcessedInsuranceRecord): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Limpiar nombre del asegurado
  const cleanName = record.asegurado
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();

  return `AVISO_VCMTO_${cleanName}_${dateStr}.pdf`;
}