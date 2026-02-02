export const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.split("=");
    if (cookieName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
};

export const clearCookie = (name: string): void => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const getCsrfToken = () => getCookie("csrf_token");
