<?php

use App\Models\RecordList;

it('lists only public canonical pages and reflects visibility changes without caching', function () {
    config(['app.url' => 'https://plaatclub.com']);
    $owner = socialUser('public_collector', 'everyone');
    $record = socialRecord($owner, 'Public & canonical album');
    $privateOwner = socialUser('private_collector');
    socialRecord($privateOwner, 'Hidden album');
    $friendOwner = socialUser('friends_collector', 'friends');
    socialRecord($friendOwner, 'Friends album');
    $list = RecordList::query()->create(['user_id' => $privateOwner->id, 'name' => 'Public selection', 'visibility' => 'everyone']);
    foreach (['only_me', 'friends'] as $visibility) {
        RecordList::query()->create(['user_id' => $owner->id, 'name' => 'Restricted selection', 'visibility' => $visibility]);
    }

    $response = $this->get('/sitemap.xml')->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
        ->assertHeader('Cache-Control', 'max-age=0, no-store, private');
    $xml = simplexml_load_string($response->getContent());
    expect($xml)->not->toBeFalse();
    $urls = [];
    foreach ($xml->url as $url) {
        $urls[] = (string) $url->loc;
    }
    expect($urls)->toEqualCanonicalizing([
        'https://plaatclub.com/',
        'https://plaatclub.com/about',
        'https://plaatclub.com/privacy',
        'https://plaatclub.com/collections',
        'https://plaatclub.com/about/weekly-email',
        'https://plaatclub.com/freek',
        'https://plaatclub.com/public_collector',
        'https://plaatclub.com'.$record->url(false),
        'https://plaatclub.com/lists/'.$list->public_id,
    ]);

    foreach ($urls as $url) {
        $path = parse_url($url, PHP_URL_PATH);
        $this->get($path)->assertOk()->assertHeaderMissing('X-Robots-Tag')
            ->assertSee('rel="canonical" href="'.url($path).'"', false);
    }

    $owner->update(['visibility' => 'friends']);
    $list->update(['visibility' => 'only_me']);
    $this->actingAs($owner)->get('/sitemap.xml')->assertOk()
        ->assertDontSee('public_collector')->assertDontSee($record->public_id)->assertDontSee($list->public_id)
        ->assertDontSee('private_collector')->assertDontSee('friends_collector');
});

it('keeps private, authenticated, filtered and duplicate pages out of search', function () {
    $owner = socialUser('search_owner', 'everyone');
    $record = socialRecord($owner);
    $list = RecordList::query()->create(['user_id' => $owner->id, 'name' => 'Private list', 'visibility' => 'only_me']);

    foreach (['/login', '/register', '/forgot-password', '/community', '/people/search_owner', '/search_owner/lists', '/search_owner?sort=artist', '/collections?tab=lists', '/shelves/'.$record->public_id] as $path) {
        $this->get($path)->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow');
    }

    $this->get('/search_owner/records/'.$record->public_id.'/wrong-slug')
        ->assertSee('rel="canonical" href="'.$record->url().'"', false);
    $this->get('/terms')->assertNotFound();

    $this->actingAs($owner)->get('/search_owner')->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow');
    $this->get(route('lists.show', $list))->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow');
    $this->get('/settings')->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow');

    $owner->update(['visibility' => 'only_me']);
    auth()->forgetGuards();
    $this->get('/search_owner')->assertRedirect('/login')->assertHeader('X-Robots-Tag', 'noindex, nofollow');
    $this->get(route('lists.show', $list))->assertNotFound();
});

it('advertises the sitemap and publishes a matching IndexNow verification file', function () {
    expect(file_get_contents(public_path('robots.txt')))->toContain('Sitemap: https://plaatclub.com/sitemap.xml');
    $key = '2ee481095fca7fe1827e16ebdea84151';
    expect(trim(file_get_contents(public_path("{$key}.txt"))))->toBe($key);
});
