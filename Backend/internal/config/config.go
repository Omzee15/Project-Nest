package config

import (
	"os"
	"strings"
)

type Config struct {
	// Database
	DatabaseURL string // For production (Render) - full PostgreSQL URL
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
	DBSSLMode   string

	// Server
	ServerPort string
	ServerHost string

	// Application
	AppEnv   string
	LogLevel string

	// Authentication
	JWTSecret string

	// CORS
	CORSAllowedOrigins []string
}

func Load() *Config {
	return &Config{
		// Database
		DatabaseURL: getEnv("DATABASE_URL", ""), // For production (Render)
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBUser:      getEnv("DB_USER", "postgres"),
		DBPassword:  getEnv("DB_PASSWORD", "password"),
		DBName:      getEnv("DB_NAME", "lucid_lists"),
		DBSSLMode:   getEnv("DB_SSLMODE", "disable"),

		// Server
		ServerPort: getEnv("PORT", "8080"),
		ServerHost: getEnv("SERVER_HOST", "localhost"),

		// Application
		AppEnv:   getEnv("APP_ENV", "development"),
		LogLevel: getEnv("LOG_LEVEL", "info"),

		// Authentication
		JWTSecret: getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production"),

		// CORS
		CORSAllowedOrigins: getCORSOrigins(),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getCORSOrigins() []string {
	// Default to common localhost ports for development
	defaultOrigins := "http://localhost:5173,http://localhost:3000,http://localhost:8080,http://localhost:8082,http://localhost:8081"
	origins := getEnv("CORS_ALLOWED_ORIGINS", defaultOrigins)
	frontendPort := getEnv("FRONTEND_PORT", "")

	originList := strings.Split(origins, ",")

	// Add dynamic frontend port origin if specified
	if frontendPort != "" {
		dynamicOrigin := "http://localhost:" + frontendPort
		// Check if it's not already in the list
		found := false
		for _, origin := range originList {
			if strings.TrimSpace(origin) == dynamicOrigin {
				found = true
				break
			}
		}
		if !found {
			originList = append(originList, dynamicOrigin)
		}
	}

	return originList
}
