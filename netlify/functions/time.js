exports.handler = async () => {
  const now = new Date();
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      iso: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      utc: now.toUTCString(),
    }),
  };
};