# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package*.json pnpm-lock.yaml ./

# Install dependencies using pnpm without running prepare script
RUN pnpm install --ignore-scripts

# Copy the rest of the application code
COPY . .

# Build the application explicitly
RUN pnpm run build
RUN pnpm run api

# Set environment variable for port
ENV PORT=3000

# Expose the port the API runs on
EXPOSE 3000

# Command to run the API server
CMD ["pnpm", "run", "api"]