const localApiBaseUrl = 'http://localhost:8080/api/';
const productionApiBaseUrl =
  'https://teddycityhotels-api-207712314730.africa-south1.run.app/api/';

const isLocalBrowser =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const baseURL = isLocalBrowser ? localApiBaseUrl : productionApiBaseUrl;
