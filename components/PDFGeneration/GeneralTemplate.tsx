// components/PDFGeneration/GeneralTemplate.tsx
import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { BaseTemplate } from "./BaseTemplate";
import { LetterData } from "@/types/pdf";
import { formatUSD, formatCurrency } from "@/utils/pdfutils"; // Import formatCurrency

const generalStyles = StyleSheet.create({
	policyTable: {
		width: "100%",
		// Removed display: "table" due to @react-pdf/renderer compatibility issues
		borderStyle: "solid",
		borderWidth: 1,
		borderColor: "#e5e7eb",
		marginBottom: 20,
	},
	tableRow: {
		flexDirection: "row",
	},
	tableHeaderRow: {
		backgroundColor: "#172554",
	},
	tableCol: {
		borderStyle: "solid",
		borderWidth: 1,
		borderLeftWidth: 0,
		borderTopWidth: 0,
		borderColor: "#e5e7eb",
		padding: 5,
		flex: 1, // Use flex for distribution
		textAlign: "center", // Center align text in data cells
		justifyContent: "center", // Center content vertically
		alignItems: "center", // Center content horizontally
	},
	tableHeaderCol: {
		borderStyle: "solid",
		borderWidth: 1,
		borderLeftWidth: 0,
		borderTopWidth: 0,
		borderColor: "#e5e7eb",
		padding: 5,
		backgroundColor: "#172554",
		flex: 1, // Use flex for distribution
		textAlign: "center", // Center align text in header cells
		justifyContent: "center", // Center content vertically
		alignItems: "center", // Center content horizontally
	},
	headerText: {
		color: "white",
		fontSize: 8,
		fontWeight: "bold",
		textAlign: "center", // Ensure header text is centered
	},
	cellText: {
		fontSize: 8,
		textAlign: "center", // Ensure cell text is centered
	},
	conditionsBox: {
		backgroundColor: "#f8f9fa",
		padding: 10,
		marginTop: 15,
		borderWidth: 1,
		borderColor: "#dee2e6",
		borderRadius: 4,
	},
	conditionsTitle: {
		fontSize: 9,
		fontWeight: "bold",
		marginBottom: 8,
		color: "#172554",
	},
	conditionText: {
		fontSize: 8,
		marginBottom: 5,
		lineHeight: 1.3,
	},
	missingDataBox: {
		backgroundColor: "#fee2e2",
		padding: 8,
		marginTop: 10,
		borderWidth: 1,
		borderColor: "#fca5a5",
		borderRadius: 4,
	},
	missingDataText: {
		fontSize: 8,
		color: "#dc2626",
		fontWeight: "bold",
	},
});

interface GeneralTemplateProps {
	letterData: LetterData;
}

