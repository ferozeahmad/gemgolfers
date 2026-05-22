# Stage 1: Build the application
FROM node:20-alpine as build
WORKDIR /app
COPY ./package*.json ./

RUN npm ci

COPY ./ ./
RUN npm run build

# # Stage 2: Serve the application using Nginx
FROM nginx:alpine
EXPOSE 8080
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/gemgolfers /usr/share/nginx/html