let currentToken: string | null = null;

export function getToken() {
  return currentToken;
}

export function setToken(token: string | null) {
  currentToken = token;
}
