FROM node:22-bullseye-slim

WORKDIR /app

COPY package*.json ./

# Update OS packages to pick up security fixes, then install Node dependencies.
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/* && npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]