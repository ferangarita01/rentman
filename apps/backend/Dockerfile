# Use official Node.js image
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --only=production

# Bundle app source
COPY . .

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start command
CMD [ "node", "server.js" ]
