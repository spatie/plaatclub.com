<?php

namespace App\Http\Controllers;

use App\Models\CollectionRecord;
use App\Models\RecordList;
use App\Support\RecordCoverImages;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ListRecordCoversController extends Controller
{
    public function __invoke(Request $request, RecordList $recordList, CollectionRecord $copy, RecordCoverImages $images): Response|RedirectResponse
    {
        abort_unless($recordList->canView($request->user()), 404);
        abort_unless($recordList->records()->whereKey($copy->id)->exists(), 404);

        $source = $copy->payload['cover'];
        if (blank($source) || $source === '/images/record-placeholder.svg') {
            return redirect('/images/record-placeholder.svg');
        }

        return $images->response($source, $request->integer('width'));
    }
}
