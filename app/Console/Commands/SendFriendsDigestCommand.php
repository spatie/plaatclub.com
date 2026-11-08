<?php

namespace App\Console\Commands;

use App\Actions\Social\SendFriendsDigestAction;
use App\Jobs\SendFriendsDigest;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Console\Command;

class SendFriendsDigestCommand extends Command
{
    protected $signature = 'social:send-digests {--preview-for= : Local preview for one recipient, without advancing their weekly checkpoint}';

    protected $description = 'Queue the latest completed Sunday Morning friends digest, checking access at delivery';

    public function handle(SendFriendsDigestAction $sendDigest): int
    {
        $preview = $this->option('preview-for');
        if ($preview && ! app()->environment('local')) {
            $this->error('Digest previews are restricted to the local environment.');

            return self::FAILURE;
        }
        $end = now()->timezone('Europe/Brussels')->startOfWeek(CarbonInterface::SUNDAY)->setTime(9, 0);
        if ($end->isFuture()) {
            $end = $end->subWeek();
        }
        if ($preview) {
            $end = now()->timezone('Europe/Brussels');
        }
        User::query()->select('id')->when($preview, fn ($query) => $query->whereKey($preview))->whereNotNull('email_verified_at')->where('digest_enabled', true)->eachById(function (User $candidate) use ($sendDigest, $end, $preview): void {
            if ($preview) {
                $sendDigest->execute($candidate, $end, true);

                return;
            }

            SendFriendsDigest::dispatch($candidate->id, $end);
        }, 100);
        $this->info($preview ? 'Friends digest preview processed.' : 'Friends digests queued.');

        return self::SUCCESS;
    }
}
