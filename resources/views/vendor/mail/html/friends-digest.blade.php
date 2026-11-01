@props(['records', 'collectors', 'lists', 'covers', 'webPreview' => false, 'mailMessage'])
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td class="digest-masthead" bgcolor="#d84435"><a href="{{ config('app.url') }}">Plaat Club.</a></td>
</tr>
<tr>
<td class="digest-poster" bgcolor="#d84435">
<h1 class="digest-heading">Sunday<br />Morning.</h1>
<p>New records from friends and fresh lists to explore this week.</p>
</td>
</tr>
@if($collectors->isNotEmpty())
<tr>
<td class="digest-section" bgcolor="#fff9e8">
<h2 class="digest-section-heading">Updated collections</h2>
<p class="digest-section-intro">Explore everything your friends added this week.</p>
@foreach($collectors as $collector)
<p class="digest-collection"><a href="{{ route('profile', $collector->handle) }}">{{ $collector->name }}’s collection</a></p>
@endforeach
</td>
</tr>
@endif
@foreach($records as $record)
<tr>
<td class="digest-row" bgcolor="{{ $loop->even ? '#d3c0ea' : '#d9ed92' }}" style="background-color: {{ $loop->even ? '#d3c0ea' : '#d9ed92' }};">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td class="digest-art" width="168" valign="top">
@if(isset($covers[$record->id]))
<a href="{{ $record->url() }}"><img class="digest-cover" src="{{ $webPreview ? 'data:image/jpeg;base64,'.base64_encode($covers[$record->id]) : $mailMessage->embedData($covers[$record->id], 'sleeve-'.$record->id.'.jpg', 'image/jpeg') }}" width="144" height="144" alt="Album cover: {{ $record->payload['displayTitle'] }}" /></a>
@else
<table class="digest-missing" width="144" height="144" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" valign="middle">NO SLEEVE.<br />STILL GOOD.</td></tr></table>
@endif
</td>
<td class="digest-details" valign="top">
<p class="digest-owner">{{ $record->user->name }} added</p>
<h2 class="digest-title"><a href="{{ $record->url() }}">{{ $record->payload['displayTitle'] }}</a></h2>
<p class="digest-artist">{{ $record->payload['artist'] }}</p>
<p class="digest-meta">@if($record->formats()){{ implode(' / ', $record->formats()) }} · @endif{{ $record->added_at->timezone('Europe/Brussels')->format('j M') }}</p>
</td>
</tr>
</table>
</td>
</tr>
@endforeach
@if($lists->isNotEmpty())
<tr>
<td class="digest-section" bgcolor="#d3c0ea">
<h2 class="digest-section-heading">New lists</h2>
<p class="digest-section-intro">The latest lists you can explore, created this week.</p>
@foreach($lists as $list)
<div class="digest-list">
<h3 class="digest-list-title"><a href="{{ route('lists.show', $list->public_id) }}">{{ $list->name }}</a></h3>
<p class="digest-meta">By {{ $list->user->name }} · {{ $list->created_at->timezone('Europe/Brussels')->format('j M') }}</p>
</div>
@endforeach
</td>
</tr>
@endif
@if($collectors->isNotEmpty())
<tr>
<td class="digest-signoff" bgcolor="#292a22">
<a class="digest-button" href="{{ route('feed') }}">See friends’ additions</a>
</td>
</tr>
@endif
<tr>
<td class="digest-footer" bgcolor="#fff9e8">
<a href="{{ route('settings') }}">Turn off the weekly digest in Settings</a>
</td>
</tr>
</table>
