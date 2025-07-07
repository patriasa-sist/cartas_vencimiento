// utils/pdfUtils.ts - Utilidades para generación de PDFs

import { ProcessedInsuranceRecord } from "@/types/insurance";
import { LetterData, PolicyForLetter, VehicleForLetter } from "@/types/pdf";

// Constantes para los textos de plantilla
const HEALTH_CONDITIONS_TEMPLATE = `Le informamos que a partir del *01/05/2025*, se excluye la cobertura del certificado asistencia al viajero y las pólizas se emiten en moneda nacional (BS)`;
const GENERAL_CONDITIONS_TEMPLATE = `A partir del *01/12/2024* se aplica :\n-Deducible coaseguro: 10% del valor del siniestro mínimo Bs 1.000 aplicable para las coberturas de Daños Propios, Conmoción Civil, Huelgas, Daño Malicioso, Sabotaje, Vandalismo y Terrorismo.\n-Extraterritorialidad: PAGO DE EXTRA PRIMA DE BS 400 (CONTADO) SI ES SOLICITADO EN LA RENOVACION DE LA POLIZA, POSTERIOR A LA RENOVACION DE LA POLIZA, EXTRA PRIMA DE BS 500.-\n“ La suscripción de los seguros seguro es Bs y considerando que en los últimos meses se ha observado un incremento significativo en el valor de mercado de los bienes en general en nuestro país, solicitamos la revisión del valor asegurado de su vehículo. La finalidad de esta actualización es garantizar una protección correcta de su patrimonio y acorde al valor real actual de los bien asegurado, con el fin de evitar la aplicación de infraseguro en caso de siniestro, como se encuentra establecido en el Código de Comercio, Art.1056.”`;

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
		italic: "Helvetica-Oblique",
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
	const saludKeywords = ["salud", "vida", "medic", "asistencia medica"];
	if (saludKeywords.some((keyword) => ramoLower.includes(keyword))) {
		return "salud";
	}
	return "general";
}

/**
 * Agrupa registros por cliente y tipo de template.
 */
export function groupRecordsForLetters(records: ProcessedInsuranceRecord[]): LetterData[] {
	const groups: Record<string, ProcessedInsuranceRecord[]> = {};

	records.forEach((record) => {
		const templateType = determineTemplateType(record.ramo);
		const key = `${record.asegurado.trim().toUpperCase()}_${templateType}`;
		if (!groups[key]) {
			groups[key] = [];
		}
		groups[key].push(record);
	});

	return Object.entries(groups).map(([key, groupRecords], index) => {
		const firstRecord = groupRecords[0];
		const templateType = determineTemplateType(firstRecord.ramo);
		let policies: PolicyForLetter[] = [];
		const sourceRecordIds = groupRecords.map((r) => r.id!).filter((id) => id);

		const policyGroups: Record<string, ProcessedInsuranceRecord[]> = {};
		groupRecords.forEach((record) => {
			const policyKey = record.noPoliza.trim().toUpperCase();
			if (!policyGroups[policyKey]) {
				policyGroups[policyKey] = [];
			}
			policyGroups[policyKey].push(record);
		});

		if (templateType === "salud") {
			policies = Object.values(policyGroups).map((policyGroup) => {
				const mainRecord = policyGroup.find((r) => !r.materiaAsegurada || r.materiaAsegurada.trim().toUpperCase() === r.asegurado.trim().toUpperCase()) || policyGroup[0];
				const insuredMembers = [...new Set(policyGroup.map((r) => r.materiaAsegurada?.trim()).filter((name): name is string => !!name && name.toUpperCase() !== "TITULAR"))];
				const titular = mainRecord.asegurado.trim();
				const titularIndex = insuredMembers.findIndex((m) => m.toUpperCase() === titular.toUpperCase());
				if (titularIndex > -1) {
					insuredMembers.splice(titularIndex, 1);
				}
				insuredMembers.unshift(titular);

				return {
					expiryDate: formatDate(new Date(mainRecord.finDeVigencia)),
					policyNumber: mainRecord.noPoliza,
					company: mainRecord.compania,
					branch: mainRecord.ramo,
					manualFields: {
						premium: mainRecord.prima,
						originalPremium: mainRecord.prima,
						insuredMembers: [...insuredMembers],
						originalInsuredMembers: [...insuredMembers],
						deductiblesCurrency: "Bs.",
						territorialityCurrency: "Bs.",
					},
				};
			});
		} else {
			policies = Object.values(policyGroups).map((policyGroup) => {
				const mainRecord = policyGroup[0];
				// LÓGICA MEJORADA PARA PRE-RELLENAR DATOS DEL VEHÍCULO
				const vehicles: VehicleForLetter[] = policyGroup.map((r, i) => ({
					id: `vehicle_${r.id || i}`,
					description: r.materiaAsegurada || "Vehículo sin descripción",
					declaredValue: 0, // Se deja en 0 para que el usuario lo rellene
					insuredValue: r.valorAsegurado || 0, // Se pre-rellena desde el Excel
				}));

				const totalPremium = policyGroup.reduce((sum, r) => sum + (r.prima || 0), 0);

				return {
					expiryDate: formatDate(new Date(mainRecord.finDeVigencia)),
					policyNumber: mainRecord.noPoliza,
					company: mainRecord.compania,
					branch: mainRecord.ramo,
					manualFields: {
						vehicles: vehicles,
						originalVehicles: JSON.parse(JSON.stringify(vehicles)), // Deep copy
						premium: totalPremium,
						originalPremium: totalPremium,
						deductiblesCurrency: "Bs.",
						territorialityCurrency: "Bs.",
					},
				};
			});
		}

		const letterDataBase = {
			id: `letter_${Date.now()}_${index}`,
			sourceRecordIds,
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
			additionalConditions: templateType === "salud" ? HEALTH_CONDITIONS_TEMPLATE : GENERAL_CONDITIONS_TEMPLATE,
		};

		const missingData = detectMissingData(letterDataBase);

		return {
			...letterDataBase,
			needsReview: missingData.length > 0 || templateType === "general",
			missingData,
		};
	});
}

