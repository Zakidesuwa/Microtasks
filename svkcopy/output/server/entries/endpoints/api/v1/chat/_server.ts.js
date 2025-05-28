const GET = () => {
  return new Response("This endpoint only supports POST requests.", {
    status: 405
  });
};
const POST = async ({ request }) => {
  const { message } = await request.json();
  {
    return new Response(JSON.stringify({ error: "API key not found." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
export {
  GET,
  POST
};
