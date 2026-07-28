# Spec: Player Account Match Claims

## Goal

Allow each setup participant to remain local or be explicitly linked to a Bougnat player account. Only linked participants produce backend stat declarations. Declarations for another account are sent as pending claims and must be confirmed or rejected in the player space backend.

## Requirements

- Account linking is available per player row during setup for X01 and Cricket.
- Search starts only when the query has at least 4 characters.
- Search is authenticated with the Clerk token.
- A checked account link must have a selected backend player account before launch.
- The same backend player account cannot be selected twice in one match.
- Local players and bots never produce stat submissions.
- X01 and Cricket payloads stay separated by `game_mode`.
- X01 payloads must not be used for Cricket stats, and Cricket payloads must not contain X01-only stats.
- Offline retry keeps the same `client_match_id` and stable `participant_key`.

## Backend Contract Prompt

Implement pending match declarations for scoring app submissions.

Needed endpoints:

- `GET /v1/player/me/players/search?q=term`
  - Authenticated with Clerk.
  - Return player accounts matching pseudo, display name, public slug, and optionally email.
  - Ignore or reject `q` shorter than 4 chars.
  - Response:
    ```json
    {
      "items": [
        {
          "player_id": "player_456",
          "display_name": "Guillaume Martin",
          "nickname": "Guigui",
          "public_slug": "guillaume-martin",
          "club_name": "Darts Club",
          "avatar_url": "https://..."
        }
      ]
    }
    ```

- `POST /v1/player/me/scoring/personal-matches`
  - Accept X01 and Cricket payloads with optional:
    - `target_player_id`
    - `participant_key`
    - `confirmation_policy: "player_confirmation_required"`
  - Create one declaration for the target player.
  - If the target player is not the authenticated player, mark it `confirmation_status = "pending"`.
  - The target player can later confirm or reject in the backend player space.
  - Official stats should include only confirmed declarations.
  - Enforce idempotence on `client_match_id + participant_key` or `client_match_id + target_player_id`.

## App Behavior

- Setup row has `J'ai un compte joueur`.
- When checked, the player searches and selects an account.
- On finish, the app creates one submission per linked participant.
- Queue key uses `client_match_id:participant_key` to avoid overwriting multi-player submissions.
