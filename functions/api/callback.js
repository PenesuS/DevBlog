function getCookie(request, name) {
    const cookies = request.headers.get("Cookie") || "";

    for (const cookie of cookies.split(";")) {
        const [key, ...value] = cookie.trim().split("=");

        if (key === name) {
            return value.join("=");
        }
    }

    return null;
}

function renderBody(status, content) {
    const message = `authorization:github:${status}:${JSON.stringify(content)}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DevBlog CMS Authentication</title>
</head>
<body>
    <p>Completing GitHub authentication...</p>

    <script>
        const authMessage = ${JSON.stringify(message)};

        if (window.opener) {
            const receiveMessage = (event) => {
                if (event.source !== window.opener) {
                    return;
                }

                window.opener.postMessage(
                    authMessage,
                    event.origin
                );

                window.removeEventListener(
                    "message",
                    receiveMessage
                );
            };

            window.addEventListener(
                "message",
                receiveMessage
            );

            window.opener.postMessage(
                "authorizing:github",
                window.location.origin
            );
        } else {
            document.body.textContent =
                "Authentication window was opened incorrectly.";
        }
    </script>
</body>
</html>`;
}

function htmlResponse(status, content, httpStatus = 200) {
    return new Response(renderBody(status, content), {
        status: httpStatus,
        headers: {
            "Content-Type": "text/html; charset=UTF-8",
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy":
                "default-src 'none'; script-src 'unsafe-inline'",
            "Set-Cookie":
                "devblog_oauth_state=; HttpOnly; Secure; " +
                "SameSite=Lax; Path=/api/callback; Max-Age=0",
        },
    });
}

export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);

    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    const savedState = getCookie(
        request,
        "devblog_oauth_state"
    );

    if (
        !code ||
        !returnedState ||
        !savedState ||
        returnedState !== savedState
    ) {
        return htmlResponse(
            "error",
            { message: "OAuth state validation failed." },
            400
        );
    }

    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        return htmlResponse(
            "error",
            { message: "GitHub OAuth is not configured." },
            500
        );
    }

    try {
        const response = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "User-Agent": "DevBlog-CMS",
                },
                body: JSON.stringify({
                    client_id: env.GITHUB_CLIENT_ID,
                    client_secret: env.GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: `${url.origin}/api/callback`,
                }),
            }
        );

        if (!response.ok) {
            throw new Error("GitHub token request failed.");
        }

        const result = await response.json();

        if (result.error || !result.access_token) {
            return htmlResponse(
                "error",
                {
                    message:
                        result.error_description ||
                        result.error ||
                        "GitHub authentication failed.",
                },
                401
            );
        }

        return htmlResponse("success", {
            token: result.access_token,
            provider: "github",
        });

    } catch (error) {
        console.error("GitHub OAuth callback failed:", error);

        return htmlResponse(
            "error",
            { message: "GitHub authentication failed." },
            500
        );
    }
}
