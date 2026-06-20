FROM node:20-slim

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (if any, e.g., pg)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/sm/lists/*

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
