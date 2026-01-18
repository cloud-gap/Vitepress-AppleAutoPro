export async function onRequest(context) {
  // 从环境变量中获取 apiUrl 的值
  const apiUrl = context.env.API_URL;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
         'Content-Type': 'application/json',
         'Access-Control-Allow-Origin': '*'
      },
    });
  } catch (error) {
    return new Response('Error fetching data', { status: 500 });
  }
}
