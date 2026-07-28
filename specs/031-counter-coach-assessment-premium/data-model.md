# Data Model - Spec 031 coach assessment premium

Repo cible des migrations: `Bougnat_Darts_Tournaments` (module `coach`).
Migration proposee: `000132_coach_assessment_engine.sql` (numero a confirmer).
Schema: `public`. Toutes les tables referencent `player_profiles(id)`.

Principes: schema normalise, relations explicites, zero redondance metier,
definitions data-driven et versionnees, aucun stockage local.

## Tables de definition (data-driven, versionnees)

### coach_assessment_skill_defs (referentiel de competences)

```sql
create table if not exists public.coach_assessment_skill_defs (
    skill_code text primary key,
    name text not null,
    category text not null,
    description text not null default '',
    display_order int not null default 0,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

### coach_assessment_exercise_defs (epreuves configurables)

```sql
create table if not exists public.coach_assessment_exercise_defs (
    id uuid primary key default gen_random_uuid(),
    code text not null,
    version int not null default 1,
    display_order int not null default 0,
    name text not null,
    description text not null default '',
    instructions text not null default '',
    estimated_seconds int not null default 120,
    input_schema jsonb not null default '{}'::jsonb,   -- champs bruts saisis
    scoring_config jsonb not null default '{}'::jsonb,  -- baremes / paliers / formules
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (code, version)
);
```

### coach_assessment_exercise_skill (mapping epreuve -> competences)

```sql
create table if not exists public.coach_assessment_exercise_skill (
    exercise_code text not null,
    skill_code text not null references public.coach_assessment_skill_defs(skill_code) on delete cascade,
    weight numeric(4,2) not null default 1.0,
    is_primary boolean not null default false,
    primary key (exercise_code, skill_code)
);
```

## Tables de cycle de vie (session)

### coach_assessment_sessions

```sql
create table if not exists public.coach_assessment_sessions (
    id uuid primary key default gen_random_uuid(),
    player_profile_id uuid not null references public.player_profiles(id) on delete cascade,
    status text not null default 'in_progress',  -- draft|in_progress|paused|completed|abandoned
    definition_version int not null,
    current_exercise_order int not null default 1,
    estimated_remaining_seconds int not null default 0,
    idempotency_key text unique,
    started_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz
);
create index if not exists idx_coach_assessment_sessions_player
    on public.coach_assessment_sessions(player_profile_id, status);
```

Contrainte metier: au plus une session `in_progress`/`paused` par joueur
(a garantir applicativement + index partiel unique optionnel).

### coach_assessment_exercise_results (autosave par epreuve)

```sql
create table if not exists public.coach_assessment_exercise_results (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.coach_assessment_sessions(id) on delete cascade,
    exercise_code text not null,
    raw_inputs jsonb not null default '{}'::jsonb,
    computed_indicators jsonb not null default '{}'::jsonb,
    recorded_at timestamptz not null default now(),
    unique (session_id, exercise_code)
);
```

### coach_assessment_skill_scores (scores par competence pour la session)

```sql
create table if not exists public.coach_assessment_skill_scores (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.coach_assessment_sessions(id) on delete cascade,
    skill_code text not null,
    score numeric(5,2) not null,
    confidence numeric(5,2) not null default 0,
    indicators jsonb not null default '{}'::jsonb,
    unique (session_id, skill_code)
);
```

### coach_assessment_results (sortie moteur metier)

```sql
create table if not exists public.coach_assessment_results (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null unique references public.coach_assessment_sessions(id) on delete cascade,
    overall_score numeric(5,2) not null,
    level text not null,
    priorities jsonb not null default '[]'::jsonb,   -- competences limitantes ordonnees
    potential jsonb not null default '{}'::jsonb,     -- marge de progression par competence
    trends jsonb not null default '{}'::jsonb,
    computed_at timestamptz not null default now()
);
```

### coach_assessment_reports (rapport IA, interpretation)

```sql
create table if not exists public.coach_assessment_reports (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null unique references public.coach_assessment_sessions(id) on delete cascade,
    source text not null default 'deterministic_fallback', -- openai_gpt_5_5 | deterministic_fallback
    ai_model text,
    summary text not null default '',
    strengths jsonb not null default '[]'::jsonb,
    weaknesses jsonb not null default '[]'::jsonb,
    priorities jsonb not null default '[]'::jsonb,
    potential text not null default '',
    explanation text not null default '',
    status text not null default 'ready',  -- pending | ready | failed
    generated_at timestamptz not null default now()
);
```

## Reutilisation de l existant (pas de recreation)

| Entite prompt | Table existante | Usage |
|---|---|---|
| PlayerSkill | `coach_player_skills` | etat courant calibre |
| PlayerSkillHistory | `coach_skill_evolution` | historique previous/current |
| Assessment | `coach_player_assessments` | conserve (compat spec 030) |
| AssessmentHistory | vue/req sur `coach_assessment_sessions` completed | historique des bilans |
| TrainingGoal | `coach_training_goals` | objectif alimente par le bilan |
| Programme/cycle/seance | `coach_training_programs/cycles/sessions/session_exercises` | programme genere |
| PlayerProgress | `coach_player_progress` | niveau + objectif prioritaire |

## Seed data-driven (a fournir, non code en dur cote app)

- 14 lignes `coach_assessment_skill_defs`
- 10 lignes `coach_assessment_exercise_defs` (version 1) + `input_schema`/`scoring_config`
- mapping `coach_assessment_exercise_skill`

Le seed est une donnee de configuration versionnee (migration ou script de seed),
pas une constante applicative.
