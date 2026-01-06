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

# Create a non-root user
RUN useradd -m -s /bin/bash sandboxuser

# Setup app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy server code
COPY server.js ./

# Install iptables
RUN apt-get update && apt-get install -y iptables && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy entrypoint script
COPY entrypoint.sh ./
RUN apt-get update && apt-get install -y dos2unix && dos2unix entrypoint.sh && chmod +x entrypoint.sh

# [Security] Restrict access to sensitive system files
# Remove read permission for 'others' on /etc/passwd and /etc/group
# Note: This might cause issues with some tools, but requested by user.
RUN chmod o-r /etc/passwd /etc/group

# We need to run as root initially to set iptables, then switch to user in entrypoint
USER root

# Expose port
EXPOSE 4000

# Start server via entrypoint
ENTRYPOINT ["./entrypoint.sh"]
