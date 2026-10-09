export async function onRequestGet({ request, env }) {
    const clientId = env.GITHUB_CLIENT_ID;

    if (!clientId) {
        return new Response("GITHUB_CLIENT_ID is not configured.", {
            status: 500,
        });
    }

    const url = new URL(request.url);

    // Generate a cryptographically secure OAuth state.
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));

    const state = Array.from(randomBytes, byte =>
        byte.toString(16).padStart(2, "0")
    ).join("");

    const authorizeUrl = new URL(
        "https://github.com/login/oauth/authorize"
    );

    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set(
        "redirect_uri",
        `${url.origin}/api/callback`
    );
    authorizeUrl.searchParams.set("scope", "repo");
    authorizeUrl.searchParams.set("state", state);

    return new Response(null, {
        status: 302,
        headers: {
            Location: authorizeUrl.toString(),
            "Set-Cookie":
                `devblog_oauth_state=${state}; ` +
                "HttpOnly; Secure; SameSite=Lax; " +
                "Path=/api/callback; Max-Age=600",
            "Cache-Control": "no-store",
        },
    });
}
