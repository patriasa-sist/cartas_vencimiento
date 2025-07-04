// types/pdf.ts - Tipos específicos para generación de PDFs

import { ProcessedInsuranceRecord } from "./insurance";

export interface LetterData {
	id: string;
	sourceRecordIds: string[]; // NUEVO: IDs de los registros originales
	templateType: "salud" | "general";
	referenceNumber: string;
	date: string;
	client: {
		name: string;
		phone?: string;
		email?: string;
		address?: string;
	};
	policies: PolicyForLetter[];
	executive: string;
	needsReview: boolean;
	missingData: string[];
}

export interface PolicyForLetter {
	expiryDate: string;
	policyNumber: string;
	company: string;
	branch: string;
	insuredValue?: number;
	premium?: number;
	insuredMembers?: string[]; // Para listar asegurados en pólizas de salud
	manualFields?: {
		insuredMatter?: string;
		originalInsuredMatter?: string;
		specificConditions?: string;
		deductibles?: number;
		deductiblesCurrency?: "Bs." | "$us.";
		territoriality?: number;
		territorialityCurrency?: "Bs." | "$us.";
		renewalPremium?: number;
		premium?: number;
		originalPremium?: number;
		insuredValue?: number;
		originalInsuredValue?: number;
		coinsurance?: string;
	};
}

export interface PDFGenerationOptions {
	selectedRecords: ProcessedInsuranceRecord[];
	groupByClient: boolean;
	generateZip: boolean;
	previewMode: boolean;
}

export interface GeneratedLetter {
	letterId: string;
	sourceRecordIds: string[];
	clientName: string;
	clientPhone?: string; // Dato de cliente actualizado
	clientEmail?: string; // Dato de cliente actualizado
	templateType: "salud" | "general";
	fileName: string;
	pdfBlob?: Blob;
	policyCount: number;
	needsReview: boolean;
	missingData: string[];
}

export interface PDFGenerationResult {
	success: boolean;
	letters: GeneratedLetter[];
	errors: string[];
	totalGenerated: number;
}
