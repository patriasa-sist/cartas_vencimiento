// components/PDFGeneration/LetterGenerator.tsx
"use client";

import React, { useState, useMemo } from "react";
import { FileText, Download, Eye, AlertTriangle, CheckCircle, X, Edit3, Save, RefreshCw, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProcessedInsuranceRecord } from "@/types/insurance";
import { LetterData, GeneratedLetter, PDFGenerationResult } from "@/types/pdf";
import {
	groupRecordsForLetters,
	validateRecordForPDF,
	generateFileName,
	formatUSD,
	formatCurrency,
} from "@/utils/pdfutils";
import { pdf } from "@react-pdf/renderer";
import { HealthTemplate } from "./HealthTemplate";
import { GeneralTemplate } from "./GeneralTemplate";
import JSZip from "jszip";

interface LetterGeneratorProps {
	selectedRecords: ProcessedInsuranceRecord[];
	onClose: () => void;
	onGenerated?: (result: PDFGenerationResult) => void;
}

export default function LetterGenerator({ selectedRecords, onClose, onGenerated }: LetterGeneratorProps) {
	const [letters, setLetters] = useState<LetterData[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [editingLetter, setEditingLetter] = useState<string | null>(null);
	const [previewLetter, setPreviewLetter] = useState<string | null>(null);
	const [generationResult, setGenerationResult] = useState<PDFGenerationResult | null>(null);

	// Preparar cartas basándose en los registros seleccionados
	const preparedLetters = useMemo(() => {
		const validRecords: ProcessedInsuranceRecord[] = [];
		const validationErrors: string[] = [];

		selectedRecords.forEach((record, index) => {
			const validation = validateRecordForPDF(record);
			if (validation.valid) {
				validRecords.push(record);
			} else {
				validationErrors.push(`Registro ${index + 1} (${record.asegurado}): ${validation.errors.join(", ")}`);
			}
		});

		const groupedLetters = groupRecordsForLetters(validRecords);
		setLetters(groupedLetters);

		return {
			letters: groupedLetters,
			validRecords: validRecords.length,
			totalRecords: selectedRecords.length,
			validationErrors,
		};
	}, [selectedRecords]);

	// Estadísticas
	const stats = useMemo(() => {
		const saludCount = letters.filter((l) => l.templateType === "salud").length;
		const generalCount = letters.filter((l) => l.templateType === "general").length;
		const needReviewCount = letters.filter((l) => l.needsReview).length;
		const totalPolicies = letters.reduce((sum, l) => sum + l.policies.length, 0);

		return {
			totalLetters: letters.length,
			saludCount,
			generalCount,
			needReviewCount,
			totalPolicies,
		};
	}, [letters]);

	// Actualizar datos de una carta
	const updateLetterData = (letterId: string, updates: Partial<LetterData>) => {
		setLetters((prev) => prev.map((letter) => (letter.id === letterId ? { ...letter, ...updates } : letter)));
	};

	// Generar PDF para una carta específica
	const generateSinglePDF = async (letterData: LetterData): Promise<Blob> => {
		const TemplateComponent = letterData.templateType === "salud" ? HealthTemplate : GeneralTemplate;

		// Crear el elemento directamente sin React.createElement
		const pdfBlob = await pdf(<TemplateComponent letterData={letterData} />).toBlob();
		return pdfBlob;
	};

	// Preview de una carta
	const handlePreview = async (letterId: string) => {
		setPreviewLetter(letterId);
		const letter = letters.find((l) => l.id === letterId);
		if (letter) {
			try {
				const pdfBlob = await generateSinglePDF(letter);
				const pdfUrl = URL.createObjectURL(pdfBlob);
				window.open(pdfUrl, "_blank");
			} catch (error) {
				console.error("Error generating preview:", error);
				alert("Error al generar la vista previa");
			}
		}
		setPreviewLetter(null);
	};

	// Descargar carta individual
	const handleDownloadSingle = async (letterId: string) => {
		const letter = letters.find((l) => l.id === letterId);
		if (!letter) return;

		try {
			setIsGenerating(true);
			const pdfBlob = await generateSinglePDF(letter);
			const fileName = generateFileName(letter.client.name, letter.templateType);

			const url = URL.createObjectURL(pdfBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error generating PDF:", error);
			alert("Error al generar el PDF");
		} finally {
			setIsGenerating(false);
		}
	};

	// Generar y descargar todas las cartas como ZIP
	const handleDownloadAll = async () => {
		try {
			setIsGenerating(true);
			const zip = new JSZip();
			const generatedLetters: GeneratedLetter[] = [];
			const errors: string[] = [];

			for (const letter of letters) {
				try {
					const pdfBlob = await generateSinglePDF(letter);
					const fileName = generateFileName(letter.client.name, letter.templateType);

					zip.file(fileName, pdfBlob);

					generatedLetters.push({
						letterId: letter.id,
						clientName: letter.client.name,
						templateType: letter.templateType,
						fileName,
						pdfBlob,
						policyCount: letter.policies.length,
						needsReview: letter.needsReview,
						missingData: letter.missingData,
					});
				} catch (error) {
					const errorMsg = `Error generando carta para ${letter.client.name}: ${error}`;
					errors.push(errorMsg);
					console.error(errorMsg);
				}
			}

			const zipBlob = await zip.generateAsync({ type: "blob" });
			const zipFileName = `Cartas_Vencimiento_${new Date().toISOString().slice(0, 10)}.zip`;

			const url = URL.createObjectURL(zipBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = zipFileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			const result: PDFGenerationResult = {
				success: generatedLetters.length > 0,
				letters: generatedLetters,
				errors,
				totalGenerated: generatedLetters.length,
			};

			setGenerationResult(result);
			onGenerated?.(result);
		} catch (error) {
			console.error("Error generating ZIP:", error);
			alert("Error al generar el archivo ZIP");
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 flex items-center">
						<FileText className="h-6 w-6 mr-2 text-patria-blue" />
						Generador de Cartas
					</h2>
					<p className="text-gray-600">
						{stats.totalLetters} cartas para {stats.totalPolicies} pólizas
					</p>
				</div>

				<div className="flex items-center space-x-3">
					<Button
						onClick={handleDownloadAll}
						disabled={isGenerating || letters.length === 0}
						className="patria-btn-primary"
					>
						{isGenerating ? (
							<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<Package className="h-4 w-4 mr-2" />
						)}
						Descargar Todo (ZIP)
					</Button>
					<Button variant="outline" onClick={onClose}>
						<X className="h-4 w-4 mr-2" />
						Cerrar
					</Button>
				</div>
			</div>

			{/* Estadísticas */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-patria-blue">{stats.totalLetters}</div>
						<div className="text-sm text-gray-600">Total Cartas</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-patria-green">{stats.saludCount}</div>
						<div className="text-sm text-gray-600">Salud</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-blue-600">{stats.generalCount}</div>
						<div className="text-sm text-gray-600">General</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-red-600">{stats.needReviewCount}</div>
						<div className="text-sm text-gray-600">Revisar</div>
					</CardContent>
				</Card>
			</div>

			{/* Errores de validación */}
			{preparedLetters.validationErrors.length > 0 && (
				<Alert className="border-yellow-200 bg-yellow-50">
					<AlertTriangle className="h-4 w-4 text-yellow-600" />
					<AlertDescription className="text-yellow-800">
						<div className="font-medium mb-2">
							{preparedLetters.validationErrors.length} registros omitidos por datos faltantes:
						</div>
						<ul className="text-sm space-y-1 list-disc list-inside max-h-32 overflow-y-auto">
							{preparedLetters.validationErrors.slice(0, 5).map((error, index) => (
								<li key={index}>{error}</li>
							))}
							{preparedLetters.validationErrors.length > 5 && (
								<li>... y {preparedLetters.validationErrors.length - 5} más</li>
							)}
						</ul>
					</AlertDescription>
				</Alert>
			)}

			{/* Lista de cartas */}
			<div className="space-y-4">
				{letters.map((letter) => (
					<LetterCard
						key={letter.id}
						letter={letter}
						isEditing={editingLetter === letter.id}
						isPreviewing={previewLetter === letter.id}
						isGenerating={isGenerating}
						onEdit={() => setEditingLetter(letter.id)}
						onSaveEdit={(updates) => {
							updateLetterData(letter.id, updates);
							setEditingLetter(null);
						}}
						onCancelEdit={() => setEditingLetter(null)}
						onPreview={() => handlePreview(letter.id)}
						onDownload={() => handleDownloadSingle(letter.id)}
					/>
				))}
			</div>

			{/* Resultado de generación */}
			{generationResult && (
				<Card className="border-green-200 bg-green-50">
					<CardContent className="p-4">
						<div className="flex items-center">
							<CheckCircle className="h-5 w-5 text-green-600 mr-2" />
							<div>
								<div className="font-medium text-green-800">
									✅ {generationResult.totalGenerated} cartas generadas exitosamente
								</div>
								{generationResult.errors.length > 0 && (
									<div className="text-sm text-red-600 mt-1">
										{generationResult.errors.length} errores encontrados
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// Componente para cada carta individual
interface LetterCardProps {
	letter: LetterData;
	isEditing: boolean;
	isPreviewing: boolean;
	isGenerating: boolean;
	onEdit: () => void;
	onSaveEdit: (updates: Partial<LetterData>) => void;
	onCancelEdit: () => void;
	onPreview: () => void;
	onDownload: () => void;
}

function LetterCard({
	letter,
	isEditing,
	isPreviewing,
	isGenerating,
	onEdit,
	onSaveEdit,
	onCancelEdit,
	onPreview,
	onDownload,
}: LetterCardProps) {
	const [editedLetter, setEditedLetter] = useState<LetterData>(letter);

	const handleSave = () => {
		onSaveEdit(editedLetter);
	};

	const updatePolicy = (policyIndex: number, field: string, value: any) => {
		setEditedLetter((prev) => ({
			...prev,
			policies: prev.policies.map((policy, index) =>
				index === policyIndex
					? {
							...policy,
							manualFields: {
								...policy.manualFields,
								[field]: value,
							},
					  }
					: policy
			),
		}));
	};

	const getTemplateIcon = (type: "salud" | "general") => {
		return type === "salud" ? "🏥" : "🚗";
	};

	const getTemplateColor = (type: "salud" | "general") => {
		return type === "salud" ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50";
	};

	return (
		<Card
			className={`${getTemplateColor(letter.templateType)} ${
				letter.needsReview ? "border-l-4 border-l-red-500" : ""
			}`}
		>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="text-2xl">{getTemplateIcon(letter.templateType)}</div>
						<div>
							<CardTitle className="text-lg">{letter.client.name}</CardTitle>
							<CardDescription>
								{letter.policies.length} póliza{letter.policies.length > 1 ? "s" : ""} • Template{" "}
								{letter.templateType} • Ref: {letter.referenceNumber}
							</CardDescription>
						</div>
					</div>

					<div className="flex items-center space-x-2">
						{letter.needsReview && (
							<Badge variant="destructive" className="text-xs">
								<AlertTriangle className="h-3 w-3 mr-1" />
								Revisar
							</Badge>
						)}

						<Badge variant={letter.templateType === "salud" ? "default" : "secondary"} className="text-xs">
							{letter.templateType.toUpperCase()}
						</Badge>

						<div className="flex space-x-1">
							{!isEditing ? (
								<>
									<Button size="sm" variant="outline" onClick={onEdit} disabled={isGenerating}>
										<Edit3 className="h-4 w-4" />
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={onPreview}
										disabled={isGenerating || isPreviewing}
									>
										{isPreviewing ? (
											<RefreshCw className="h-4 w-4 animate-spin" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</Button>
									<Button
										size="sm"
										onClick={onDownload}
										disabled={isGenerating}
										className="patria-btn-primary"
									>
										<Download className="h-4 w-4" />
									</Button>
								</>
							) : (
								<>
									<Button size="sm" onClick={handleSave} className="patria-btn-primary">
										<Save className="h-4 w-4" />
									</Button>
									<Button size="sm" variant="outline" onClick={onCancelEdit}>
										<X className="h-4 w-4" />
									</Button>
								</>
							)}
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent>
				{/* Información del cliente */}
				<div className="mb-4 p-3 bg-white rounded border">
					<h4 className="font-medium text-gray-900 mb-2">Información del Cliente</h4>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-gray-600">Teléfono:</span> {letter.client.phone || "No especificado"}
						</div>
						<div>
							<span className="text-gray-600">Email:</span> {letter.client.email || "No especificado"}
						</div>
					</div>
				</div>

				{/* Lista de pólizas */}
				<div className="space-y-3">
					<h4 className="font-medium text-gray-900">Pólizas ({letter.policies.length})</h4>

					{letter.policies.map((policy, index) => (
						<div key={index} className="p-3 bg-white rounded border">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								<div>
									<div className="font-medium text-gray-900">{policy.company}</div>
									<div className="text-gray-600">Póliza: {policy.policyNumber}</div>
									<div className="text-gray-600">Vence: {policy.expiryDate}</div>
								</div>

								<div>
									<div className="text-gray-600">Ramo: {policy.branch}</div>
									<div className="text-gray-600">
										Valor:{" "}
										{policy.insuredValue ? formatUSD(policy.insuredValue) : "No especificado"}
									</div>
									<div className="text-gray-600">
										Prima: {policy.premium ? formatCurrency(policy.premium) : "No especificado"}
									</div>
								</div>

								{/* Campos editables para datos faltantes */}
								<div className="space-y-2">
									{isEditing && (
										<>
											{letter.templateType === "salud" && (
												<div>
													<label className="text-xs text-gray-600">
														Prima renovación (USD):
													</label>
													<Input
														type="number"
														placeholder="0.00"
														value={policy.manualFields?.renewalPremium || ""}
														onChange={(e) =>
															updatePolicy(
																index,
																"renewalPremium",
																parseFloat(e.target.value) || 0
															)
														}
														className="text-xs h-8"
													/>
												</div>
											)}

											{letter.templateType === "general" && (
												<>
													<div>
														<label className="text-xs text-gray-600">Deducibles:</label>
														<Input
															placeholder="10% mínimo Bs 1.000"
															value={policy.manualFields?.deductibles || ""}
															onChange={(e) =>
																updatePolicy(index, "deductibles", e.target.value)
															}
															className="text-xs h-8"
														/>
													</div>

													<div>
														<label className="text-xs text-gray-600">
															Extraterritorialidad:
														</label>
														<Input
															placeholder="Bs 400 (contado) / Bs 500 (posterior)"
															value={policy.manualFields?.territoriality || ""}
															onChange={(e) =>
																updatePolicy(index, "territoriality", e.target.value)
															}
															className="text-xs h-8"
														/>
													</div>
												</>
											)}
										</>
									)}

									{!isEditing && policy.manualFields && (
										<div className="text-xs text-green-700">
											{letter.templateType === "salud" && policy.manualFields.renewalPremium && (
												<div>✓ Prima: {formatUSD(policy.manualFields.renewalPremium)}</div>
											)}
											{letter.templateType === "general" && policy.manualFields.deductibles && (
												<div>✓ Deducibles: {policy.manualFields.deductibles}</div>
											)}
											{letter.templateType === "general" &&
												policy.manualFields.territoriality && (
													<div>
														✓ Extraterritorialidad: {policy.manualFields.territoriality}
													</div>
												)}
										</div>
									)}
								</div>
							</div>

							{/* Materia asegurada */}
							{policy.insuredMatter && (
								<div className="mt-2 pt-2 border-t border-gray-200">
									<div className="text-xs text-gray-600">
										<span className="font-medium">Materia asegurada:</span> {policy.insuredMatter}
									</div>
								</div>
							)}
						</div>
					))}
				</div>

				{/* Datos faltantes */}
				{letter.missingData.length > 0 && (
					<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
						<div className="flex items-center mb-2">
							<AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
							<span className="font-medium text-red-800">Datos faltantes a completar:</span>
						</div>
						<ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
							{letter.missingData.slice(0, 3).map((item, index) => (
								<li key={index}>{item}</li>
							))}
							{letter.missingData.length > 3 && <li>... y {letter.missingData.length - 3} más</li>}
						</ul>
					</div>
				)}

				{/* Ejecutivo responsable */}
				<div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-600">
					<span className="font-medium">Ejecutivo:</span> {letter.executive}
				</div>
			</CardContent>
		</Card>
	);
}
