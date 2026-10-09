export function onRequestGet(context) {
    return new Response(
        "DevBlog OAuth Function is running.",
        {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8"
            }
        }
    );
}