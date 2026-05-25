Jag ser två konkreta problem i nuvarande flöde:

1. Callbacken tar emot tokens i URL-hashen, men appens egen auth-store/router kan ligga kvar i `loading` eller hinna omdirigera fel innan sessionen är helt hydratiserad.
2. Det finns fortfarande gammal logik som landar användare på `/` eller `/dashboard` i vissa vägar, trots att önskat mål är `/profile`.

Plan:

1. **Stabilisera `/auth/callback`**
   - Läs `access_token` och `refresh_token` direkt från `window.location.hash`.
   - Sätt sessionen med `supabase.auth.setSession(...)`.
   - Rensa bort hela hash-fragmentet ur adressfältet direkt.
   - Uppdatera appens auth-store direkt från den nya sessionen så route-guard inte fastnar på `loading`.
   - Navigera hårt till `/profile` med `window.location.replace(...)` efter lyckad session, istället för att lita på SPA-navigation i just callback-steget.

2. **Gör `/profile` till enda standardlandning efter login**
   - Ändra `sign-in` så redan inloggade användare alltid skickas till `/profile` om ingen explicit intern redirect finns.
   - Ändra SSO-starten så den inte skickar med extern/fullständig URL som `next`, utan bara säkra interna paths.
   - Behåll stöd för säkra deep-links, men blockera externa/trasiga redirectvärden.

3. **Fixa auth-hydrering i rooten**
   - Se till att `AuthProvider` uppdaterar sessionen deterministiskt på `SIGNED_IN`, `INITIAL_SESSION` och efter `setSession`.
   - Undvik att rollhämtning blockerar inloggningen eller profilvyn.

4. **Kontrollera Cloud-auth/SAML-inställningarna**
   - Verifiera att callback-URL:en är exakt `https://catalog.mediarosenqvist.com/auth/callback`.
   - Om config-tooling visar fel redirect-URL föreslår jag att vi uppdaterar SAML-konfigurationen där, inte med fler hosting-hack.

5. **Validering efter ändring**
   - Kontrollera callback-sidan lokalt med en simulerad hash-URL utan att logga riktiga tokens.
   - Kontrollera att `/`, `/sign-in` och `/profile` beter sig konsekvent för inloggad/utloggad användare.

Viktigt: länken du klistrade in innehåller en aktiv inloggningstoken. Logga ut från appen och logga in igen efter fixen så token/refresh-token roteras.