import Cookies from 'js-cookie';

export const useSession = () => {
  const setSessionCookie = (sessionId: string, expiryDate: Date) => {
    Cookies.set('session-id', sessionId, {
      expires: expiryDate,
      path: '/',
      sameSite: 'lax',
    });
  };

  const getSessionCookie = () => {
    return Cookies.get('session-id');
  };

  const clearSessionCookie = () => {
    Cookies.remove('session-id');
  };

  return {
    setSessionCookie,
    getSessionCookie,
    clearSessionCookie,
  };
}; 