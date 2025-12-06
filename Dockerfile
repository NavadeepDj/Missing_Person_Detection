# Build stage (Node 20 - Debian based for compatibility)
FROM node:20 AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Force install of linux-specific rollup binary
# Deleting package-lock.json ensures we resolve dependencies for the current OS (Linux)
# instead of trusting the Windows-generated lockfile which might lack the Linux binary
RUN rm -f package-lock.json && npm install

# Copy source code
COPY . .

# Build the application
# Use build:docker to skip strict type checking (tsc -b)
RUN npm run build:docker

# Production stage (Nginx)
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
