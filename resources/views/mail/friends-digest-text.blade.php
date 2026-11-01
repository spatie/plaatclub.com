Sunday Morning · Plaat Club

New records from friends and fresh lists to explore this week.

@if($collectors->isNotEmpty())
Updated collections

@foreach($collectors as $collector)
{!! $collector->name !!}’s collection: {{ route('profile', $collector->handle) }}

@endforeach
@endif
@foreach($records as $record)
{!! $record->user->name !!} added {!! $record->payload['displayTitle'] !!} — {!! $record->payload['artist'] !!} ({{ $record->added_at->timezone('Europe/Brussels')->format('j M') }}).
{{ $record->url() }}

@endforeach
@if($lists->isNotEmpty())
New lists

@foreach($lists as $list)
{!! $list->name !!} — by {!! $list->user->name !!}
{{ route('lists.show', $list->public_id) }}

@endforeach
@endif
@if($collectors->isNotEmpty())
See friends’ additions: {{ route('feed') }}

@endif
Turn off the weekly digest in Settings: {{ route('settings') }}
