FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ENV DEMO_MODE=true
EXPOSE 3002
CMD ["npm", "run", "dev"]
