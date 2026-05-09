export default {
  async fetch(request, env) {
    // Only accept POST requests
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Verify the API key on every request
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== env.WORKER_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);

    // Route: Single email (transactional)
    if (url.pathname === "/") {
      return handleSingleEmail(request, env);
    }

    // Route: Batch email (daily digest)
    if (url.pathname === "/batch") {
      return handleBatchEmail(request, env);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }
};

// Sends a single email via Resend
async function handleSingleEmail(request, env) {
  const payload = await request.json();

  if (!payload.to || !payload.subject || !payload.html) {
    return Response.json({ error: "Missing required fields (to, subject, html)" }, { status: 400 });
  }

  if (!env.FROM_EMAIL && !payload.from) {
    return Response.json({ error: "FROM_EMAIL is not configured on the gateway" }, { status: 500 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: payload.from || env.FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html
    })
  });

  const data = await res.json();

  if (!res.ok) {
    return Response.json({ success: false, error: data }, { status: res.status });
  }

  return Response.json({ success: true, data });
}

// Sends a batch of up to 100 emails in a single Resend API call
async function handleBatchEmail(request, env) {
  const { emails } = await request.json();

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return Response.json({ error: "Missing or empty emails array" }, { status: 400 });
  }

  if (emails.length > 100) {
    return Response.json({ error: "Batch size cannot exceed 100" }, { status: 400 });
  }

  if (!env.FROM_EMAIL && emails.some(e => !e.from)) {
    return Response.json({ error: "FROM_EMAIL is not configured on the gateway" }, { status: 500 });
  }

  // Ensure 'from' is set for all emails if not provided
  const processedEmails = emails.map(email => ({
    ...email,
    from: email.from || env.FROM_EMAIL
  }));

  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(processedEmails)
  });

  const data = await res.json();

  if (!res.ok) {
    return Response.json({ success: false, error: data }, { status: res.status });
  }

  return Response.json({ success: true, data });
}
