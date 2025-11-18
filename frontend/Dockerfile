# Usa un'immagine Node.js come base
FROM node:24.11.1

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Installa Angular CLI globalmente
RUN npm install -g @angular/cli

# Copia tutto il codice sorgente
COPY . .

# Esponi la porta 4200
EXPOSE 4200

# Il comando sarà sovrascritto dal docker-compose
CMD ["ng", "serve", "--host", "0.0.0.0"]