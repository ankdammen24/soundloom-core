# Problem
SAML SSO-providern återskapades, vilket skapade en ny auth-användare för `caj.rosenqvist@mediarosenqvist.com` (`d29faa36-…`). Den gamla user_id:n (`4403b2d3-…`) hade `admin + viewer`, men det nya kontot har bara `viewer` — så `landingForRoles()` returnerar korrekt `/profile`.

# Åtgärd

## 1. Ge nya SAML-användaren admin-rollen (migration)
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('d29faa36-b996-46ba-8a55-55646113d291', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

## 2. Städa bort föräldralösa rollrader för det gamla kontot
Det gamla `auth.users`-id:t finns sannolikt inte kvar (eller är ohänvisbart). Vi tar bort dess rader i `user_roles` så vi inte har spöken som blockerar `handle_new_user`-triggern från att ge admin till framtida förste-användare-promotion (mindre relevant nu, men håller datan ren):
```sql
DELETE FROM public.user_roles
WHERE user_id = '4403b2d3-d081-4651-8bec-90badb5165a0';
```

## 3. Verifiera
Efter migrationen: läs `user_roles` för `d29faa36-…` och bekräfta `admin + viewer`. Du loggar ut, loggar in via SSO igen, och ska nu landa på `/dashboard`.

# Förebyggande (rekommendation, ej kodändring nu)
SAML-providern bör inte raderas/återskapas i drift — det kapar identiteten för alla SSO-användare. Om Entity ID/metadata ändras hos IdP:n, uppdatera providern i stället för att radera + skapa ny. Vill du att jag lägger till en kort runbook-anteckning om detta i `README.md` eller en separat `docs/sso.md`?

# Filer som ändras
- Ny migration (SQL ovan). Inga frontend-ändringar behövs — landningslogiken är redan korrekt.
