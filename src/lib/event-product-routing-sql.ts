/** Routing metadata only; never fetch artwork, form responses, or editor snapshots for links. */
export function eventProductRoutingProjectionSql(dataSql: string): string {
  return `jsonb_strip_nulls(jsonb_build_object(
    'category', ${dataSql}->'category',
    'createdVia', ${dataSql}->'createdVia',
    'primaryOutput', ${dataSql}->'primaryOutput',
    'productType', ${dataSql}->'productType',
    'publicRenderer', ${dataSql}->'publicRenderer',
    'requestedOutputs', ${dataSql}->'requestedOutputs',
    'outputs', ${dataSql}->'outputs',
    'templateEditor', case when jsonb_typeof(${dataSql}->'templateEditor') = 'object'
      then jsonb_build_object('category', ${dataSql}#>'{templateEditor,category}') end,
    'signupForm', case when jsonb_typeof(${dataSql}->'signupForm') = 'object' then '{}'::jsonb end,
    'studioCard', case when jsonb_typeof(${dataSql}->'studioCard') = 'object' then '{}'::jsonb end,
    'liveCard', case when jsonb_typeof(${dataSql}->'liveCard') = 'object' then '{}'::jsonb end,
    'customEventPage', case when jsonb_typeof(${dataSql}->'customEventPage') = 'object' then '{}'::jsonb end,
    'manualEditor', case when jsonb_typeof(${dataSql}->'manualEditor') = 'object' then '{}'::jsonb end,
    'ocrSkin', case when ${dataSql}->>'ocrSkin' is not null then true end,
    'scanSchedule', case when ${dataSql}->>'scanSchedule' is not null then true end,
    'sourceContext', jsonb_build_object('type', ${dataSql}#>'{sourceContext,type}'),
    'discoverySource', jsonb_build_object('workflow', ${dataSql}#>'{discoverySource,workflow}'),
    'publicEvent', jsonb_build_object(
      'primaryOutput', ${dataSql}#>'{publicEvent,primaryOutput}',
      'renderer', ${dataSql}#>'{publicEvent,renderer}'
    ),
    'conciergeDraft', jsonb_build_object(
      'primaryOutput', ${dataSql}#>'{conciergeDraft,primaryOutput}',
      'productType', ${dataSql}#>'{conciergeDraft,productType}',
      'requestedOutputs', ${dataSql}#>'{conciergeDraft,requestedOutputs}',
      'outputs', ${dataSql}#>'{conciergeDraft,outputs}'
    )
  ))`;
}
