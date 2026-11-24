# Stage 1: Build mã nguồn React với Vite
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Phục vụ sản phẩm với Nginx siêu nhẹ
FROM nginx:alpine

# Copy kết quả build từ Stage 1 sang Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Cấu hình Nginx tùy chỉnh (reverse proxy SSE và API)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
