const MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-flash"];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function parseModelJson(data) {
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    const reason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason;
    throw new Error(reason ? `AI returned no result (${reason}).` : "AI returned no result.");
  }

  try {
    return JSON.parse(text);
  } catch (_) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response was not valid JSON.");
    return JSON.parse(match[0]);
  }
}

function buildRequest(body) {
  if (body.task === "nutrition") {
    const description = String(body.description || "").trim();
    const correction = String(body.correction || "").trim();
    let text = description ? `Description: ${description}\n` : "";
    if (body.previous && correction) {
      text += `Previous estimate: ${JSON.stringify(body.previous)}\nCorrection: ${correction}\n`;
    }

    const parts = [];
    if (body.image) {
      parts.push({ inline_data: { mime_type: "image/jpeg", data: body.image } });
    }
    parts.push({ text: text || "Estimate this meal from the photo." });

    return {
      system: `You are a FOOD-ONLY nutrition estimator. IMPORTANT: If an image is provided, first decide whether the image clearly shows edible food, a meal, a drink, a food package, or a nutrition-related food item. Do NOT analyze emails, documents, people, screens, furniture, receipts, random objects, medicine, or other non-food images as food. If the image does not clearly contain food, return ONLY JSON with {"is_food":false,"name":"No food detected","kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"items":[],"confidence":"high","note":"This photo does not appear to contain food. Take or choose a clear food photo."}. If it clearly contains food, return {"is_food":true,"name":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number,"items":[{"item":string,"grams":number,"kcal":number}],"confidence":"low"|"medium"|"high","note":string}. Estimate portion weight from visual cues or stated amounts and include cooking oils, sauces and dressings. If a correction is given, apply it to the previous estimate. Never invent a food item from a non-food photo.`,
      parts,
      maxOutputTokens: 700,
    };
  }


  if (body.task === "nutritionLabel") {
    const description = String(body.description || "").trim();
    const parts = [];
    if (body.image) parts.push({ inline_data: { mime_type: "image/jpeg", data: body.image } });
    parts.push({ text: description ? `Extra context: ${description}` : "Read this Nutrition Facts label." });
    return {
      system: `You read FOOD and BEVERAGE Nutrition Facts labels only. If the image is not clearly a food/beverage nutrition label, return ONLY JSON {"is_food_label":false,"name":"No food label detected","kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"items":[],"confidence":"high","note":"This does not appear to be a food Nutrition Facts label.","serving_size":""}. Otherwise return {"is_food_label":true,"name":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number,"items":[{"item":string,"grams":number,"kcal":number}],"confidence":"low"|"medium"|"high","note":string,"serving_size":string}. Extract values for ONE labeled serving, not the whole package unless the label itself is for the whole package. Prefer printed values over visual estimation. If a field is unreadable, use 0 and explain it in note.`,
      parts,
      maxOutputTokens: 650,
    };
  }

  if (body.task === "barcode") {
    const direct = String(body.barcodeCode || "").replace(/\D/g, "");
    if (/^\d{8,14}$/.test(direct)) return { directBarcode: direct, barcodeLookup: true };
    const description = String(body.description || "").trim();
    const parts = [];
    if (body.image) parts.push({ inline_data: { mime_type: "image/jpeg", data: body.image } });
    parts.push({ text: description ? `Extract the retail food barcode digits. Product hint: ${description}` : "Extract the retail food barcode digits from this image." });
    return {
      system: `You are a barcode reader. Read the UPC-A, UPC-E, EAN-8, EAN-13, or GTIN digits visible in the image. Reply ONLY JSON: {"barcode":string,"confidence":"low"|"medium"|"high"}. Return an empty barcode if you cannot read it.`,
      parts,
      maxOutputTokens: 120,
      barcodeLookup: true,
    };
  }

  if (body.task === "mealPlan") {
    const r = body.remaining || {};
    const currentTime = String(body.currentTime || "");
    const eaten = String(body.eaten || "nothing yet").slice(0, 1000);
    const preferences = String(body.preferences || "none").slice(0, 1000);
    return {
      system: "You are a practical nutrition coach who writes realistic, easy meals.",
      parts: [{
        text: `Remaining today: ${Number(r.k)||0} kcal, ${Number(r.p)||0}g protein, ${Number(r.c)||0}g carbs, ${Number(r.f)||0}g fat (negative means already over). Current time: ${currentTime}. Already eaten: ${eaten}. Preferences: ${preferences}.\nSplit the remaining macros across the remaining eating occasions for the rest of today (typically 1-4 meals/snacks, ending by about 9 PM) with realistic simple meals and portions. Totals should land close to the remaining numbers. Reply ONLY JSON: {"meals":[{"slot":string,"time":string,"name":string,"desc":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}]}`,
      }],
      maxOutputTokens: 1200,
    };
  }

  if (body.task === "tailoredMeal") {
    const r = body.remaining || {};
    const request = String(body.request || "").slice(0, 1000);
    const eaten = String(body.eaten || "nothing yet").slice(0, 1000);
    const preferences = String(body.preferences || "none").slice(0, 1000);
    const workout = String(body.workout || "No gym workout logged today").slice(0, 1500);
    return {
      system: "You are a practical sports-nutrition coach and recipe creator. Build one realistic dish that matches what the person wants to eat while fitting the remaining macros as closely as practical. Use workout context to guide meal composition, but do not invent exact exercise calorie burn.",
      parts: [{
        text: `The person wants to eat: ${request}. Remaining for today: ${Number(r.k)||0} kcal, ${Number(r.p)||0}g protein, ${Number(r.c)||0}g carbs, ${Number(r.f)||0}g fat. Already eaten today: ${eaten}. Food preferences/restrictions: ${preferences}. Workout context: ${workout}.
Create ONE dish, not a full-day plan. The dish should be realistic, appetizing, and tailored to the request while trying to use most of the remaining calories/macros without going wildly over. Give a simple recipe with ingredient amounts and short steps. Reply ONLY JSON: {"meal":{"name":string,"desc":string,"why_match":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number,"ingredients":[string],"instructions":[string]}}`,
      }],
      maxOutputTokens: 1000,
    };
  }

  if (body.task === "fixMyDay") {
    const r = body.remaining || {};
    const eaten = String(body.eaten || "nothing yet").slice(0, 1500);
    const preferences = String(body.preferences || "none").slice(0, 1000);
    const workout = String(body.workout || "No gym workout logged today").slice(0, 1500);
    const goal = String(body.goal || "maintain");
    const currentTime = String(body.currentTime || "");
    const steps = Number(body.steps) || 0;
    const stepGoal = Number(body.stepGoal) || 0;
    return {
      system: "You are an adaptive daily nutrition and fitness coach. Give concise, practical next actions using only the user's logged information. Do not diagnose medical issues, do not recommend extreme restriction, and do not invent precise workout calorie burn.",
      parts: [{
        text: `Goal: ${goal}. Current time: ${currentTime}. Remaining today: ${Number(r.k)||0} kcal, ${Number(r.p)||0}g protein, ${Number(r.c)||0}g carbs, ${Number(r.f)||0}g fat. Steps: ${steps}/${stepGoal}. Gym: ${workout}. Food already eaten: ${eaten}. Preferences: ${preferences}.
Tell the user the best next moves for the rest of today. Prioritize adherence, protein, realistic food, steps/recovery, and the user's stated goal. If a meal would help, suggest ONE concrete meal that approximately fits the remaining macros. Keep it concise. Reply ONLY JSON: {"headline":string,"summary":string,"actions":[{"title":string,"detail":string}],"meal":{"name":string,"desc":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}}. If no meal is appropriate, use null for meal.`,
      }],
      maxOutputTokens: 900,
    };
  }

  throw new Error("Unknown AI task.");
}


