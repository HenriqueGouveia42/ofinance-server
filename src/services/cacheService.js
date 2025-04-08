const {redisClient} = require('../config/redis');

const getOrSetCache = async(key, ttl, callback) =>{
    try{
        const cachedData = await redisClient.get(key);
        
        if(cachedData){
            return JSON.parse(cachedData);
        }

        const freshData = await callback()

        await redisClient.set(key, ttl, JSON.stringify(freshData));

        return freshData;
    }catch(error){
        console.error('Erro no cache', error)
        return callback(); //Se houver erro no cache, busca diretamente no banco de dados
    }
}

const invalidateCache = async(key) =>{
    try{
        await redisClient.del(key);
    }catch(error){
        console.error('Erro ao invalidar cache');
        throw new Error('Erro ao invalidar cache')
    }
}

module.exports = {
    getOrSetCache,
    invalidateCache
}