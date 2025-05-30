// types/pdf.ts - Tipos específicos para generación de PDFs

import { ProcessedInsuranceRecord } from "./insurance";

export interface LetterData {
	id: string;
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
	insuredMatter?: string;
	// Campos que el ejecutivo debe completar manualmente
	manualFields?: {
		specificConditions?: string;
		deductibles?: string;
		territoriality?: string;
		renewalPremium?: number;
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
	clientName: string;
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
