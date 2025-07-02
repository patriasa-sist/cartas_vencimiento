// components/PDFGeneration/GeneralTemplate.tsx
import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { BaseTemplate } from "./BaseTemplate";
import { LetterData } from "@/types/pdf";
import { formatUSD, formatCurrency } from "@/utils/pdfutils"; // Import formatCurrency

const generalStyles = StyleSheet.create({
	policyTable: {
		width: "100%",
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
	},
	tableHeaderCol: {
		borderStyle: "solid",
		borderWidth: 1,
		borderLeftWidth: 0,
		borderTopWidth: 0,
		borderColor: "#e5e7eb",
		padding: 5,
		backgroundColor: "#172554",
	},
	headerText: {
		color: "white",
		fontSize: 8,
		fontWeight: "bold",
		textAlign: "center",
	},
	cellText: {
		fontSize: 8,
		textAlign: "center",
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
						{" "}
						{/* Adjusted width for Ramo */}
						<Text style={generalStyles.headerText}>RAMO</Text>
					</View>
					<View style={[generalStyles.tableHeaderCol, { width: "15%" }]}>
						{" "}
						{/* Adjusted width for Valor Asegurado */}
						<Text style={generalStyles.headerText}>VALOR ASEGURADO</Text>
					</View>
					<View style={[generalStyles.tableHeaderCol, { width: "15%" }]}>
						{" "}
						{/* Added Prima column */}
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
							{" "}
							{/* Adjusted width for Ramo */}
							<Text style={generalStyles.cellText}>{policy.branch}</Text>
						</View>
						<View style={[generalStyles.tableCol, { width: "15%" }]}>
							{" "}
							{/* Adjusted width for Valor Asegurado */}
							<Text style={generalStyles.cellText}>
								{policy.insuredValue ? formatUSD(policy.insuredValue) : "No especificado"}
							</Text>
						</View>
						<View style={[generalStyles.tableCol, { width: "15%" }]}>
							{" "}
							{/* Added Prima column */}
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

				{letterData.policies.some((p) => p.manualFields?.deductibles) ? (
					letterData.policies.map(
						(policy, index) =>
							policy.manualFields?.deductibles && (
								<Text key={index} style={generalStyles.conditionText}>
									• Deducible coaseguro: {policy.manualFields.deductibles}
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

				{letterData.policies.some((p) => p.manualFields?.territoriality) ? (
					letterData.policies.map(
						(policy, index) =>
							policy.manualFields?.territoriality && (
								<Text key={index} style={generalStyles.conditionText}>
									• Extraterritorialidad: {policy.manualFields.territoriality}
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
