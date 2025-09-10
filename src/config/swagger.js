const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

//config do swagger
const options = {
    definition:{
        openapi: "3.0.0",
        info:{
            title: "API Controle Financeiro",
            version: "1.0.0",
            description: "Documentação da API de controle financeiro",
        },
        servers:[
            {
                url: "http://localhost:5000"
            }
        ]
    },
    apis: ["../routes/*.js"]
}

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app){
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log("📄 Swagger disponível em http://localhost:5000/api-docs")
}

module.exports = swaggerDocs