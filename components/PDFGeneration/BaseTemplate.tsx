// components/PDFGeneration/BaseTemplate.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { LetterData } from "@/types/pdf";
import { PDF_ASSETS } from "@/utils/pdfAssets";

// Registrar fuentes
Font.register({
	family: "Helvetica",
	fonts: [
		{ src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf" },
		{ src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf", fontWeight: "bold" },
	],
});

const styles = StyleSheet.create({
	page: {
		flexDirection: "column",
		backgroundColor: "#ffffff",
		// Reducir el padding general de la página para ganar espacio
		padding: 30, // Antes 40
		fontFamily: "Helvetica",
		fontSize: 10,
		lineHeight: 1.4,
	},
	header: {
		flexDirection: "column",
		// alignItems: "center",
		marginBottom: 10, // Antes 20
	},
	logo: {
		width: 150,
		marginBottom: 5,
	},
	headerText: {
		fontSize: 10,
		marginBottom: 5,
		textAlign: "left",
	},
	referenceNumber: {
		fontSize: 10,
		marginBottom: 5,
		textAlign: "left",
	},
	clientInfo: {
		marginBottom: 10, // Antes 20
	},
	clientName: {
		fontSize: 10,
		fontWeight: "bold",
	},
	clientDetails: {
		fontSize: 10,
	},
	present: {
		marginBottom: 5,
	},
	subject: {
		fontSize: 11,
		fontWeight: "bold",
		marginBottom: 15, // Antes 15
		textAlign: "left",
		textDecoration: "underline",
	},
	greeting: {
		marginBottom: 15, // Antes 15
		fontSize: 10,
	},
	content: {
		marginBottom: 5, // Antes 20
	},
	paragraph: {
		marginBottom: 10,
		textAlign: "justify",
	},
	signature: {
		textAlign: "left",
	},
	signatureBlock: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 10, // Antes 40
		paddingHorizontal: 20,
	},
	signatureColumn: {
		width: "45%",
		alignItems: "center",
	},
	signatureImage: {
		width: 100,
		height: 50,
		objectFit: "contain",
	},
	signatureName: {
		fontSize: 8,
		fontWeight: "bold",
		marginTop: 5,
	},
	signatureTitle: {
		fontSize: 7,
		marginTop: 2,
	},
	companyName: {
		fontSize: 11,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 5,
	},
	companySubtitle: {
		fontSize: 9,
		textAlign: "center",
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
		fontSize: 8,
		fontWeight: "bold",
		textAlign: "center",
	},
	footer: {
		fontSize: 6,
		borderTopWidth: 1,
		borderTopColor: "#e5e7eb",
		paddingTop: 5,
		marginBottom: 0,
	},
	footerText: {
		fontSize: 6,
		marginBottom: 0,
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
				{/* Header con Logo */}
				<View style={styles.header}>
					<Image style={styles.logo} src={PDF_ASSETS.PATRIA_LOGO} />
					<Text style={styles.headerText}>Santa Cruz, {letterData.date}</Text>
					<Text style={styles.referenceNumber}>{letterData.referenceNumber}</Text>
				</View>

				{/* Información del Cliente */}
				<View style={styles.clientInfo}>
					<Text style={styles.clientName}>
						{letterData.client.name.includes("SRL") || letterData.client.name.includes("S.A.") ? "Señores" : letterData.client.name.includes("BETTY") ? "Señora" : "Señor"}
					</Text>
					<Text style={styles.clientName}>{letterData.client.name.toUpperCase()}</Text>
					{letterData.client.phone && (
						<Text style={styles.clientDetails}>
							{letterData.client.name.includes("SRL") ? "Teléfono" : "Telf"}: {letterData.client.phone}
						</Text>
					)}
					{letterData.client.email && <Text style={styles.clientDetails}>Correo: {letterData.client.email}</Text>}
					<Text style={styles.present}>Presente.</Text>
				</View>

				{/* Asunto */}
				<View>
					<Text style={styles.subject}>
						Ref.: AVISO DE VENCIMIENTO
						{letterData.templateType === "salud" ? " POLIZA DE SEGURO SALUD" : " POLIZA DE SEGURO"}
					</Text>
				</View>

				{/* Saludo */}
				<View>
					<Text style={styles.greeting}>De nuestra consideración:</Text>
				</View>

				{/* Contenido */}
				<View style={styles.content}>
					<Text style={styles.paragraph}>
						Por medio de la presente, nos permitimos recordarle que se aproxima el vencimiento de la
						{letterData.policies.length > 1 ? "s" : ""} Póliza{letterData.policies.length > 1 ? "s" : ""} de Seguro cuyos detalles se especifican a continuación:
					</Text>

					{/* Contenido dinámico basado en la plantilla */}
					{children}

					<Text style={styles.paragraph}>
						{letterData.templateType === "salud"
							? "Tenga a bien hacernos conocer cualquier cambio que desea realizar o en su defecto su consentimiento para la renovación."
							: "Requerimos revisar los datos y el valor asegurado, esto para proceder si corresponde, con la actualización o modificación de esto(s). Tenga a bien hacernos a conocer cualquier cambio que se haya producido o en su defecto su consentimiento para la renovación."}
					</Text>

					{letterData.templateType === "salud" && (
						<Text style={styles.paragraph}>
							Nos permitimos recordarle que los seguros de Salud o Enfermedad se pagan por adelantado, al inicio de la vigencia, sea mensual o anual. En caso de tener primas pendientes no se podrá
							renovar.
						</Text>
					)}

					<Text style={styles.paragraph}>
						Es importante informarle que
						{letterData.templateType !== "salud" ? ", en caso de tener primas pendientes no se podrá renovar hasta su regularización de estas," : " la"} NO RENOVACION, suspende toda cobertura de la
						póliza de seguro.
					</Text>

					<Text style={styles.paragraph}>De esta manera quedamos a la espera de su respuesta, nos despedimos con la cordialidad de siempre.</Text>
				</View>

				{/* Firma */}
				<View style={styles.signature}>
					<Text>Atentamente,</Text>
				</View>

				{/* Firma Corporativa */}
				<View style={styles.companyName}>
					<Text>PATRIA S.A.</Text>
					<Text style={styles.companySubtitle}>Corredores y Asesores en Seguros</Text>
				</View>

				{/* Bloque de firmas */}
				<View style={styles.signatureBlock}>
					<View style={styles.signatureColumn}>
						<Image style={styles.signatureImage} src={PDF_ASSETS.SIGNATURE_CARMEN} />
						<Text style={styles.signatureName}>Carmen R. Ferrufino Howard</Text>
					</View>

					<View style={styles.signatureColumn}>
						<Image style={styles.signatureImage} src={PDF_ASSETS.SIGNATURE_MARIA} />
						<Text style={styles.signatureName}>Maria Ercilia Vargas Becerra</Text>
					</View>
				</View>
			</Page>
		</Document>
	);
};
