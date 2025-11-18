FROM node:24.11.1

WORKDIR /app

COPY package*.json ./

# Update OS packages to pick up security fixes, then install Node dependencies.
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/* && npm install && npm install cors

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]