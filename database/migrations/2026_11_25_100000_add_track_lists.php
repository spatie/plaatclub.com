<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('record_lists', function (Blueprint $table): void {
            $table->string('type')->default('records');
        });

        Schema::table('record_list_entries', function (Blueprint $table): void {
            $table->json('track')->nullable();
        });
    }
};
