export async function sendInstagramMessage(
  igUserId: string,
  recipientId: string,
  messageText: string,
  accessToken: string
) {
  const url = `https://graph.instagram.com/v21.0/${igUserId}/messages`;
  
  const payload = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: messageText,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[IG Client] Error sending message:", data);
      throw new Error(`Instagram API Error: ${res.statusText}`);
    }

    console.log("[IG Client] Message sent successfully", data);
    return data;
  } catch (error) {
    console.error("[IG Client] Failed to send message", error);
    throw error;
  }
}
