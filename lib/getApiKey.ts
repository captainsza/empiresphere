// /lib/getApiKey.ts

export const getApiKey = (headers: Headers) => {
        const apiKey = headers.get('x-api-key');
        if (!apiKey) {
          throw new Error('API key is missing');
        }
        return apiKey;
      };
      