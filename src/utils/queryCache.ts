/**
 * Sistema simple de caché en memoria para optimizar consultas frecuentes
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class QueryCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL: number = 5 * 60 * 1000; // 5 minutos por defecto

    /**
     * Obtiene datos del caché o ejecuta la función si no existe o expiró
     */
    async get<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number = this.defaultTTL
    ): Promise<T> {
        const cached = this.cache.get(key);
        const now = Date.now();

        // Si existe en caché y no ha expirado, retornar
        if (cached && now - cached.timestamp < cached.ttl) {
            return cached.data as T;
        }

        // Si no existe o expiró, ejecutar fetcher y guardar
        const data = await fetcher();
        this.set(key, data, ttl);
        return data;
    }

    /**
     * Establece un valor en el caché
     */
    set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    /**
     * Invalida una entrada específica del caché
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalida múltiples entradas que coincidan con un patrón
     */
    invalidatePattern(pattern: string): void {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Limpia todo el caché
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Obtiene estadísticas del caché
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

// Instancia singleton del caché
export const queryCache = new QueryCache();

// Helper para crear claves de caché consistentes
export function createCacheKey(...parts: (string | number)[]): string {
    return parts.join(':');
}
