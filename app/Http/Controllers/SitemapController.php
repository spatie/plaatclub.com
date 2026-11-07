<?php

namespace App\Http\Controllers;

use App\Models\CollectionRecord;
use App\Models\RecordList;
use App\Models\User;
use Generator;
use Illuminate\Http\Response;

class SitemapController
{
    public function __invoke(): Response
    {
        return response()->view('sitemap', [
            'root' => rtrim(config('app.url'), '/'),
            'paths' => $this->paths(),
        ])->header('Content-Type', 'application/xml; charset=UTF-8')
            ->header('Cache-Control', 'private, no-store, max-age=0');
    }

    /** @return Generator<int, string> */
    protected function paths(): Generator
    {
        foreach (['home', 'about', 'privacy', 'collections', 'weeklyEmail'] as $route) {
            yield route($route, absolute: false);
        }

        foreach (User::query()->where('visibility', 'everyone')->lazyById() as $user) {
            yield route('profile', $user->handle, absolute: false);
        }

        foreach (CollectionRecord::visibleTo(null)->with('user')->lazyById() as $record) {
            yield $record->url(false);
        }

        foreach (RecordList::visibleTo(null)->lazyById() as $list) {
            yield route('lists.show', $list, absolute: false);
        }
    }
}
