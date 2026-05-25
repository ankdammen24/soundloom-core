Jag hittade en konkret orsak: `catalog.mediarosenqvist.com` svarar `404` direkt på både `/auth/callback` och `/profile`, medan `/` svarar `200`. Det betyder att felet sker innan React-routen får chans att köra. Appens route finns i koden, men custom domain släpper inte igenom deep links just nu.

Plan:

1. Lägg in en root-baserad auth-callback fallback
   - Ändra Google/SSO `redirect_uri` till root-URL (`/`) med `next=/profile` i queryn i stället för `/auth/callback`.
   - Root-URL fungerar redan på custom domain, så token-hashen når appen i stället för att fastna i en server-404.

2. Gör index-routen kapabel att slutföra auth-callback
   - Om `/` laddas med `#access_token=...&refresh_token=...`, ska index-sidan konsumera token, köra `supabase.auth.setSession()`, verifiera med `getUser()`, rensa URL:en och navigera klient-side till `/profile`.
   - Detta undviker full page reload till `/profile`, som också 404:ar på custom domain vid direkt serverträff.

3. Behåll `/auth/callback` som sekundär fallback
   - Lämna befintlig `/auth/callback` kvar för miljöer där deep links fungerar.
   - Men nya login-flöden ska inte vara beroende av den routen på custom domain.

4. Gör redirect-mål säkrare och konsekventa
   - Fortsätt endast till interna path-värden (`/profile` som default).
   - Blockera callback-loopar och externa URL:er.

5. Verifiera mot riktiga domänen
   - Kontrollera att `https://catalog.mediarosenqvist.com/` är enda serverträffen efter SSO/Google.
   - Kontrollera att appen därefter klientnavigerar till profilsidan och att profilen visas.

Viktigt: token/refresh token har återigen klistrats in i chatten. Efter att fixen är publicerad bör du logga ut och logga in igen så att den exponerade refresh-token roteras.