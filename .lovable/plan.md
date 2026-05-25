## Mål
Få loginflödet att fungera praktiskt: efter Google eller SAML SSO ska användaren lämna `/sign-in`, sessionen fångas upp korrekt och redirect ska styras av rollerna (`admin` → `/dashboard`, `editor` → `/review`, `artist` → `/uploads`, annars `/profile`).

## Det jag hittade
- Google och SAML använder olika tekniker, men båda skickas idag till `/?next=...` efter login.
- Auth-callback-sidan som innehåller tokenhantering och rollbaserad redirect ligger på `/auth/callback`.
- Det gör att OAuth/SSO kan komma tillbaka till startsidan utan att callback-logiken körs, vilket matchar symptomet “kommer inte ifrån /sign-in”.
- SAML är aktiverat i backend, men jag kan inte se om din Entra-provider/domän är registrerad därifrån med nuvarande åtkomst. Det behöver antingen verifieras via Cloud UI eller konfigureras med metadata-URL.

## Plan
1. Ändra callback-URL:er för Google, Apple, SAML och signup från `/?next=...` till `/auth/callback?next=...`.
2. Behåll befintlig logik i `/auth/callback`: konsumera tokens, hämta användare, hämta `user_roles`, beräkna target och redirecta.
3. Lägg till tydligare felhantering i SSO-knappen så den visar om SAML-provider saknas för domänen, i stället för att bara kännas som att inget händer.
4. Uppdatera testet för redirect-kontraktet så det verifierar att `callbackUrl()` pekar på `/auth/callback` och att admin fortfarande hamnar på `/dashboard` även med `next=/profile`.
5. Efter implementation: kör relevant Vitest-test och kontrollera att callback-URL:erna i koden är konsekventa.

## För SAML/Entra efter kodfixen
Om SAML fortfarande inte startar behöver vi bara registrera/verifiera SAML-providern i Lovable Cloud med:
- Entra App Federation Metadata URL
- din e-postdomän

Google bör fungera utan extra Entra-konfiguration när callback-URL:en är rätt.