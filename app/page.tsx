'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, BarChart3, Mail, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/FileUpload';
import { ProcessedInsuranceRecord } from '@/types/insurance';

export default function HomePage() {
  const [insuranceData, setInsuranceData] = useState<ProcessedInsuranceRecord[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'dashboard'>('upload');
  const [error, setError] = useState<string>('');

  const handleDataLoaded = (data: ProcessedInsuranceRecord[]) => {
    setInsuranceData(data);
    setCurrentStep('dashboard');
    setError('');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const resetToUpload = () => {
    setCurrentStep('upload');
    setInsuranceData([]);
    setError('');
  };

  // Calcular estadísticas rápidas
  const stats = React.useMemo(() => {
    if (insuranceData.length === 0) return null;

    const total = insuranceData.length;
    const critical = insuranceData.filter(r => r.status === 'critical').length;
    const dueSoon = insuranceData.filter(r => r.status === 'due_soon').length;
    const pending = insuranceData.filter(r => r.status === 'pending').length;
    const expired = insuranceData.filter(r => r.status === 'expired').length;
    const totalValue = insuranceData.reduce((sum, r) => sum + r.valorAsegurado, 0);

    return { total, critical, dueSoon, pending, expired, totalValue };
  }, [insuranceData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="patria-gradient shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-patria-blue font-bold text-xl">P</span>
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">PATRIA S.A.</h1>
                <p className="text-blue-100 text-sm">Sistema de Cartas de Vencimiento</p>
              </div>
            </div>
            
            {currentStep === 'dashboard' && (
              <Button
                variant="ghost"
                onClick={resetToUpload}
                className="text-white hover:bg-white/10"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Nuevo Archivo
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'upload' ? (
          <div className="space-y-8">
            {/* Título de bienvenida */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Bienvenido al Sistema de Cartas de Vencimiento
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Sube tu archivo Excel con los datos de seguros y automatiza la creación 
                y envío de cartas de vencimiento a tus clientes.
              </p>
            </div>

            {/* Características del sistema */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="patria-card">
                <CardContent className="p-6 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-patria-blue mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Carga de Datos</h3>
                  <p className="text-sm text-gray-600">
                    Procesa archivos Excel con validación automática
                  </p>
                </CardContent>
              </Card>

              <Card className="patria-card">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-12 w-12 text-patria-green mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Dashboard</h3>
                  <p className="text-sm text-gray-600">
                    Visualiza y filtra datos de manera intuitiva
                  </p>
                </CardContent>
              </Card>

              <Card className="patria-card">
                <CardContent className="p-6 text-center">
                  <Mail className="h-12 w-12 text-patria-blue mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Envío Automático</h3>
                  <p className="text-sm text-gray-600">
                    Genera y envía cartas por email o descarga en ZIP
                  </p>
                </CardContent>
              </Card>

              <Card className="patria-card">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-patria-green mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Seguimiento</h3>
                  <p className="text-sm text-gray-600">
                    Control completo del estado de las notificaciones
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Error display */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="font-medium">Error:</p>
                  </div>
                  <p className="text-red-700 mt-1">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* File upload component */}
            <FileUpload
              onDataLoaded={handleDataLoaded}
              onError={handleError}
            />

            {/* Instrucciones */}
            <Card className="patria-card">
              <CardHeader>
                <CardTitle className="text-patria-blue">Instrucciones</CardTitle>
                <CardDescription>
                  Asegúrate de que tu archivo Excel contenga las siguientes columnas:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Columnas Requeridas:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• <span className="font-medium">FIN DE VIGENCIA</span> - Fecha de vencimiento</li>
                      <li>• <span className="font-medium">COMPAÑÍA</span> - Aseguradora</li>
                      <li>• <span className="font-medium">NO. PÓLIZA</span> - Número de póliza</li>
                      <li>• <span className="font-medium">ASEGURADO</span> - Nombre del cliente</li>
                      <li>• <span className="font-medium">EJECUTIVO</span> - Ejecutivo a cargo</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Columnas Opcionales:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• <span className="font-medium">TELÉFONO</span> - Contacto del cliente</li>
                      <li>• <span className="font-medium">CORREO/DIRECCION</span> - Email del cliente</li>
                      <li>• <span className="font-medium">VALOR ASEGURADO</span> - Monto asegurado</li>
                      <li>• <span className="font-medium">PRIMA</span> - Prima del seguro</li>
                      <li>• <span className="font-medium">RAMO</span> - Tipo de seguro</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Dashboard view */
          <div className="space-y-6">
            {/* Stats cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="patria-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Registros</div>
                  </CardContent>
                </Card>

                <Card className="patria-card border-red-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                    <div className="text-sm text-gray-600">Críticos (≤5 días)</div>
                  </CardContent>
                </Card>

                <Card className="patria-card border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.dueSoon}</div>
                    <div className="text-sm text-gray-600">Próximos (6-30 días)</div>
                  </CardContent>
                </Card>

                <Card className="patria-card border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                    <div className="text-sm text-gray-600">Pendientes (+30 días)</div>
                  </CardContent>
                </Card>

                <Card className="patria-card border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
                    <div className="text-sm text-gray-600">Vencidos</div>
                  </CardContent>
                </Card>

                <Card className="patria-card border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-green-600">
                      {new Intl.NumberFormat('es-BO', {
                        style: 'currency',
                        currency: 'BOB',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(stats.totalValue)}
                    </div>
                    <div className="text-sm text-gray-600">Valor Total</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-4">
              <Button className="patria-btn-primary">
                <Mail className="h-4 w-4 mr-2" />
                Generar Cartas
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Dashboard Completo
              </Button>
              <Button variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Alertas Críticas ({stats?.critical || 0})
              </Button>
            </div>

            {/* Quick preview table */}
            <Card className="patria-card">
              <CardHeader>
                <CardTitle>Vista Previa de Datos</CardTitle>
                <CardDescription>
                  Mostrando los primeros 10 registros. Haz clic en "Ver Dashboard Completo" para ver todas las opciones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Asegurado</th>
                        <th>Compañía</th>
                        <th>No. Póliza</th>
                        <th>Vencimiento</th>
                        <th>Días Restantes</th>
                        <th>Estado</th>
                        <th>Ejecutivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insuranceData.slice(0, 10).map((record, index) => (
                        <tr key={record.id || index}>
                          <td className="font-medium">{record.asegurado}</td>
                          <td>{record.compania}</td>
                          <td className="font-mono text-sm">{record.noPoliza}</td>
                          <td>{new Date(record.finDeVigencia).toLocaleDateString('es-BO')}</td>
                          <td className={`font-medium ${
                            record.daysUntilExpiry <= 5 ? 'text-red-600' : 
                            record.daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {record.daysUntilExpiry} días
                          </td>
                          <td>
                            <span className={`status-badge ${record.status}`}>
                              {record.status === 'critical' ? 'Crítico' :
                               record.status === 'due_soon' ? 'Próximo' :
                               record.status === 'pending' ? 'Pendiente' :
                               record.status === 'expired' ? 'Vencido' : 'Enviado'}
                            </span>
                          </td>
                          <td>{record.ejecutivo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {insuranceData.length > 10 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Mostrando 10 de {insuranceData.length} registros
                    </p>
                    <Button variant="outline" className="mt-2">
                      Ver Todos los Registros
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}