export const GeneralTemplate: React.FC<GeneralTemplateProps> = ({ letterData }) => {
	// Helper function to format monetary values with currency symbol
	const formatMonetaryValue = (value: number | undefined, currency: "Bs." | "$us." | undefined) => {
		if (value === undefined || value === null || isNaN(value)) {
			return "No especificado";
		}
		let formattedValue: string;
		// Use es-BO locale for consistent thousands (dot) and decimal (comma) separators
		const numberFormatter = new Intl.NumberFormat("es-BO", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});

		formattedValue = numberFormatter.format(value);

		if (currency === "Bs.") {
			return `Bs. ${formattedValue}`;
		} else if (currency === "$us.") {
			return `$us. ${formattedValue}`;
		}
		return value.toString(); // Fallback if currency is not specified
	};

	return (
		<BaseTemplate letterData={letterData}>
			{/* Policy Table */}
			<View style={generalStyles.policyTable}>
				{/* Table Header */}
				<View style={generalStyles.tableHeaderRow}>
					<View style={[generalStyles.tableHeaderCol, { width: "15%" }]}>
						<Text style={generalStyles.headerText}>FECHA DE VENCIMIENTO</Text>
					</View>
					<View style={[generalStyles.tableHeaderCol, { width: "15%" }]}>
						<Text style={generalStyles.headerText}>No. DE PÓLIZA</Text>
					</View>
					<View style={[generalStyles.tableHeaderCol, { width: "20%" }]}>
						<Text style={generalStyles.headerText}>COMPAÑÍA</Text>
					</View>
					<View style={[generalStyles.tableHeaderCol, { width: "20%" }]}>
						<Text style={generalStyles.headerText}>RAMO</Text>
					</View>
					<View style={[generalStyles.tableHeaderCol, { width: "15%" }]}>
						<Text style={generalStyles.headerText}>VALOR ASEGURADO</Text>
					</View>
					<View style={[generalStyles.tableHeaderCol, { width: "15%" }]}>
						<Text style={generalStyles.headerText}>PRIMA</Text>
					</View>
				</View>

				{/* Policy Rows */}
				{letterData.policies.map((policy, index) => (
					<View key={index} style={generalStyles.tableRow}>
						<View style={[generalStyles.tableCol, { width: "15%" }]}>
							<Text style={generalStyles.cellText}>{policy.expiryDate}</Text>
						</View>
						<View style={[generalStyles.tableCol, { width: "15%" }]}>
							<Text style={generalStyles.cellText}>{policy.policyNumber}</Text>
						</View>
						<View style={[generalStyles.tableCol, { width: "20%" }]}>
							<Text style={generalStyles.cellText}>{policy.company}</Text>
						</View>
						<View style={[generalStyles.tableCol, { width: "20%" }]}>
							<Text style={generalStyles.cellText}>{policy.branch}</Text>
						</View>
						<View style={[generalStyles.tableCol, { width: "15%" }]}>
							<Text style={generalStyles.cellText}>
								{policy.manualFields?.insuredValue
									? formatUSD(policy.manualFields.insuredValue)
									: "No especificado"}
							</Text>
						</View>
						<View style={[generalStyles.tableCol, { width: "15%" }]}>
							<Text style={generalStyles.cellText}>
								{policy.manualFields?.premium
									? formatCurrency(policy.manualFields.premium)
									: "No especificado"}
							</Text>
						</View>
					</View>
				))}
			</View>

			{/* Materia Asegurada (si existe) */}
			{letterData.policies.some((p) => p.insuredMatter) && (
				<View style={generalStyles.conditionsBox}>
					<Text style={generalStyles.conditionsTitle}>MATERIA ASEGURADA:</Text>
					{letterData.policies.map(
						(policy, index) =>
							policy.insuredMatter && (
								<Text key={index} style={generalStyles.conditionText}>
									• {policy.insuredMatter}
								</Text>
							)
					)}
				</View>
			)}

			{/* Condiciones Específicas (para completar manualmente) */}
			<View style={generalStyles.conditionsBox}>
				<Text style={generalStyles.conditionsTitle}>CONDICIONES ESPECÍFICAS:</Text>

				{letterData.policies.some(
					(p) => p.manualFields?.deductibles !== undefined && p.manualFields?.deductibles !== null
				) ? (
					letterData.policies.map(
						(policy, index) =>
							policy.manualFields?.deductibles !== undefined &&
							policy.manualFields?.deductibles !== null && (
								<Text key={index} style={generalStyles.conditionText}>
									• Deducible coaseguro:{" "}
									{formatMonetaryValue(
										policy.manualFields.deductibles,
										policy.manualFields.deductiblesCurrency
									)}
								</Text>
							)
					)
				) : (
					<View style={generalStyles.missingDataBox}>
						<Text style={generalStyles.missingDataText}>
							⚠️ COMPLETAR: Información sobre deducibles y coaseguro
						</Text>
					</View>
				)}

				{letterData.policies.some(
					(p) => p.manualFields?.territoriality !== undefined && p.manualFields?.territoriality !== null
				) ? (
					letterData.policies.map(
						(policy, index) =>
							policy.manualFields?.territoriality !== undefined &&
							policy.manualFields?.territoriality !== null && (
								<Text key={index} style={generalStyles.conditionText}>
									• Extraterritorialidad:{" "}
									{formatMonetaryValue(
										policy.manualFields.territoriality,
										policy.manualFields.territorialityCurrency
									)}
								</Text>
							)
					)
				) : (
					<View style={generalStyles.missingDataBox}>
						<Text style={generalStyles.missingDataText}>
							⚠️ COMPLETAR: Información sobre extraterritorialidad (si aplica)
						</Text>
					</View>
				)}

				{/* Specific Conditions Textarea Content */}
				{letterData.policies.some((p) => p.manualFields?.specificConditions) ? (
					letterData.policies.map(
						(policy, index) =>
							policy.manualFields?.specificConditions && (
								<Text key={index} style={generalStyles.conditionText}>
									• {policy.manualFields.specificConditions}
								</Text>
							)
					)
				) : (
					<View style={generalStyles.missingDataBox}>
						<Text style={generalStyles.missingDataText}>
							⚠️ COMPLETAR: Condiciones específicas adicionales
						</Text>
					</View>
				)}
			</View>

			{/* Missing Data Summary */}
			{letterData.missingData.length > 0 && (
				<View style={generalStyles.missingDataBox}>
					<Text style={generalStyles.missingDataText}>DATOS FALTANTES PARA COMPLETAR MANUALMENTE:</Text>
					{letterData.missingData.map((item, index) => (
						<Text key={index} style={generalStyles.missingDataText}>
							• {item}
						</Text>
					))}
				</View>
			)}
		</BaseTemplate>
	);
};
