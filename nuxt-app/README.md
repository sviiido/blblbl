# Rezervační systém – DBS Závěrečný projekt

Webová aplikace pro správu rezervací učeben a vybavení. Postavena na **Nuxt 4** a **Supabase**.

---

## Spuštění projektu

### 1. Klonování repozitáře
```bash
git clone https://github.com/TVUJ_USERNAME/rezervacni-system.git
cd rezervacni-system/nuxt-app
```

### 2. Instalace závislostí
```bash
npm install
```

### 3. Konfigurace prostředí
V kořenovém adresáři složky `nuxt-app` vytvořte soubor `.env` a doplňte hodnoty z projektu v Supabase (URL a anonymní klíč):

```env
SUPABASE_URL=https://TVUJ_PROJEKT.supabase.co
SUPABASE_KEY=tvuj_anon_public_klic
```

### 4. Inicializace databázového schématu
V Supabase SQL Editoru spusťte celý obsah souboru `supabase_schema.sql`.

### 5. Nastavení prvního administrátora
Po registraci prvního účtu spusťte v SQL Editoru následující dotaz:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'tvuj@email.cz';
```

### 6. Spuštění vývojového serveru
```bash
npm run dev
```

Aplikace je dostupná na adrese `http://localhost:3000`.

---

## Struktura projektu

```
nuxt-app/
├── app/                        # Zdrojový kód aplikace (Nuxt 4 Core)
│   ├── assets/css/main.css     # Globální Tailwind styly
│   ├── components/
│   │   └── AppNavbar.vue       # Hlavní navigační lišta
│   ├── composables/
│   │   ├── useProfile.ts       # Správa stavu uživatele a načítání rolí
│   │   ├── useResources.ts     # Klientská logika pro CRUD operace zdrojů
│   │   └── useReservations.ts  # Logika rezervací a kontrola časových kolizí
│   ├── middleware/
│   │   ├── auth.ts             # Ochrana tras (přihlášení a admin přístup)
│   │   └── guest.ts            # Přesměrování přihlášených uživatelů z login/register
│   └── pages/
│       ├── reserve/
│       │   └── [id].vue        # Dynamický formulář pro novou rezervaci konkrétního zdroje
│       ├── admin.vue           # Administrační panel (správa uživatelů a oprávnění)
│       ├── index.vue           # Úvodní přehledová stránka / Dashboard
│       ├── login.vue           # Přihlašovací formulář
│       ├── register.vue        # Registrační formulář
│       ├── reservations.vue    # Přehled rezervací (vlastní pro studenta / všechny pro admina)
│       └── resources.vue       # Seznam zdrojů s filtrem a správou (CRUD)
├── public/                     # Statické soubory
├── nuxt.config.ts              # Konfigurace Nuxtu (compatibilityVersion: 4)
├── supabase_schema.sql         # SQL skript pro inicializaci databáze
└── tsconfig.json               # Konfigurace TypeScriptu
```

---

## Databázové schéma

### `profiles`

| Sloupec | Typ | Popis |
|---|---|---|
| id | UUID | Primární klíč (FK → auth.users.id) |
| email | TEXT | E-mail uživatele |
| display_name | TEXT | Zobrazované jméno |
| role | TEXT | Uživatelská role (`student` nebo `admin`) |
| created_at | TIMESTAMPTZ | Datum vytvoření |

### `resources`

| Sloupec | Typ | Popis |
|---|---|---|
| id | BIGINT | Primární klíč (generován automaticky) |
| name | TEXT | Název zdroje (učebna, vybavení apod.) |
| type | TEXT | Typ zdroje (`classroom`, `equipment`, `other`) |
| description | TEXT | Bližší popis |
| location | TEXT | Fyzické umístění |
| quantity | INTEGER | Celkový počet kusů |
| available | BOOLEAN | Příznak celkové dostupnosti |
| created_at | TIMESTAMPTZ | Datum vytvoření |

### `reservations`

