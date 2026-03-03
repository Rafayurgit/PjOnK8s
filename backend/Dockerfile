FROM node:18-bullseye AS build

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    pkg-config \
    libvips-dev \
    libheif-dev \
    libde265-dev \
    libx265-dev \
    libjpeg-dev \
    libpng-dev \
    imagemagick \
    potrace \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM node:18-bullseye

RUN apt-get update && apt-get install -y \
    libvips \
    libheif1 \
    libjpeg62-turbo \
    libpng16-16 \
    imagemagick \
    potrace \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app /app

EXPOSE 8080
CMD ["node", "src/server.js"]
