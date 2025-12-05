FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# Install compilers and interpreters
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    python3 \
    python3-pip \
    openjdk-17-jdk \
    build-essential \
    mono-mcs \
    php-cli \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript globally for compilation
RUN npm install -g typescript

# Setup app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy server code
COPY server.js ./

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "server.js"]
