<?php

namespace App\Http\Middleware;

use App\Models\RecordList;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PrivateResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('Cache-Control', 'private, no-store, max-age=0');
        if ($response->getStatusCode() !== 200 || ! $this->isPublicPage($request)) {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }
        $response->headers->set('Referrer-Policy', 'same-origin');

        return $response;
    }

    protected function isPublicPage(Request $request): bool
    {
        if ($request->user() || $request->query() !== [] || ! in_array($request->method(), ['GET', 'HEAD'], true)) {
            return false;
        }

        if ($request->routeIs('home', 'about', 'privacy', 'collections', 'weeklyEmail')) {
            return true;
        }

        if ($request->routeIs('profile', 'profile.record')) {
            $user = $request->route('user');

            return $user instanceof User && $user->canViewCollection(null);
        }

        if ($request->routeIs('lists.show')) {
            $list = $request->route('recordList');

            return $list instanceof RecordList && $list->canView(null);
        }

        return false;
    }
}
