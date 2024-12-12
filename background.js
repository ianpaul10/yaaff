const LLM_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "processFormStructure") {
    processWithLLM(request.formStructure, request.piiKeys)
      .then((mappings) => sendResponse({ mappings: mappings }))
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously
  }
});

async function processWithLLM(formStructure, piiKeys) {
  const prompt = `
    Given a form structure and available PII keys, determine the best mapping.
    Form structure: ${JSON.stringify(formStructure)}
    Available PII keys: ${JSON.stringify(piiKeys)}
    Return a JSON array of mappings with xpath and piiKey for each field.
    DO NOT HALUCINATE.
  `;

  try {
    // Get API key from storage
    const result = await chrome.storage.local.get(['apiKey']);
    if (!result.apiKey) {
      throw new Error('API key not found. Please set your OpenAI API key in the extension popup.');
    }

    const response = await fetch(LLM_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${result.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        // prompt: prompt,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();
    // Parse and validate LLM response
    // This is a simplified example - you'll need to adapt based on your LLM's response format
    return JSON.parse(data.choices[0].text);
  } catch (error) {
    console.error("LLM processing error:", error);
    throw error;
  }
}
