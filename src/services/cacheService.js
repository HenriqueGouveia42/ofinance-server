const {redisClient} = require('../config/redis');

const getOrSetCache = async (key, ttl, callback) => {
    try {
        const cachedData = await redisClient.get(key);

        if (cachedData) {
            return JSON.parse(cachedData);
        }

        const freshData = await callback();

        await redisClient.setEx(key, ttl, JSON.stringify(freshData)); // TTL correto

        return freshData;
    } catch (error) {
        console.error('Erro no cache', error);
        return callback(); // fallback
    }
};


const invalidateAllKeysInCacheService = async(prefix) =>{
    try{
        const keys = await redisClient.keys(`${prefix}*`)
        
        if (keys.length > 0){
            await redisClient.del(keys);
        }

    }catch(error){
        console.error('Erro ao invalidar cache');
        throw new Error('Erro ao invalidar cache')
    }
}

module.exports = {
    getOrSetCache,
    invalidateAllKeysInCacheService
}