/**
 * Detecta datos faltantes que requieren intervención manual
 */
export function detectMissingData(letterData: Omit<LetterData, "needsReview" | "missingData">): string[] {
	const missing: string[] = [];

	if (letterData.referenceNumber.includes("____")) {
		missing.push("Número de Referencia manual");
	}

	letterData.policies.forEach((policy, index) => {
		const policyLabel = `Póliza ${index + 1} (${policy.policyNumber})`;

		if (letterData.templateType === "salud") {
			if (!policy.manualFields?.renewalPremium || policy.manualFields.renewalPremium <= 0) {
				missing.push(`${policyLabel}: Prima de renovación anual`);
			}
		} else {
			if (!policy.manualFields?.premium || policy.manualFields.premium <= 0) {
				missing.push(`${policyLabel}: Prima`);
			}
			if (!policy.manualFields?.vehicles || policy.manualFields.vehicles.length === 0) {
				missing.push(`${policyLabel}: No se encontraron vehículos.`);
			} else {
				policy.manualFields.vehicles.forEach((vehicle, vIndex) => {
					if (!vehicle.description) missing.push(`${policyLabel}, Vehículo ${vIndex + 1}: Falta descripción.`);
					// AHORA SOLO VALIDAMOS VALOR DECLARADO, YA QUE EL ASEGURADO VIENE DEL EXCEL
					if (!vehicle.declaredValue || vehicle.declaredValue <= 0) missing.push(`${policyLabel}, Vehículo ${vIndex + 1}: Falta valor declarado.`);
				});
			}
			if (policy.manualFields?.deductibles === undefined || policy.manualFields?.deductibles === null || policy.manualFields.deductibles < 0) {
				missing.push(`${policyLabel}: Información de deducibles`);
			}
			if (policy.manualFields?.territoriality === undefined || policy.manualFields?.territoriality === null || policy.manualFields.territoriality < 0) {
				missing.push(`${policyLabel}: Información de extraterritorialidad`);
			}
			if (!policy.manualFields?.specificConditions) {
				missing.push(`${policyLabel}: Condiciones específicas`);
			}
		}
	});

	return [...new Set(missing)]; // Evitar duplicados
}

export function generateReferenceNumber(): string {
	const now = new Date();
	const year = now.getFullYear();
	return `SCPSA-____/${year}`;
}

export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("es-BO", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
}

export function formatDateShort(date: Date): string {
	return new Intl.DateTimeFormat("es-BO", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	})
		.format(date)
		.replace(/\//g, "");
}

export function generateFileName(clientName: string, templateType: string): string {
	const today = new Date();
	const dateStr = formatDateShort(today);

	const cleanName = clientName
		.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s]/g, "")
		.trim()
		.replace(/\s+/g, "_")
		.toUpperCase();

	const typePrefix = templateType === "salud" ? "SALUD" : "VCMTO";

	return `${dateStr}-AVISO_${typePrefix}_${cleanName}.pdf`;
}

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

export function formatCurrency(amount: number): string {
	if (amount === undefined || amount === null || isNaN(amount)) return "No especificado";
	return new Intl.NumberFormat("es-BO", {
		style: "currency",
		currency: "BOB",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function formatUSD(amount: number): string {
	if (amount === undefined || amount === null || isNaN(amount)) return "No especificado";
	const formattedNumber = new Intl.NumberFormat("es-BO", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
	return `$us. ${formattedNumber}`;
}
