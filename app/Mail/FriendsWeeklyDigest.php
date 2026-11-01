<?php

namespace App\Mail;

use App\Models\CollectionRecord;
use App\Models\RecordList;
use App\Models\User;
use App\Support\RecordCoverImages;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Collection as SupportCollection;

class FriendsWeeklyDigest extends Mailable
{
    /** @var array<int, string>|null */
    protected ?array $covers = null;

    /** @var SupportCollection<int, User> */
    public SupportCollection $collectors;

    /** @var Collection<int, RecordList> */
    public Collection $lists;

    /**
     * @param  Collection<int, CollectionRecord>  $records
     * @param  Collection<int, RecordList>|null  $lists
     */
    public function __construct(public Collection $records, ?Collection $lists = null)
    {
        $this->collectors = $records->pluck('user')->unique('id')->values();
        $this->records = $records->take(10);
        $this->lists = $lists ?? new Collection;
        $this->theme = 'friends-digest-theme';
    }

    public function prepareCovers(): self
    {
        $this->covers = [];

        foreach ($this->records as $record) {
            $source = $record->payload['cover'] ?? '';
            if ($source === '/images/record-placeholder.svg') {
                $source = $record->payload['coverSource'] ?? '';
            }

            if (! $source) {
                continue;
            }

            try {
                $image = @imagecreatefromstring(app(RecordCoverImages::class)->read($source));
                if (! $image) {
                    continue;
                }

                $thumbnail = imagescale($image, min(320, imagesx($image)));
                if (! $thumbnail) {
                    continue;
                }

                ob_start();
                imagejpeg($thumbnail, null, 80);
                $bytes = ob_get_clean();
                if ($bytes) {
                    $this->covers[$record->id] = $bytes;
                }
            } catch (Exception $exception) {
                report($exception);
            }
        }

        return $this;
    }

    public function build(): self
    {
        if ($this->covers === null) {
            $this->prepareCovers();
        }

        return $this->subject('Sunday Morning · Plaat Club')
            ->markdown('mail.friends-digest')
            ->text('mail.friends-digest-text')
            ->with('covers', $this->covers);
    }
}
