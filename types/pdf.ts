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
	insuredValue?: number; // This is the original insured value from the Excel file
	premium?: number; // This is the original premium from the Excel file
	insuredMatter?: string;
	// Campos que el ejecutivo debe completar manualmente
	manualFields?: {
		specificConditions?: string;
		deductibles?: number;
		deductiblesCurrency?: "Bs." | "$us.";
		territoriality?: number;
		territorialityCurrency?: "Bs." | "$us.";
		renewalPremium?: number; // Specific for health template
		premium?: number; // Editable premium field for both templates
		originalPremium?: number; // Store the original premium from Excel for reference
		insuredValue?: number; // Editable insured value field
		originalInsuredValue?: number; // Store original insured value for reference
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
