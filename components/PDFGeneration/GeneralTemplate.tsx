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
		marginBottom: 10,
	},
	tableRow: {
		flexDirection: "row",
	},
	// Estilo para las celdas de datos y encabezado, ahora con anchos explícitos
	tableCol: {
		borderStyle: "solid",
		borderWidth: 1,
		borderLeftWidth: 0,
		borderTopWidth: 0,
		borderColor: "#e5e7eb",
		padding: 5,
		// No usamos flex: 1 aquí, en su lugar, definiremos el ancho directamente en las celdas
		textAlign: "center", // Centra el texto
		justifyContent: "center", // Centra el contenido verticalmente
		alignItems: "center", // Centra el contenido horizontalmente
	},
	headerText: {
		fontWeight: "bold",
		fontSize: 8,
		textAlign: "center",
		color: "#1f2937",
	},
	cellText: {
		fontSize: 8,
		textAlign: "center",
	},
	// Estilos específicos para celdas con contenido potencialmente largo
	policyNumberCellText: {
		fontSize: 7, // Tamaño de fuente más pequeño para números de póliza largos
		textAlign: "center",
	},
	conditionsBox: {
		backgroundColor: "#f8f9fa",
		padding: 8,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#dee2e6",
	},
	conditionsTitle: {
		fontSize: 10,
		fontWeight: "bold",
		marginBottom: 8,
		color: "#172554",
	},
	conditionText: {
		fontSize: 9,
		marginBottom: 5,
		lineHeight: 1.3,
	},
	missingDataBox: {
		backgroundColor: "#fee2e2",
		padding: 8,
		marginBottom: 10,
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
		return value.toString();
	};

	return (
		<BaseTemplate letterData={letterData}>
			{/* Policy Table */}
			<View style={generalStyles.policyTable}>
				{/* Table Header */}
				<View style={generalStyles.tableRow}>
					<View style={[generalStyles.tableCol, { width: "15%" }]}>
						<Text style={generalStyles.headerText}>FECHA DE VENCIMIENTO</Text>
					</View>
					<View style={[generalStyles.tableCol, { width: "25%" }]}>
						{" "}
						{/* Ancho aumentado para No. de Póliza */}
						<Text style={generalStyles.headerText}>No. DE PÓLIZA</Text>
					</View>
					<View style={[generalStyles.tableCol, { width: "15%" }]}>
						<Text style={generalStyles.headerText}>COMPAÑÍA</Text>
					</View>
					<View style={[generalStyles.tableCol, { width: "15%" }]}>
						<Text style={generalStyles.headerText}>RAMO</Text>
					</View>
					<View style={[generalStyles.tableCol, { width: "15%" }]}>
						<Text style={generalStyles.headerText}>VALOR ASEGURADO</Text>
					</View>
					<View style={[generalStyles.tableCol, { width: "15%" }]}>
						<Text style={generalStyles.headerText}>PRIMA</Text>
					</View>
				</View>

				{/* Policy Rows */}
				{letterData.policies.map((policy, index) => (
					<View key={index} style={generalStyles.tableRow}>
						<View style={[generalStyles.tableCol, { width: "15%" }]}>
							<Text style={generalStyles.cellText}>{policy.expiryDate}</Text>
						</View>
						<View style={[generalStyles.tableCol, { width: "25%" }]}>
							{" "}
							{/* Ancho aumentado para No. de Póliza */}
							<Text style={generalStyles.policyNumberCellText}>{policy.policyNumber}</Text> {/* Usar estilo específico */}
						</View>
						<View style={[generalStyles.tableCol, { width: "15%" }]}>
							<Text style={generalStyles.cellText}>{policy.company}</Text>
						</View>
						<View style={[generalStyles.tableCol, { width: "15%" }]}>
							<Text style={generalStyles.cellText}>{policy.branch}</Text>
						</View>
						<View style={[generalStyles.tableCol, { width: "15%" }]}>
							<Text style={generalStyles.cellText}>{policy.manualFields?.insuredValue ? formatUSD(policy.manualFields.insuredValue) : "No especificado"}</Text>
						</View>
						<View style={[generalStyles.tableCol, { width: "15%" }]}>
							<Text style={generalStyles.cellText}>{policy.manualFields?.premium ? formatCurrency(policy.manualFields.premium) : "No especificado"}</Text>
						</View>
					</View>
				))}
			</View>

			{/* Materia Asegurada y Condiciones Específicas */}
			{letterData.policies.some(
				(p) => p.manualFields?.insuredMatter || p.manualFields?.deductibles !== undefined || p.manualFields?.territoriality !== undefined || p.manualFields?.specificConditions
			) && (
				<View style={generalStyles.conditionsBox}>
					<Text style={generalStyles.conditionsTitle}>DETALLE DE LA PÓLIZA:</Text>
					{letterData.policies.map((policy, index) => (
						<View key={index} style={{ marginBottom: index < letterData.policies.length - 1 ? 10 : 0 }}>
							<Text style={generalStyles.conditionText}>
								<Text style={{ fontWeight: "bold" }}>Póliza {policy.policyNumber}:</Text>
							</Text>
							{policy.manualFields?.insuredMatter && <Text style={generalStyles.conditionText}>• Materia Asegurada: {policy.manualFields.insuredMatter}</Text>}
							{policy.manualFields?.deductibles !== undefined && policy.manualFields?.deductibles !== null && (
								<Text style={generalStyles.conditionText}>• Deducible coaseguro: {formatMonetaryValue(policy.manualFields.deductibles, policy.manualFields.deductiblesCurrency)}</Text>
							)}
							{policy.manualFields?.territoriality !== undefined && policy.manualFields?.territoriality !== null && (
								<Text style={generalStyles.conditionText}>• Extraterritorialidad: {formatMonetaryValue(policy.manualFields.territoriality, policy.manualFields.territorialityCurrency)}</Text>
							)}
							{policy.manualFields?.specificConditions && (
								<Text style={generalStyles.conditionText}>
									• Condiciones Específicas:{"\n"}
									{policy.manualFields.specificConditions}
								</Text>
							)}
						</View>
					))}
				</View>
			)}

			{/* Missing Data Summary (This section will likely be empty if all manual fields are filled) */}
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
