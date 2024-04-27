FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server.js
COPY server.js .

# Change ownership of the app directory
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Command to run the application
CMD ["node", "server.js"]
