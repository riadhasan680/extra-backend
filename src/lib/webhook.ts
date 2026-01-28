import crypto from "crypto"

export const sendWebhook = async (url: string, secret: string, event: string, payload: any) => {
  if (!url) return

  const timestamp = Date.now()
  const body = JSON.stringify({
    event,
    created_at: timestamp,
    data: payload,
  })

  let signature = ""
  if (secret) {
    signature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex")
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Medusa-Signature": signature,
        "X-Medusa-Event": event,
        "X-Medusa-Timestamp": timestamp.toString(),
      },
      body: body,
    })

    if (!response.ok) {
        console.warn(`Webhook request failed with status ${response.status} ${response.statusText}`)
    } else {
        console.log(`Webhook sent to ${url} for event ${event}`)
    }
  } catch (error) {
    console.error(`Failed to send webhook to ${url}:`, error)
  }
}
