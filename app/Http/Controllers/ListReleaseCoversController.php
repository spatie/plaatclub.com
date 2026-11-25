<?php

namespace App\Http\Controllers;

use App\Models\RecordList;
use App\Support\ListReleaseSearch;
use App\Support\RecordCoverImages;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use RuntimeException;

class ListReleaseCoversController extends Controller
{
    public function __invoke(Request $request, RecordList $recordList, int $releaseId, ListReleaseSearch $search, RecordCoverImages $images): Response|RedirectResponse
    {
        abort_unless($recordList->user_id === $request->user()->id, 404);

        try {
            $source = $search->release($request->user(), $releaseId)['cover'] ?? '';
            if (blank($source) || $source === '/images/record-placeholder.svg') {
                return redirect('/images/record-placeholder.svg');
            }

            return $images->response($source, $request->integer('width'));
        } catch (ConnectionException|RequestException|RuntimeException) {
            return redirect('/images/record-placeholder.svg');
        }
    }
}
