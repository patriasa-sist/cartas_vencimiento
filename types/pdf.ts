// types/pdf.ts - Tipos específicos para generación de PDFs

import { ProcessedInsuranceRecord } from "./insurance";

export interface LetterData {
	id: string;
	sourceRecordIds: string[];
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
	additionalConditions?: string; // NUEVO: Campo para el texto editable
}

export interface PolicyForLetter {
	expiryDate: string;
	policyNumber: string;
	company: string;
	branch: string;
	insuredValue?: number;
	premium?: number;
	insuredMembers?: string[];
	manualFields?: {
		insuredMatter?: string;
		originalInsuredMatter?: string;
		insuredMembers?: string[];
		originalInsuredMembers?: string[];
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
	clientPhone?: string;
	clientEmail?: string;
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