async function lookupBarcode(barcode) {
  const code = String(barcode || "").replace(/\D/g, "");
  if (!/^\d{8,14}$/.test(code)) throw new Error("I couldn't read a valid barcode. Try again closer and in good light.");
  const fields = "code,product_name,brands,serving_size,nutrition_data_per,nutriments";
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${encodeURIComponent(fields)}`, {
    headers: { "User-Agent": "MacrosNutritionApp/1.0 (barcode lookup)" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status !== 1 || !data.product) {
    throw new Error(`Barcode ${code} was read, but the product was not found. Try the nutrition-label mode instead.`);
  }
  const p = data.product, n = p.nutriments || {};
  const serving = p.serving_size || "1 serving";
  const servingVals = [n["energy-kcal_serving"], n.proteins_serving, n.carbohydrates_serving, n.fat_serving];
  const hasServing = servingVals.some(v => Number.isFinite(Number(v)));
  const kcal = hasServing ? Number(n["energy-kcal_serving"] || 0) : Number(n["energy-kcal_100g"] || 0);
  const protein = hasServing ? Number(n.proteins_serving || 0) : Number(n.proteins_100g || 0);
  const carbs = hasServing ? Number(n.carbohydrates_serving || 0) : Number(n.carbohydrates_100g || 0);
  const fat = hasServing ? Number(n.fat_serving || 0) : Number(n.fat_100g || 0);
  const name = [p.product_name, p.brands].filter(Boolean).join(" — ") || `Product ${code}`;
  return {
    name, kcal, protein_g: protein, carbs_g: carbs, fat_g: fat, barcode: code, serving_size: serving,
    items: [{ item: hasServing ? serving : "100 g", grams: hasServing ? 0 : 100, kcal }],
    confidence: "high",
    note: hasServing ? `Values from Open Food Facts for ${serving}.` : "Serving-specific values were unavailable, so these are per 100 g. Adjust the portion before logging.",
  };
}

export async function onRequestPost(context) {
  const apiKey = context.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(500, { error: "Server AI key is not configured. Add GEMINI_API_KEY in Cloudflare Variables and Secrets." });
  }

  const len = Number(context.request.headers.get("content-length") || 0);
  if (len > 8_000_000) return json(413, { error: "Image is too large. Try a smaller photo." });

  let body;
  try {
    body = await context.request.json();
  } catch (_) {
    return json(400, { error: "Invalid request." });
  }

  let request;
  try {
    request = buildRequest(body);
  } catch (err) {
    return json(400, { error: err.message || "Invalid request." });
  }

  if (request.directBarcode) {
    try { return json(200, { result: await lookupBarcode(request.directBarcode), model: "local-barcode-detector" }); }
    catch (err) { return json(404, { error: err.message || "Product not found." }); }
  }

  let lastError = null;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: request.system }] },
              contents: [{ role: "user", parts: request.parts }],
              generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: request.maxOutputTokens,
                thinkingConfig: { thinkingLevel: "minimal" },
              },
            }),
          }
        );

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          const parsed = parseModelJson(data);

          // Hard server-side guard: image analysis is food-only.
          if (body.task === "nutrition" && body.image && parsed.is_food !== true) {
            return json(422, { error: parsed.note || "No food detected. Take or choose a clear food photo." });
          }
          if (body.task === "nutritionLabel" && parsed.is_food_label !== true) {
            return json(422, { error: parsed.note || "No food Nutrition Facts label detected." });
          }

          if (request.barcodeLookup) {
            const result = await lookupBarcode(parsed.barcode);
            result.scan_confidence = parsed.confidence || "medium";
            return json(200, { result, model });
          }
          return json(200, { result: parsed, model });
        }

        const message = data?.error?.message || `AI request failed (${response.status}).`;
        lastError = new Error(message);
        if ([429, 500, 502, 503, 504].includes(response.status)) {
          await wait(500 * (attempt + 1));
          continue;
        }
        if ([400, 404].includes(response.status)) break;
        throw lastError;
      } catch (err) {
        lastError = err;
        if (attempt === 0) {
          await wait(400);
          continue;
        }
      }
    }
  }

  return json(502, { error: lastError?.message || "AI is temporarily unavailable. Please try again." });
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json(405, { error: "Method not allowed." });
}
