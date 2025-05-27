# Usa a imagem oficial do Node.js
FROM node:latest

WORKDIR /app

# Copia apenas os arquivos de dependência
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do projeto
COPY . .

# Gera o client do Prisma
RUN npx prisma generate

# Expõe a porta
EXPOSE 5000

# Comando para iniciar o servidor
CMD ["npm", "start"]



# Instrucoes para criar a imagem do ambiente
