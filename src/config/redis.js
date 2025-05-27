const {createClient} = require('redis');

const isDocker = process.env.DOCKER === 'true'

const redisHost = isDocker ? process.env.DOCKER_REDIS_HOST : process.env.LOCAL_REDIS_HOST
const redisPort = isDocker ? process.env.DOCKER_REDIS_PORT : process.env.LOCAL_REDIS_PORT

console.log(redisHost, redisPort)

const redisClient = createClient({
    socket:{
        host: redisHost,
        port: redisPort
    }
});

const expireKeyTime = 600; //seconds

redisClient.on('error', (err) => console.error('Erro no redis: ', err));

(async () =>{
    try{
        await redisClient.connect();
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