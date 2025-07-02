// utils/pdfUtils.ts - Utilidades para generación de PDFs

import { ProcessedInsuranceRecord } from "@/types/insurance";
import { LetterData, PolicyForLetter } from "@/types/pdf";

export const PDF_CONSTANTS = {
	TEMPLATES: {
		SALUD: "salud",
		GENERAL: "general",
	},
	PAGE_SIZE: "letter" as const,
	MARGINS: {
		top: 60,
		bottom: 60,
		left: 60,
		right: 60,
	},
	COLORS: {
		patriaBlue: "#172554",
		patriaGreen: "#16a34a",
		textPrimary: "#1f2937",
		textSecondary: "#6b7280",
		border: "#e5e7eb",
	},
	FONTS: {
		primary: "Helvetica",
		bold: "Helvetica-Bold",
		size: {
			title: 14,
			header: 12,
			body: 10,
			small: 8,
		},
	},
} as const;

/**
 * Determina qué template usar basado en el RAMO
 */
export function determineTemplateType(ramo: string): "salud" | "general" {
	const ramoLower = ramo.toLowerCase();

	// Template de salud para seguros que contengan estas palabras
	const saludKeywords = ["salud", "vida", "medic"];

	if (saludKeywords.some((keyword) => ramoLower.includes(keyword))) {
		return "salud";
	}

	return "general";
}

/**
 * Agrupa registros por cliente y tipo de template
 */
export function groupRecordsForLetters(records: ProcessedInsuranceRecord[]): LetterData[] {
	const groups: Record<string, ProcessedInsuranceRecord[]> = {};

	// Agrupar por cliente + template type
	records.forEach((record) => {
		const templateType = determineTemplateType(record.ramo);
		const key = `${record.asegurado.trim()}_${templateType}`;

		if (!groups[key]) {
			groups[key] = [];
		}
		groups[key].push(record);
	});

	// Convertir grupos a LetterData
	return Object.entries(groups).map(([key, groupRecords], index) => {
		const firstRecord = groupRecords[0];
		const templateType = determineTemplateType(firstRecord.ramo);

		const policies: PolicyForLetter[] = groupRecords.map((record) => ({
			expiryDate: formatDate(new Date(record.finDeVigencia)),
			policyNumber: record.noPoliza,
			company: record.compania,
			branch: record.ramo,
			insuredValue: record.valorAsegurado, // Original value from Excel
			premium: record.prima, // Original value from Excel
			insuredMatter: record.materiaAsegurada,
			manualFields: {
				premium: record.prima, // Initialize editable premium with original value
				originalPremium: record.prima, // Store original premium for reference
				insuredValue: record.valorAsegurado, // Initialize editable insuredValue with original value
				originalInsuredValue: record.valorAsegurado, // Store original insuredValue for reference
				// Initialize currency for deductibles and territoriality
				deductiblesCurrency: "Bs.",
				territorialityCurrency: "Bs.",
			},
		}));

		// Detectar datos faltantes que el ejecutivo debe completar
		const missingData = detectMissingData(policies, templateType);

		return {
			id: `letter_${Date.now()}_${index}`,
			templateType,
			referenceNumber: generateReferenceNumber(),
			date: formatDate(new Date()),
			client: {
				name: firstRecord.asegurado,
				phone: firstRecord.telefono,
				email: firstRecord.correoODireccion,
				address: "",
			},
			policies,
			executive: firstRecord.ejecutivo,
			needsReview: missingData.length > 0 || templateType === "general", // General templates always need review for specific conditions
			missingData,
		};
	});
}

/**
 * Detecta datos faltantes que requieren intervención manual
 */