| Sloupec | Typ | Popis |
|---|---|---|
| id | BIGINT | Primární klíč (generován automaticky) |
| resource_id | BIGINT | Cizí klíč (FK → public.resources.id) |
| user_id | UUID | Cizí klíč (FK → public.profiles.id) |
| start_time | TIMESTAMPTZ | Začátek rezervace |
| end_time | TIMESTAMPTZ | Konec rezervace |
| status | TEXT | Stav rezervace (`active` nebo `cancelled`) |
| note | TEXT | Volitelná poznámka uživatele |
| created_at | TIMESTAMPTZ | Datum vytvoření záznamu |

---

## API volání (Supabase klient)

| Operace | Kód |
|---|---|
| Načíst zdroje | `supabase.from('resources').select('*')` |
| Přidat zdroj | `supabase.from('resources').insert(data)` |
| Upravit zdroj | `supabase.from('resources').update(data).eq('id', id)` |
| Smazat zdroj | `supabase.from('resources').delete().eq('id', id)` |
| Načíst rezervace | `supabase.from('reservations').select('*, resources(*), profiles(*)')` |
| Vytvořit rezervaci | `supabase.from('reservations').insert(data)` |
| Kontrola kolize | `supabase.rpc('check_reservation_conflict', {...})` |
| Zrušit rezervaci | `supabase.from('reservations').update({status:'cancelled'}).eq('id', id)` |
| Přihlášení | `supabase.auth.signInWithPassword({email, password})` |
| Registrace | `supabase.auth.signUp({email, password, options})` |
| Odhlášení | `supabase.auth.signOut()` |

---

## Bezpečnost (Row Level Security)

- **profiles**: RLS je z důvodu potenciální rekurzivní smyčky v databázi záměrně vypnuto. Zabezpečení je realizováno na aplikační vrstvě prostřednictvím Nuxt middleware.
- **resources**: Čtení je povoleno všem přihlášeným uživatelům. Operace zápisu, úpravy a mazání jsou vyhrazeny výhradně administrátorům.
- **reservations**: Student vidí a spravuje pouze své vlastní rezervace na základě porovnání `auth.uid()`. Administrátor má přístup ke všem záznamům.

---

## Testovací scénáře

| # | Scénář | Očekávaný výsledek |
|---|---|---|
| 1 | Registrace nového uživatele | Profil je úspěšně vytvořen v databázi; databázový trigger automaticky přiřadí roli `student`. |
| 2 | Přihlášení se špatným heslem | Supabase Auth odmítne požadavek; aplikace zachytí chybu a zobrazí uživateli srozumitelnou hlášku. |
| 3 | Student vytvoří novou rezervaci | Pokud zvolený časový slot nekoliduje s existující rezervací, data jsou zapsána a uživatel obdrží potvrzení. |
| 4 | Pokus o rezervaci na již obsazený čas | Systém prostřednictvím RPC funkce detekuje překryv, operaci zamítne a vrátí chybový stav. |
| 5 | Student se pokusí smazat nebo upravit zdroj | Databázová politika RLS operaci zablokuje a vrátí chybu. |
| 6 | Administrátor upraví parametry zdroje | Data jsou okamžitě přepsána v databázi a reaktivně aktualizována na úvodní stránce. |
| 7 | Filtrace a vyhledávání v seznamu zdrojů | Aplikace okamžitě redukuje zobrazené položky podle zvoleného typu nebo zadaného textového řetězce. |

---

## Známá omezení

- **E-mailové potvrzení**: Ověřování e-mailů (Double Opt-In) je v nastavení Supabase Auth vypnuto pro usnadnění lokálního testování. Uživatel je aktivní ihned po registraci.
- **Množstevní rezervace**: Kontrola kolizí funguje jako absolutní blokace konkrétního záznamu zdroje (`resource_id`). Pokročilá logika pro sdílení kapacity (více kusů pod jedním ID) není součástí zadání.
- **Notifikace**: Aplikace neobsahuje automatická upozornění (např. e-mailové připomenutí blížící se rezervace).
