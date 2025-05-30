// components/PDFGeneration/BaseTemplate.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { PDF_CONSTANTS } from "@/utils/pdfutils";
import { LetterData } from "@/types/pdf";

// Registrar fuentes (esto se haría en la configuración inicial)
// Font.register({
//   family: 'Helvetica',
//   src: '/fonts/Helvetica.ttf'
// });

const styles = StyleSheet.create({
	page: {
		flexDirection: "column",
		backgroundColor: "#ffffff",
		paddingTop: PDF_CONSTANTS.MARGINS.top,
		paddingBottom: PDF_CONSTANTS.MARGINS.bottom,
		paddingLeft: PDF_CONSTANTS.MARGINS.left,
		paddingRight: PDF_CONSTANTS.MARGINS.right,
		fontFamily: PDF_CONSTANTS.FONTS.primary,
		fontSize: PDF_CONSTANTS.FONTS.size.body,
		lineHeight: 1.4,
	},
	header: {
		marginBottom: 30,
	},
	headerLocation: {
		textAlign: "right",
		fontSize: PDF_CONSTANTS.FONTS.size.body,
		marginBottom: 10,
		color: PDF_CONSTANTS.COLORS.textSecondary,
	},
	headerReference: {
		textAlign: "right",
		fontSize: PDF_CONSTANTS.FONTS.size.body,
		marginBottom: 20,
		color: PDF_CONSTANTS.COLORS.textSecondary,
	},
	clientInfo: {
		marginBottom: 20,
	},
	clientName: {
		fontSize: PDF_CONSTANTS.FONTS.size.header,
		fontFamily: PDF_CONSTANTS.FONTS.bold,
		marginBottom: 5,
		color: PDF_CONSTANTS.COLORS.textPrimary,
	},
	clientDetails: {
		fontSize: PDF_CONSTANTS.FONTS.size.body,
		color: PDF_CONSTANTS.COLORS.textSecondary,
		marginBottom: 2,
	},
	subject: {
		fontSize: PDF_CONSTANTS.FONTS.size.header,
		fontFamily: PDF_CONSTANTS.FONTS.bold,
		marginBottom: 20,
		textAlign: "center",
		textDecoration: "underline",
		color: PDF_CONSTANTS.COLORS.patriaBlue,
	},
	greeting: {
		marginBottom: 15,
		fontSize: PDF_CONSTANTS.FONTS.size.body,
	},
	content: {
		flex: 1,
		marginBottom: 20,
	},
	paragraph: {
		marginBottom: 12,
		textAlign: "justify",
		lineHeight: 1.5,
	},
	footer: {
		borderTopWidth: 1,
		borderTopColor: PDF_CONSTANTS.COLORS.border,
		paddingTop: 15,
		textAlign: "center",
	},
	signature: {
		marginTop: 30,
		textAlign: "center",
	},
	companyName: {
		fontSize: PDF_CONSTANTS.FONTS.size.header,
		fontFamily: PDF_CONSTANTS.FONTS.bold,
		color: PDF_CONSTANTS.COLORS.patriaBlue,
		marginBottom: 5,
	},
	companySubtitle: {
		fontSize: PDF_CONSTANTS.FONTS.size.body,
		color: PDF_CONSTANTS.COLORS.textSecondary,
	},
	warningBox: {
		backgroundColor: "#fef3cd",
		borderWidth: 1,
		borderColor: "#ffc107",
		padding: 10,
		marginBottom: 15,
		borderRadius: 4,
	},
	warningText: {
		color: "#856404",
		fontSize: PDF_CONSTANTS.FONTS.size.small,
		fontFamily: PDF_CONSTANTS.FONTS.bold,
		textAlign: "center",
	},
});

interface BaseTemplateProps {
	letterData: LetterData;
	children: React.ReactNode;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({ letterData, children }) => {
	return (
		<Document>
			<Page size="LETTER" style={styles.page}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.headerLocation}>Santa Cruz, {letterData.date}</Text>
					<Text style={styles.headerReference}>{letterData.referenceNumber}</Text>
				</View>

				{/* Client Information */}
				<View style={styles.clientInfo}>
					<Text style={styles.clientName}>{letterData.client.name.toUpperCase()}</Text>
					{letterData.client.phone && (
						<Text style={styles.clientDetails}>Telf: {letterData.client.phone}</Text>
					)}
					{letterData.client.email && (
						<Text style={styles.clientDetails}>Correo: {letterData.client.email}</Text>
					)}
					<Text style={styles.clientDetails}>Presente.</Text>
				</View>

				{/* Subject */}
				<View>
					<Text style={styles.subject}>
						AVISO DE VENCIMIENTO{" "}
						{letterData.templateType === "salud" ? "PÓLIZA DE SEGURO SALUD" : "PÓLIZA DE SEGURO"}
					</Text>
				</View>

				{/* Greeting */}
				<View>
					<Text style={styles.greeting}>De nuestra consideración:</Text>
				</View>

				{/* Content Area */}
				<View style={styles.content}>
					<Text style={styles.paragraph}>
						Por medio de la presente, nos permitimos recordarle que se aproxima el vencimiento de la
						{letterData.policies.length > 1 ? "s" : ""} Póliza{letterData.policies.length > 1 ? "s" : ""} de
						Seguro cuyos detalles se especifican a continuación:
					</Text>

					{/* Dynamic content based on template */}
					{children}

					<Text style={styles.paragraph}>
						{letterData.templateType === "salud"
							? "Tenga a bien hacernos conocer cualquier cambio que desea realizar o en su defecto su consentimiento para la renovación."
							: "Requerimos revisar los datos y el valor asegurado, esto para proceder si corresponde, con la actualización o modificación de esto(s). Tenga a bien hacernos a conocer cualquier cambio que se haya producido o en su defecto su consentimiento para la renovación."}
					</Text>

					{letterData.templateType === "salud" && (
						<Text style={styles.paragraph}>
							Nos permitimos recordarle que los seguros de Salud o Enfermedad se pagan por adelantado, al
							inicio de la vigencia, sea mensual o anual. En caso de tener primas pendientes no se podrá
							renovar.
						</Text>
					)}

					<Text style={styles.paragraph}>
						Es importante informarle que
						{letterData.templateType === "salud"
							? ""
							: ", en caso de tener primas pendientes no se podrá renovar hasta su regularización de estas,"}{" "}
						la NO RENOVACIÓN, suspende toda cobertura de la póliza de seguro.
					</Text>

					<Text style={styles.paragraph}>
						De esta manera quedamos a la espera de su respuesta y nos despedimos con la cordialidad de
						siempre.
					</Text>
				</View>

				{/* Warning for manual review */}
				{letterData.needsReview && (
					<View style={styles.warningBox}>
						<Text style={styles.warningText}>⚠️ CARTA REQUIERE REVISIÓN MANUAL - DATOS INCOMPLETOS</Text>
					</View>
				)}

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={styles.signature}>Atentamente,</Text>
					<Text style={styles.companyName}>PATRIA S.A.</Text>
					<Text style={styles.companySubtitle}>Corredores y Asesores en Seguros</Text>
					<Text style={styles.clientDetails}>CC/*crfh</Text>
					<Text style={styles.clientDetails}>CC.: File</Text>
					<Text style={styles.clientDetails}>Adj.: Lo citado</Text>
				</View>
			</Page>
		</Document>
	);
};
