#Usa a imagem oficial do Node.js
FROM node:20

WORKDIR /app

#Copia os arquivos de dependencias primeiro (para aproveitar cache)
COPY package*.json ./

#Instala as dependências (Inclusive Prisma)
RUN npm install

#Copia todos os arquivos do projeto
COPY . .

#Garante que o Prisma CLI esteja acessivel
RUN npx prisma generate

#Expoe a porta do backend
EXPOSE 5000

#Inicia o servidor
CMD ["npm", "start"]