# ---- Stage 1: Build Stage ----
FROM node:20-alpine AS build

# Set working directory
WORKDIR /usr/src/app

# Copy entire repo (needed for Nx build)
COPY . .

# Install dependencies
RUN npm install

# Build the Nx server app
RUN npx nx build server

# ---- Stage 2: Runtime Stage ----
FROM node:20-alpine
WORKDIR /usr/src/app

# Copy only the built server output
COPY --from=build /usr/src/app/dist/apps/server ./dist

# Copy root package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Expose port for Cloud Run
EXPOSE 8080

# ✅ Run the compiled entry file
CMD ["node", "dist/main.js"]
