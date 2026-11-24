FROM node:20-alpine

WORKDIR /app

# Cài đặt curl để hỗ trợ docker healthcheck nếu cần
RUN apk add --no-cache curl

# Copy dependencies definitions
COPY package*.json ./

# Cài đặt production dependencies
RUN npm install --omit=dev

# Copy mã nguồn backend
COPY src ./src

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
