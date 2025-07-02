// components/PDFGeneration/HealthTemplate.tsx
import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { BaseTemplate } from "./BaseTemplate";
import { LetterData } from "@/types/pdf";
import { formatUSD } from "@/utils/pdfutils";

const healthStyles = StyleSheet.create({
	policyTable: {
		marginBottom: 20,
	},
	policyGroup: {
		marginBottom: 15,
		padding: 10,
		borderWidth: 1,
		borderColor: "#e5e7eb",
		borderRadius: 4,
	},
	policyHeader: {
		fontSize: 10,
		fontWeight: "bold",
		marginBottom: 8,
		backgroundColor: "#f3f4f6",
		padding: 5,
	},
	policyRow: {
		flexDirection: "row",
		marginBottom: 5,
		fontSize: 9,
	},
	policyLabel: {
		width: "35%",
		fontWeight: "bold",
	},
	policyValue: {
		width: "65%",
	},
	renewalPremium: {
		backgroundColor: "#fef3cd",
		padding: 8,
		marginTop: 10,
		borderRadius: 4,
	},
	renewalText: {
		fontSize: 9,
		fontWeight: "bold",
		textAlign: "center",
		color: "#856404",
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
	aseguradosSection: {
		marginTop: 10,
		padding: 8,
		backgroundColor: "#f9fafb",
		borderRadius: 4,
	},
	aseguradosTitle: {
		fontSize: 9,
		fontWeight: "bold",
		marginBottom: 5,
		color: "#374151",
	},
	aseguradoName: {
		fontSize: 8,
		marginBottom: 2,
		color: "#6b7280",
	},
	table: {
		width: "100%",
		borderStyle: "solid",
		borderWidth: 1,
		borderColor: "#000",
		marginBottom: 10,
	},
	tableRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#000",
		borderBottomStyle: "solid",
		minHeight: 25,
		verticalAlign: "middle",
	},
	tableRowNoBottom: {
		flexDirection: "row",
		minHeight: 25,
		verticalAlign: "middle",
	},
	// Estilo para las celdas de datos
	tableCell: {
		padding: 5,
		fontSize: 9,
		borderRightWidth: 1,
		borderRightColor: "#000",
		borderRightStyle: "solid",
		textAlign: "center",
	},
	tableCellLast: {
		padding: 5,
		fontSize: 9,
		textAlign: "center",
	},
	covidInfo: {
		marginTop: 5,
		fontSize: 8,
		fontStyle: "italic",
	},
});

interface HealthTemplateProps {
	letterData: LetterData;
}

export const HealthTemplate: React.FC<HealthTemplateProps> = ({ letterData }) => {
	return (
		<BaseTemplate letterData={letterData}>
			<View style={healthStyles.policyTable}>
				{letterData.policies.map((policy, policyIndex) => (
					<View key={policyIndex} style={{ marginBottom: 15 }}>
						{/* Header Row - Usamos tableRow para la fila del encabezado */}
						<View style={healthStyles.tableRow}>
							{/* Las celdas del encabezado usan tableCell y tableCellLast */}
							<View style={[healthStyles.tableCell, { width: "25%" }]}>
								<Text style={{ fontWeight: "bold", color: "#1f2937" }}>FECHA DE VENCIMIENTO</Text>
							</View>
							<View style={[healthStyles.tableCell, { width: "25%" }]}>
								<Text style={{ fontWeight: "bold", color: "#1f2937" }}>No. DE PÓLIZA</Text>
							</View>
							<View style={[healthStyles.tableCell, { width: "25%" }]}>
								<Text style={{ fontWeight: "bold", color: "#1f2937" }}>COMPAÑÍA</Text>
							</View>
							<View style={[healthStyles.tableCellLast, { width: "25%" }]}>
								<Text style={{ fontWeight: "bold", color: "#1f2937" }}>RAMO</Text>
							</View>
						</View>

						{/* Data Row */}
						<View style={healthStyles.tableRowNoBottom}>
							<View style={[healthStyles.tableCell, { width: "25%" }]}>
								<Text>{policy.expiryDate}</Text>
							</View>
							<View style={[healthStyles.tableCell, { width: "25%" }]}>
								<Text>{policy.policyNumber}</Text>
							</View>
							<View style={[healthStyles.tableCell, { width: "25%" }]}>
								<Text>{policy.company}</Text>
							</View>
							<View style={[healthStyles.tableCellLast, { width: "25%" }]}>
								<Text>{policy.branch}</Text>
								{policy.branch.toLowerCase().includes("covid") && (
									<Text style={healthStyles.covidInfo}>
										({policy.branch.toLowerCase().includes("sin") ? "Sin" : "Con"} cobertura covid)
									</Text>
								)}
							</View>
						</View>
						{/* Prima de Renovación - Ahora dentro del map de policies */}
						{policy.manualFields?.renewalPremium ? (
							<View style={healthStyles.renewalPremium}>
								<Text style={healthStyles.renewalText}>
									PRIMA DE RENOVACIÓN ANUAL: {formatUSD(policy.manualFields.renewalPremium)}
								</Text>
							</View>
						) : (
							<View style={healthStyles.missingDataBox}>
								<Text style={healthStyles.missingDataText}>
									⚠️ FALTA: Prima de renovación anual (completar manualmente)
								</Text>
							</View>
						)}
					</View>
				))}
			</View>

			{/* Lista de Asegurados */}
			<View style={healthStyles.aseguradosSection}>
				<Text style={healthStyles.aseguradosTitle}>Asegurados.</Text>
				<Text style={healthStyles.aseguradoName}>{letterData.client.name.toUpperCase()}</Text>

				{/* Si es la póliza de VILLEGAS ORELLANA, GONZALO, mostrar asegurados adicionales */}
				{letterData.client.name.includes("VILLEGAS") && (
					<>
						<Text style={healthStyles.aseguradoName}>VILLEGAS SAGARNAGA, ADRIAN</Text>
						<Text style={healthStyles.aseguradoName}>VILLEGAS SAGARNAGA, NOAH</Text>
						<Text style={healthStyles.aseguradoName}>SAGARNAGA FOREST, RAISA VIVIANA</Text>
					</>
				)}
			</View>
		</BaseTemplate>
	);
};
