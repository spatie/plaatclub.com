<?php

namespace App\Http\Controllers;

use App\Models\RecordList;
use App\Support\DiscogsRateLimitException;
use App\Support\ListReleaseSearch;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ListReleaseTracksController extends Controller
{
    public function __invoke(Request $request, RecordList $recordList, int $releaseId, ListReleaseSearch $search): JsonResponse
    {
        abort_unless($recordList->user_id === $request->user()->id && $recordList->type === 'tracks', 404);

        try {
            $release = $search->release($request->user(), $releaseId);
        } catch (DiscogsRateLimitException|ConnectionException|RequestException) {
            throw ValidationException::withMessages(['tracks' => 'Couldn’t load tracks from Discogs. Try again shortly.']);
        }

        if ($release === null) {
            throw ValidationException::withMessages(['tracks' => 'Discogs did not return enough information for this release.']);
        }

        return response()->json(['tracks' => $release['tracks']]);
    }
}
