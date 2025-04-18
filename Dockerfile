# Use the official Node.js image as a base
FROM node:16

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml (if available)
COPY package*.json ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build
RUN pnpm run api

# Set environment variable for port
ENV PORT=3000

# Expose the port the API runs on
EXPOSE 3000
# Additionally expose some alternative ports in case the main one is busy
EXPOSE 3001
EXPOSE 3002
EXPOSE 3003

# Command to run the API server
CMD ["pnpm", "run", "api"]