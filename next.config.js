/** @type {import('next').NextConfig} */
const nextConfig = {
	// Configuración para ExcelJS en server components
	serverExternalPackages: ["exceljs"],

	// Configuración de webpack como fallback
	webpack: (config) => {
		config.resolve.alias.canvas = false;
		config.resolve.alias.encoding = false;
		return config;
	},

	// Configuración de imágenes
	images: {
		domains: [],
	},

	// Headers de seguridad
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "origin-when-cross-origin",
					},
				],
			},
		];
	},
};

module.exports = nextConfig;
