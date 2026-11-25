<?php

namespace App\Http\Controllers;

use App\Models\CollectionRecord;
use App\Support\RecordCoverImages;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class RecordCoverController extends Controller
{
    public function __invoke(Request $request, CollectionRecord $record, RecordCoverImages $images): Response
    {
        abort_unless($record->user->canViewCollection($request->user()), 404);

        $source = $record->payload['cover'];

        return $images->response($source, $request->integer('width'));
    }
}
