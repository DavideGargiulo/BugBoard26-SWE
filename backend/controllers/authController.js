import axios from 'axios';

const AUTHENTIK_URL = process.env.AUTHENTIK_URL;
const FLOW_SLUG = process.env.AUTHENTIK_FLOW_SLUG || 'default-authentication-flow';

function getCookieValue(cookieName, cookieArray) {
  if (!cookieArray) return null;
  const cookieString = cookieArray.find(c => c.trim().startsWith(`${cookieName}=`));
  if (!cookieString) return null;
  return cookieString.split(';')[0].split('=')[1];
}

function updateCookieJar(currentCookies, newCookies) {
  if (!newCookies) return currentCookies;
  return [...(currentCookies || []), ...newCookies];
}

export const login = async (req, res) => {
  const { email, password } = req.body; // Cambiato da username a email

  let cookieJar = [];
  let csrfToken = '';

  try {
    console.log("1. Inizio flusso su:", `${AUTHENTIK_URL}/api/v3/flows/executor/${FLOW_SLUG}/`);

    const initResponse = await axios.get(
      `${AUTHENTIK_URL}/api/v3/flows/executor/${FLOW_SLUG}/`,
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      }
    );

    cookieJar = updateCookieJar(cookieJar, initResponse.headers['set-cookie']);
    csrfToken = getCookieValue('authentik_csrf', cookieJar);

    console.log("2. Invio Email...");

    const identResponse = await axios.post(
      `${AUTHENTIK_URL}/api/v3/flows/executor/${FLOW_SLUG}/`,
      {
        component: "ak-stage-identification",
        uid_field: email // Cambiato da username a email
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Authentik-CSRF': csrfToken,
          'Cookie': cookieJar.join('; ')
        },
        withCredentials: true
      }
    );

    cookieJar = updateCookieJar(cookieJar, identResponse.headers['set-cookie']);

    if (identResponse.data.component === 'ak-stage-access-denied') {
      return res.status(401).json({ error: "Email non trovata o accesso negato" }); // Aggiornato messaggio
    }

    console.log("3. Invio Password...");
    const passwordResponse = await axios.post(
      `${AUTHENTIK_URL}/api/v3/flows/executor/${FLOW_SLUG}/`,
      {
        component: "ak-stage-password",
        password: password
      },
      {
        headers: {
            'Content-Type': 'application/json',
            'X-Authentik-CSRF': csrfToken,
            'Cookie': cookieJar.join('; ')
        },
        withCredentials: true
      }
    );

    cookieJar = updateCookieJar(cookieJar, passwordResponse.headers['set-cookie']);

    if (passwordResponse.data.type === 'redirect' || passwordResponse.data.component === 'xak-flow-redirect') {
      const sessionToken = getCookieValue('authentik_session', cookieJar);
      if (sessionToken) {
        res.cookie('authentik_session', sessionToken, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
        });
        return res.json({ success: true, message: "Login effettuato!" });
      }
    }
    return res.status(401).json({ error: "Credenziali non valide" });
  } catch (error) {
    console.error("Errore Auth:", error.response?.data || error.message);
    return res.status(500).json({ error: "Errore interno del server durante il login" });
  }
};

export const checkAuthStatus = async (req, res) => {
  const sessionCookie = req.cookies.authentik_session;

  if (!sessionCookie) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const response = await axios.get(`${AUTHENTIK_URL}/api/v3/core/users/me/`, {
      headers: {
        'Cookie': `authentik_session=${sessionCookie}`
      }
    });

    return res.json({
      authenticated: true,
      user: response.data.user
    });
  } catch (error) {
    return res.status(401).json({ authenticated: false });
  }
};

export const logout = (req, res) => {
  res.clearCookie('authentik_session');
  res.json({ success: true, message: "Logout effettuato" });
};