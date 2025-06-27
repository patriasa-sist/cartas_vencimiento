import * as ExcelJS from "exceljs";
import {
	InsuranceRecord,
	ProcessedInsuranceRecord,
	ExcelUploadResult,
	InsuranceStatus,
	VALIDATION_RULES,
	SYSTEM_CONSTANTS,
} from "@/types/insurance";

/**
 * Convierte fecha serial de Excel a objeto Date - CORREGIDO
 */
export function excelDateToJSDate(excelDate: number | Date): Date {
	if (excelDate instanceof Date) {
		let tiempoMili = excelDate.getTime();
		let tiempoActual = new Date(1899, 11, 30).getTime();
		// Si ya es Date pero viene de Excel, convertir a número para aplicar corrección
		const excelSerial = (tiempoMili - tiempoActual) / (24 * 60 * 60 * 1000);

		// logs de pruebas
		// console.log("excelDate: ", excelDate);
		// console.log("tiempoMili: ", tiempoMili);
		// console.log("tiempoActual: ", tiempoActual);
		// console.log("excelSerial: ", excelSerial);

		return excelDateToJSDate(excelSerial);
	}

	// console.log("numero procesado: ", excelDate);

	// Corrección del bug de Excel: si la fecha serial es > 59 (después del 28 feb 1900), restar 1 día porque Excel incorrectamente cuenta el 29 feb 1900 que no existió
	const correctedSerial = excelDate > 59 ? excelDate - 1 : excelDate;

	const excelEpoch = new Date(1900, 0, 1); // Fecha base: 1 enero 1900 en Excel
	const resultDate = new Date(excelEpoch); // inicializacion cualquiera
	resultDate.setDate(excelEpoch.getDate() + correctedSerial); // Suma de dias

	//console.log("fecha corregida: ", resultDate);
	return resultDate;
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
	if (daysUntilExpiry < 0) return "expired";
	if (daysUntilExpiry <= SYSTEM_CONSTANTS.CRITICAL_DAYS_THRESHOLD) return "critical";
	if (daysUntilExpiry <= SYSTEM_CONSTANTS.DUE_SOON_DAYS_THRESHOLD) return "due_soon";
	return "pending";
}

/**
 * Limpia y normaliza strings
 */
export function cleanString(value: any): string {
	if (value === null || value === undefined) return "";
	return String(value).trim();
}

/**
 * Convierte valor a número, manejando diferentes formatos
 */
