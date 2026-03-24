alter table public.open_lobbies
add column if not exists game_config jsonb not null default '{}'::jsonb;

update public.open_lobbies
set game_config = case
  when mode = 'X01' then jsonb_strip_nulls(
    jsonb_build_object(
      'startingScore',
      case
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%170%' then 170
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%701%' then 701
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%301%' then 301
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%1001%' then 1001
        else 501
      end,
      'matchMode',
      'LEGS',
      'legsToWin',
      case
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%best of 5%'
          or lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%bo5%'
          or lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%premier a 3%'
        then 3
        else null
      end,
      'setsToWin',
      case
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%best of 5%'
          or lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%bo5%'
          or lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%premier a 3%'
        then 1
        else null
      end,
      'checkIn',
      case
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%double in%' then 'Double'
        else 'Open'
      end,
      'checkOut',
      case
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%master out%' then 'Master'
        when lower(coalesce(title, '') || ' ' || coalesce(stakes, '')) like '%double out%' then 'Double'
        else 'Open'
      end
    )
  )
  else '{}'::jsonb
end
where game_config = '{}'::jsonb;
