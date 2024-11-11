import Axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosStatic } from 'axios';
import { setupCache, type CacheOptions } from 'axios-cache-interceptor';
import axiosRetry, { type IAxiosRetryConfig } from 'axios-retry';

const DEFAULT_HEADERS: Record<string, string> = {
  'Accept-Encoding': 'gzip, deflate, br',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4692.71 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'Sec-Ch-Ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': 'Windows',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

interface AxiosOverdoseOptions extends AxiosRequestConfig {
  /**
   * **Axios Cache Options**
   * Options for cache.
   * @see https://axios-cache-interceptor.js.org/#/pages/configuration
   */
  cacheOptions?: Partial<CacheOptions>;
  /**
   * **Axios Retry Options**
   * Options for axios retry.
   * @see https://github.com/softonic/axios-retry#options
   */
  retryOptions?: Partial<IAxiosRetryConfig>;
}

function create(options: AxiosOverdoseOptions = {}) {
  const { cacheOptions, retryOptions, ...axiosOpts } = options;
  return setup(Axios.create(axiosOpts), {
    cacheOptions,
    retryOptions,
  });
}

function setup(
  axiosInstance: AxiosStatic | AxiosInstance,
  options: Pick<AxiosOverdoseOptions, 'cacheOptions' | 'retryOptions'> = {}
) {
  const { cacheOptions, retryOptions } = options;

  for (const key of Object.keys(DEFAULT_HEADERS)) {
    if (!axiosInstance.defaults.headers.common[key]) {
      axiosInstance.defaults.headers.common[key] = DEFAULT_HEADERS[key];
    }
  }

  const axios = setupCache(axiosInstance, cacheOptions);

  axiosRetry(axios, {
    retries: 5,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: ({ code, response, request }) => {
      return (
        response &&
        request &&
        request.method &&
        ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE'].includes(request.method) &&
        response.status &&
        [408, 413, 429, 500, 502, 503, 504, 521, 522, 524].includes(response.status) &&
        code &&
        [
          'ETIMEDOUT',
          'ECONNRESET',
          'EADDRINUSE',
          'ECONNREFUSED',
          'EPIPE',
          'ENOTFOUND',
          'ENETUNREACH',
          'EAI_AGAIN',
        ].includes(code)
      );
    },
    ...retryOptions,
  });

  return axios;
}

const axios = Object.assign({}, create(), { create });

// -- Exports -------------------------

export default axios;
export { axios, create };
export type { AxiosOverdoseOptions };

// -- ThirdParty ----------------------

export * from 'axios';
export * from 'axios-cache-interceptor';
export type { AxiosCacheInstance as AxiosInstance } from 'axios-cache-interceptor';
export type { CacheOptions, IAxiosRetryConfig };
