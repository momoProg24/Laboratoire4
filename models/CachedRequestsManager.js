import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";
import { log } from "../log.js";
let cachedRequestsExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

globalThis.cachedRequests = [];

export default class CachedRequestsManager {

    static add(url, content, Etag = "") {
        if (url != "") {
            CachedRequestsManager.clear(url);
            cachedRequests.push({
                url,
                content,
                Etag,
                Expire_Time: utilities.nowInSeconds() + cachedRequestsExpirationTime
            });
            console.log("URL " + url + ".json added in respository cache");
        }
    }
    static clear(url) {
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let endpoint of cachedRequests) {
                if (endpoint.url.toLowerCase().indexOf(url.toLowerCase()) > -1)
                    indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(cachedRequests, indexToDelete);
        }
    }
    static find(url) {
        try {
            if (url != "") {
                for (let cache of cachedRequests) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + cachedRequestsExpirationTime;
                        console.log("Url  " + url + ".json retreived from respository cache");
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log("url cache error!", error);
        }
        return null;
    }
    static flushExpired() {
        let indexToDelete = [];
        let index = 0;
        let now = utilities.nowInSeconds();
        for (let cache of cachedRequests) {
            if (cache.Expire_Time < now) {
                console.log("Cached url data of " + cache.url + ".json expired");
                indexToDelete.push(index);
            }
            index++;
        }
        utilities.deleteByIndex(cachedRequests, indexToDelete);
    }
    static get(HttpContext) {
        if (HttpContext.req.method == "GET") {
            const url = HttpContext.req.url;
            let cache = CachedRequestsManager.find(url);
            if (cache != null) {
                const ETag = cache.ETag;
                HttpContext.response.JSON(cache.content, ETag, true);
                return true;
            }
        }
        return false;
    }
}

// Nettoyage périodique des données mises en cache expirées
setInterval(CachedRequestsManager.flushExpired, cachedRequestsExpirationTime * 10);
log(BgWhite, FgBlack, "Periodic repository caches cleaning process started...");
