FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# Install compilers and interpreters
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    wget \
    gnupg \
    apt-transport-https \
    && mkdir -p /etc/apt/keyrings \
    && wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | tee /etc/apt/keyrings/adoptium.asc \
    && echo "deb [signed-by=/etc/apt/keyrings/adoptium.asc] https://packages.adoptium.net/artifactory/deb bookworm main" | tee /etc/apt/sources.list.d/adoptium.list \
    && wget https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get -y install --no-install-recommends \
    temurin-21-jdk \
    python3 \
    python3-pip \
    build-essential \
    php-cli \
    dotnet-sdk-8.0 \
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
# Note: This might cause issues with some tools, but requested by user.
# [FIX] Restored read permission for C# dotnet runtime which requires user lookup
# RUN chmod o-r /etc/passwd /etc/group

# We need to run as root initially to set iptables, then switch to user in entrypoint
USER root

# Expose port
EXPOSE 4000

# Start server via entrypoint
ENTRYPOINT ["./entrypoint.sh"]
