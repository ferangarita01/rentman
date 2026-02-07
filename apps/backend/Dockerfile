# Use official Node.js image
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --only=production

# Bundle app source
COPY . .

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start command
CMD [ "node", "server.js" ]