export function detectMissingData(policies: PolicyForLetter[], templateType: "salud" | "general"): string[] {
	const missing: string[] = [];

	policies.forEach((policy, index) => {
		const policyLabel = `Póliza ${index + 1} (${policy.policyNumber})`;

		// Check for insuredValue in manualFields
		if (
			policy.manualFields?.insuredValue === undefined ||
			policy.manualFields?.insuredValue === null ||
			policy.manualFields.insuredValue <= 0
		) {
			missing.push(`${policyLabel}: Valor Asegurado`);
		}

		// Check for premium in manualFields
		if (!policy.manualFields?.premium || policy.manualFields.premium <= 0) {
			missing.push(`${policyLabel}: Prima`);
		}

		if (templateType === "salud") {
			if (!policy.manualFields?.renewalPremium || policy.manualFields.renewalPremium <= 0) {
				missing.push(`${policyLabel}: Prima de renovación anual`);
			}
			missing.push(`${policyLabel}: Verificar cobertura COVID`); // This is a reminder, not a strict missing field
		}

		if (templateType === "general") {
			if (!policy.manualFields?.deductibles || policy.manualFields.deductibles <= 0) {
				missing.push(`${policyLabel}: Información de deducibles`);
			}
			if (!policy.manualFields?.territoriality || policy.manualFields.territoriality <= 0) {
				missing.push(`${policyLabel}: Información de extraterritorialidad`);
			}
			if (!policy.manualFields?.specificConditions) {
				missing.push(`${policyLabel}: Condiciones específicas`);
			}
		}
	});

	return missing;
}

/**
 * Genera número de referencia automático
 */
export function generateReferenceNumber(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const random = Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, "0");

	return `SC-PSA-${random}/${year}`;
}

/**
 * Formatea fecha para mostrar en cartas
 */
export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("es-BO", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
}

/**
 * Formatea fecha corta para nombres de archivo
 */
export function formatDateShort(date: Date): string {
	return new Intl.DateTimeFormat("es-BO", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	})
		.format(date)
		.replace(/\//g, "");
}

/**
 * Genera nombre de archivo para carta PDF
 */
export function generateFileName(clientName: string, templateType: string): string {
	const today = new Date();
	const dateStr = formatDateShort(today);

	// Limpiar nombre del cliente
	const cleanName = clientName
		.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s]/g, "")
		.trim()
		.replace(/\s+/g, "_")
		.toUpperCase();

	const typePrefix = templateType === "salud" ? "SALUD" : "VCMTO";

	return `${dateStr}-AVISO_${typePrefix}_${cleanName}.pdf`;
}

/**
 * Valida si un registro tiene datos mínimos para generar carta
 */
export function validateRecordForPDF(record: ProcessedInsuranceRecord): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!record.asegurado || record.asegurado.trim().length < 2) {
		errors.push("Nombre del asegurado requerido");
	}

	if (!record.noPoliza || record.noPoliza.trim().length < 2) {
		errors.push("Número de póliza requerido");
	}

	if (!record.compania || record.compania.trim().length < 2) {
		errors.push("Compañía aseguradora requerida");
	}

	if (!record.ramo || record.ramo.trim().length < 2) {
		errors.push("Ramo del seguro requerido");
	}

	if (!record.finDeVigencia) {
		errors.push("Fecha de vencimiento requerida");
	}

	if (!record.ejecutivo || record.ejecutivo.trim().length < 2) {
		errors.push("Ejecutivo responsable requerido");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Formatea moneda boliviana (Bs.) con coma como separador decimal.
 */
export function formatCurrency(amount: number): string {
	if (amount === undefined || amount === null || isNaN(amount)) return "No especificado";

	return new Intl.NumberFormat("es-BO", {
		// Locale for Bolivia uses '.' for thousands and ',' for decimals
		style: "currency",
		currency: "BOB",
		minimumFractionDigits: 2, // Always show two decimal places
		maximumFractionDigits: 2,
	}).format(amount);
}

/**
 * Formatea moneda USD ($us.) con coma como separador decimal.
 * Utiliza el locale es-BO y añade el prefijo manualmente para asegurar el formato deseado.
 */
export function formatUSD(amount: number): string {
	if (amount === undefined || amount === null || isNaN(amount)) return "No especificado";

	// Use es-BO locale to get '.' for thousands and ',' for decimals
	const formattedNumber = new Intl.NumberFormat("es-BO", {
		minimumFractionDigits: 2, // Always show two decimal places
		maximumFractionDigits: 2,
	}).format(amount);

	return `$us. ${formattedNumber}`; // Manually prepend "$us."
}
