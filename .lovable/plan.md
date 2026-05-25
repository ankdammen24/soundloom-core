Jag hittade orsaken: backend-triggern finns, är aktiv och har skapat profil korrekt. Det finns just nu 1 auth-användare, 1 profil och 0 användare utan profil. Din senaste SSO-inloggning har alltså profilrad och roller: `admin` + `viewer`.

Problemet är därför inte att profilen aldrig skapas, utan att appflödet kan landa på profilsidan innan klientens auth/session och profilhämtning är färdiga eller innan en saknad profil självläker.

Plan:

1. Gör `/profile` självläkande
   - Om profilsidan inte hittar en profilrad för inloggad användare ska den skapa/upserta den direkt med användarens id, e-post, namn och avatar från auth-sessionen.
   - Därefter läser den tillbaka profilen och visar den.

2. Flytta profilhämtningen till en skyddad serverfunktion
   - Använd en backend-funktion som kör som inloggad användare och respekterar åtkomstregler.
   - Det gör att profilskapande/läsning blir deterministiskt och inte beroende av timing i React-effekter.

3. Hårdgör auth-laddningen före profilsidan
   - Lägg en `beforeLoad` på profilrouten som väntar på `supabase.auth.getUser()` innan sidan försöker läsa profilen.
   - Om ingen verifierad användare finns skickas man till `/sign-in`.

4. Behåll databastriggern men gör den mer felsäker vid behov
   - Triggern `on_auth_user_created` finns redan på auth-användare och kör `public.handle_new_user()`.
   - Jag lägger bara till en migration om vi behöver förstärka triggern/backfill, inte ändra fungerande schema i onödan.

5. Verifiera med riktiga databassignaler
   - Kontrollera efter ändringen att antalet auth-användare utan profil är `0`.
   - Kontrollera att profilsidan visar raden efter SSO/Google utan manuell refresh.