export function parseNumber(value: any): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		// Remover caracteres no numéricos excepto punto y coma
		const cleaned = value.replace(/[^\d.-]/g, "");
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

	VALIDATION_RULES.forEach((rule) => {
		const value = record[rule.field];

		if (rule.required && (value === null || value === undefined || value === "")) {
			errors.push(`Fila ${rowIndex}: Campo "${rule.field}" es requerido`);
			return;
		}

		if (value !== null && value !== undefined && value !== "") {
			switch (rule.type) {
				case "string":
					const strValue = cleanString(value);
					if (rule.minLength && strValue.length < rule.minLength) {
						errors.push(
							`Fila ${rowIndex}: "${rule.field}" debe tener al menos ${rule.minLength} caracteres`
						);
					}
					if (rule.maxLength && strValue.length > rule.maxLength) {
						errors.push(
							`Fila ${rowIndex}: "${rule.field}" no puede tener más de ${rule.maxLength} caracteres`
						);
					}
					break;

				case "number":
					const numValue = parseNumber(value);
					if (isNaN(numValue)) {
						errors.push(`Fila ${rowIndex}: "${rule.field}" debe ser un número válido`);
					}
					break;

				case "date":
					let dateValue: Date;
					if (typeof value === "number") {
						dateValue = excelDateToJSDate(value);
					} else {
						dateValue = new Date(value);
					}
					if (isNaN(dateValue.getTime())) {
						errors.push(`Fila ${rowIndex}: "${rule.field}" debe ser una fecha válida`);
					}
					break;

				case "email":
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
		nro: parseNumber(row["NRO."]),
		finDeVigencia: row["FIN DE VIGENCIA"],
		compania: cleanString(row["COMPAÑÍA"]) || "Sin especificar",
		ramo: cleanString(row["RAMO"]) || "Sin especificar",
		noPoliza: cleanString(row["NO. PÓLIZA"]) || "Sin número",
		telefono: cleanString(row["TELEFONO"]),
		correoODireccion: cleanString(row["CORREO/DIRECCION"]),
		asegurado: cleanString(row["ASEGURADO"]) || "Sin nombre",
		cartera: cleanString(row["CARTERA"]),
		materiaAsegurada: cleanString(row["MATERIA ASEGURADA"]),
		valorAsegurado: parseNumber(row[" VALOR ASEGURADO "] || row["VALOR ASEGURADO"]),
		prima: parseNumber(row[" PRIMA "] || row["PRIMA"]),
		ejecutivo: cleanString(row["EJECUTIVO"]) || "Sin asignar",
		responsable: cleanString(row["RESPONSABLE"]),
		cartaAvisoVto: cleanString(row["CARTA AVISO VTO."]),
		seguimiento: cleanString(row["SEGUIMIENTO"]),
		cartaDeNoRenov: cleanString(row["CARTA DE NO RENOV."]),
		renueva: cleanString(row["RENUEVA"]),
		pendiente: cleanString(row["PENDIENTE"]),
		noRenueva: cleanString(row["NO RENUEVA"]),
		avance: parseNumber(row["Avance"]),
		cantidad: parseNumber(row["Cantidad"]),
		observaciones: cleanString(row["Observaciones2"] || row["Observaciones"]),
	};
}

/**
 * Procesa un registro para agregar campos calculados - ACTUALIZADO
 */
export function processRecord(record: InsuranceRecord, index: number): ProcessedInsuranceRecord {
	// Convertir fecha si es necesario
	let expiryDate: Date;
	// si finDeVigencia es un number o Date convertir y resolver bug de año bisciesto
	if (typeof record.finDeVigencia === "number" || record.finDeVigencia instanceof Date) {
		//console.log("fecha a convertir: ", record.finDeVigencia);
		expiryDate = excelDateToJSDate(record.finDeVigencia);
	} else if (typeof record.finDeVigencia === "string") {
		//console.log("fecha string");
		expiryDate = new Date(record.finDeVigencia);
		// Si el parsing falla, intentar diferentes formatos
		if (isNaN(expiryDate.getTime())) {
			// Formato DD/MM/YYYY
			const parts = record.finDeVigencia.split("/");
			if (parts.length === 3) {
				const day = parseInt(parts[0]);
				const month = parseInt(parts[1]) - 1; // JavaScript months are 0-based
				const year = parseInt(parts[2]);
				expiryDate = new Date(year, month, day);
			}
		}
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
 * Función principal para procesar archivo Excel usando ExcelJS (más seguro)
 */
export async function processExcelFile(file: File): Promise<ExcelUploadResult> {
	try {
		// Validar tamaño del archivo
		if (file.size > SYSTEM_CONSTANTS.MAX_UPLOAD_SIZE) {
			return {
				success: false,
				errors: [
					`El archivo es demasiado grande. Tamaño máximo: ${
						SYSTEM_CONSTANTS.MAX_UPLOAD_SIZE / 1024 / 1024
					}MB`,
				],
			};
		}

		// Validar tipo de archivo
		const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
		if (!SYSTEM_CONSTANTS.SUPPORTED_FILE_TYPES.includes(fileExtension)) {
			return {
				success: false,
				errors: [
					`Tipo de archivo no soportado. Tipos permitidos: ${SYSTEM_CONSTANTS.SUPPORTED_FILE_TYPES.join(
						", "
					)}`,
				],
			};
		}

		// Leer archivo con ExcelJS
		const arrayBuffer = await file.arrayBuffer();
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(arrayBuffer);

		// Verificar que el archivo tenga hojas
		if (workbook.worksheets.length === 0) {
			return {
				success: false,
				errors: ["El archivo Excel no contiene hojas válidas"],
			};
		}

		// Usar la primera hoja (usualmente el mes actual)
		const worksheet = workbook.worksheets[0];

		// Verificar que tenga datos
		if (worksheet.rowCount < 2) {
			return {
				success: false,
				errors: ["El archivo no contiene datos suficientes (mínimo: headers + 1 fila de datos)"],
			};
		}

		// Extraer headers de la primera fila
		const headerRow = worksheet.getRow(1);
		const headers: string[] = [];

		headerRow.eachCell((cell, colNumber) => {
			headers[colNumber] = cell.value ? cell.value.toString().trim() : "";
		});

		// Verificar headers requeridos
		const requiredHeaders = ["FIN DE VIGENCIA", "COMPAÑÍA", "NO. PÓLIZA", "ASEGURADO", "EJECUTIVO"];

		const missingHeaders = requiredHeaders.filter(
			(header) => !headers.some((h) => h && h.toUpperCase().includes(header.toUpperCase()))
		);

		if (missingHeaders.length > 0) {
			return {
				success: false,
				errors: [`Headers faltantes: ${missingHeaders.join(", ")}`],
			};
		}

		// Procesar cada fila de datos
		const processedRecords: ProcessedInsuranceRecord[] = [];
		const errors: string[] = [];
		const warnings: string[] = [];

		for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
			const row = worksheet.getRow(rowNumber);

			// Crear objeto con headers como keys
			const rowObject: any = {};
			let hasData = false;

			row.eachCell((cell, colNumber) => {
				const header = headers[colNumber];
				if (header && cell.value !== null && cell.value !== undefined) {
					rowObject[header] = cell.value;
					hasData = true;
				}
			});

			// Saltar filas completamente vacías
			if (!hasData) {
				warnings.push(`Fila ${rowNumber}: Fila vacía, se omitirá`);
				continue;
			}

			try {
				// Mapear a nuestro tipo
				const insuranceRecord = mapExcelRowToRecord(rowObject);

				// Validar registro
				const validation = validateRecord(insuranceRecord, rowNumber);
				if (!validation.isValid) {
					errors.push(...validation.errors);
					continue;
				}

				// Procesar y agregar campos calculados
				const processedRecord = processRecord(insuranceRecord, rowNumber - 2);
				processedRecords.push(processedRecord);
			} catch (error) {
				errors.push(
					`Fila ${rowNumber}: Error al procesar - ${
						error instanceof Error ? error.message : "Error desconocido"
					}`
				);
			}
		}

		// Validaciones adicionales
		if (processedRecords.length === 0) {
			return {
				success: false,
				errors: ["No se pudieron procesar registros válidos", ...errors],
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
			totalRecords: worksheet.rowCount - 1, // -1 for header
			validRecords: processedRecords.length,
		};
	} catch (error) {
		console.error("Error procesando archivo Excel:", error);
		return {
			success: false,
			errors: [
				"Error al procesar el archivo Excel",
				error instanceof Error ? error.message : "Error desconocido",
			],
		};
	}
}

/**
 * Filtra registros que necesitan carta de vencimiento (30 días antes)
 */
export function getRecordsNeedingNotification(records: ProcessedInsuranceRecord[]): ProcessedInsuranceRecord[] {
	return records.filter((record) => {
		const daysUntil = record.daysUntilExpiry;
		return daysUntil <= SYSTEM_CONSTANTS.DAYS_BEFORE_EXPIRY_TO_SEND && daysUntil > 0;
	});
}

/**
 * Filtra registros críticos (5 días o menos)
 */
export function getCriticalRecords(records: ProcessedInsuranceRecord[]): ProcessedInsuranceRecord[] {
	return records.filter((record) => record.status === "critical");
}

/**
 * Obtiene valores únicos de una propiedad para filtros
 */
export function getUniqueValues<T extends keyof ProcessedInsuranceRecord>(
	records: ProcessedInsuranceRecord[],
	property: T
): string[] {
	const values = records
		.map((record) => record[property])
		.filter(
			(value): value is string =>
				typeof value === "string" && value.trim() !== "" && value !== null && value !== undefined
		)
		.map((value) => value.trim());

	return [...new Set(values)].sort();
}

/**
 * Formatea número como moneda boliviana
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("es-BO", {
		style: "currency",
		currency: "BOB",
		minimumFractionDigits: 2,
	}).format(amount);
}

/**
 * Formatea fecha para mostrar
 */
export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("es-BO", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

/**
 * Genera nombre de archivo para carta PDF
 */
export function generateLetterFileName(record: ProcessedInsuranceRecord): string {
	const today = new Date();
	const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

	// Limpiar nombre del asegurado
	const cleanName = record.asegurado
		.replace(/[^a-zA-Z\s]/g, "")
		.trim()
		.replace(/\s+/g, "_")
		.toUpperCase();

	return `AVISO_VCMTO_${cleanName}_${dateStr}.pdf`;
}
