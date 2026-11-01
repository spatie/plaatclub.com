<?php

namespace App\Actions\Social;

use App\Mail\FriendsWeeklyDigest;
use App\Models\CollectionRecord;
use App\Models\RecordList;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class SendFriendsDigestAction
{
    public function execute(User $candidate, CarbonImmutable $end, bool $preview = false): void
    {
        $week = $end->toDateString();
        $user = $candidate->fresh();
        if (! $user->digest_enabled || ! $user->email_verified_at || (! $preview && $user->digest_week === $week)) {
            return;
        }

        $records = CollectionRecord::friendActivity($user)->with('user')
            ->where('added_at', '>=', $end->subWeek()->utc()->toDateTimeString())
            ->where('added_at', '<', $end->utc()->toDateTimeString())->get();
        $lists = RecordList::visibleTo($user)->with('user')
            ->where('created_at', '>=', $end->subWeek()->utc()->toDateTimeString())
            ->where('created_at', '<', $end->utc()->toDateTimeString())
            ->latest('created_at')->orderByDesc('id')->limit(10)->get();
        $mail = (new FriendsWeeklyDigest($records, $lists))->prepareCovers();

        // Downloads must not consume the send lock's lifetime; recheck privacy and delivery inside it.
        Cache::lock('digest-'.$candidate->id, 300)->get(function () use ($candidate, $mail, $records, $week, $preview): void {
            $user = $candidate->fresh();
            if (! $user->digest_enabled || ! $user->email_verified_at || (! $preview && $user->digest_week === $week)) {
                return;
            }

            // Deliberately synchronous: no queued/rendered payload can outlive its privacy check.
            $records = CollectionRecord::friendActivity($user)->with('user')->whereKey($records->modelKeys())->get();
            $mail->collectors = $records->pluck('user')->unique('id')->values();
            $mail->records = $records->whereIn('id', $mail->records->modelKeys())->values();
            $mail->lists = RecordList::visibleTo($user)->with('user')->whereKey($mail->lists->modelKeys())
                ->latest('created_at')->orderByDesc('id')->get();
            if ($mail->collectors->isNotEmpty() || $mail->lists->isNotEmpty()) {
                Mail::to($user->email)->send($mail);
            }

            if (! $preview) {
                $user->update(['digest_week' => $week]);
            }
        });
    }
}
