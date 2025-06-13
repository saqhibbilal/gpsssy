# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all remaining source code
COPY . .

# Build frontend + backend together
RUN npm run build

# Expose the port that Express serves on
EXPOSE 5000

# Run your app in production mode
CMD ["npm", "start"]
