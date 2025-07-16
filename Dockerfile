# Etapa de desarrollo
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm install

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

WORKDIR /app

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/data ./data
COPY --from=builder /app/.env.example ./.env

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Crear directorios necesarios y configurar permisos
RUN mkdir -p logs data && \
    chown -R node:node /app

# Cambiar al usuario node por seguridad
USER node

# Exponer puerto
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["sh", "-c", "npm run init:data && npm run start:prod"]

# Etapa de desarrollo (para usar con docker-compose)
FROM builder AS development

# Crear directorios necesarios y configurar permisos
RUN mkdir -p logs data && \
    chown -R node:node /app

# Cambiar al usuario node por seguridad
USER node

# El comando de ejecución viene del docker-compose 