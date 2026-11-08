<?php

namespace App\Jobs;

use App\Actions\Social\SendFriendsDigestAction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendFriendsDigest implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 300;

    public function __construct(
        public int $userId,
        public CarbonImmutable $end,
    ) {}

    public function uniqueId(): string
    {
        return $this->userId.':'.$this->end->toDateString();
    }

    public function backoff(): int
    {
        return 60;
    }

    public function handle(SendFriendsDigestAction $sendDigest): void
    {
        $user = User::query()->find($this->userId);
        if (! $user) {
            return;
        }

        $sendDigest->execute($user, $this->end);
    }
}
