const {createClient} = require('redis');

const redisClient = createClient();

const expireKeyTime = 600; //seconds

redisClient.on('error', (err) => console.error('Erro no redis: ', err));

(async () =>{
    try{
        await redisClient.connect({
            socket:{
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT
            }
        });
        console.log('Conectado ao redis');
    }catch(error){
        console.error('Falha ao conectar ao Redis: ', error)
    }
})();

//Intercepta o sinal SIGINT que ocorre quando o ctrl + c é utilizazdo para interromper o servidor ou quando o precesso é encerrado
process.on('SIGINT', async () =>{
    await redisClient.disconnect();
    console.log('Redis desconectado');
    
    //Fecha a conexao com o redis 
    process.exit(0);
})

module.exports = {
    redisClient, expireKeyTime
}